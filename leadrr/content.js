// Core Scraping State
let scrapeTimeout = null;
let lastScrollHeight = 0;
let scrollAttempts = 0;
let noNewLeadsAttempts = 0;

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START') {
    startScraping(request.delay);
    sendResponse({ status: 'started' });
  } else if (request.action === 'STOP') {
    stopScraping();
    sendResponse({ status: 'stopped' });
  } else if (request.action === 'UPDATE_DELAY') {
    // Scroll delay updates are read dynamically from chrome.storage.local inside the loop
    sendResponse({ status: 'delay_updated' });
  }
  return true;
});

// Helper: Promise wrapper for chrome.storage.local.get
function getStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (res) => resolve(res));
  });
}

// Helper: Promise wrapper for chrome.storage.local.set
function setStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => resolve());
  });
}

// Locate scrollable feed container in Google Maps sidebar
function findScrollableContainer() {
  // standard maps selector is a div with role="feed"
  let container = document.querySelector('div[role="feed"]');
  if (container) return container;

  // Heuristic: search all scrollable divs containing place links
  const divs = document.querySelectorAll('div');
  for (let div of divs) {
    if (div.scrollHeight > div.clientHeight) {
      const testPlace = div.querySelector('a[href*="/maps/place/"]');
      if (testPlace) {
        return div;
      }
    }
  }
  return null;
}

// Find card element wrapper for a place link
function getCardContainer(link) {
  // Look for standard article tags or list item classes
  let card = link.closest('div[role="article"]') || 
             link.closest('.Nv2y1d') || 
             link.closest('.Ua68je') ||
             link.closest('.bf454g');

  if (card) return card;

  // Dynamic fallback: traverse up parents until we find a reasonable card container
  let parent = link.parentElement;
  while (parent && parent !== document.body) {
    if (parent.tagName === 'DIV' && parent.classList.length > 0) {
      // Must contain this link and not be too large
      if (parent.querySelector('a[href*="/maps/place/"]') === link && parent.scrollHeight < 400) {
        card = parent;
        break;
      }
    }
    parent = parent.parentElement;
  }
  return card || link;
}

// Extract and parse details (Category, Address, Phone) from card DOM
function parseDetails(card, name) {
  let category = '';
  let address = '';
  let phone = '';

  const elements = card.querySelectorAll('div, span');
  const detailLines = [];

  elements.forEach(el => {
    // Select only leaf nodes with text
    if (el.children.length === 0 && el.textContent.trim()) {
      const text = el.textContent.trim();
      // Skip the name of the place and avoid duplicate tokens
      if (text !== name && !detailLines.includes(text)) {
        detailLines.push(text);
      }
    }
  });

  // Split lines on standard Google Maps separator (middle dot)
  let tokens = [];
  detailLines.forEach(line => {
    if (line.includes('·')) {
      const lineTokens = line.split('·').map(t => t.trim());
      tokens.push(...lineTokens);
    } else {
      tokens.push(line);
    }
  });

  // Remove duplicates and empty tokens
  tokens = [...new Set(tokens)].filter(t => t.length > 0);

  // Phone number matcher regex (e.g. +1 23-456-7890, 042-1234567, 03211234567, etc.)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
  const priceRegex = /^[\$\£\€\¥\₹\s]+$/;
  const hoursKeywords = ['Open', 'Closed', 'Closes', 'Opens', '24 hours', 'pm', 'am', 'PM', 'AM', 'Daily', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  tokens.forEach(token => {
    if (priceRegex.test(token)) return;
    if (hoursKeywords.some(kw => token.includes(kw))) return;

    if (phoneRegex.test(token)) {
      const match = token.match(phoneRegex);
      if (match && !phone) {
        phone = match[0];
      }
      return;
    }

    // Skip rating digits or review counts like "4.5" or "(123)"
    if (/^\d\.\d$/.test(token) || /^\(\d+\)$/.test(token)) return;

    // First safe short text token is usually Category
    if (!category && token.length < 35 && !/\d{3,}/.test(token)) {
      category = token;
      return;
    }

    // Tokens containing numbers, commas, or specific terms represent the Address
    if (!address && token.length > 6 && (/\d/.test(token) || token.includes(',') || token.includes('Street') || token.includes('Rd') || token.includes('St') || token.includes('Ave') || token.includes('Floor') || token.includes('Block') || token.includes('Sector') || token.includes('Phase'))) {
      address = token;
    }
  });

  // Address fallback: find any remaining token that isn't category or phone
  if (!address) {
    const candidate = tokens.find(token => {
      if (token === category || token === phone) return false;
      if (priceRegex.test(token)) return false;
      if (hoursKeywords.some(kw => token.includes(kw))) return false;
      if (phoneRegex.test(token)) return false;
      if (/^\d\.\d$/.test(token) || /^\(\d+\)$/.test(token)) return false;
      return token.length > 5;
    });
    if (candidate) address = candidate;
  }

  return { category, address, phone };
}

// Clean and decode potential Google redirect URLs
function cleanExtractedUrl(href) {
  if (!href) return '';
  if (href.includes('google.com/url?') || (href.includes('google.') && href.includes('/url?'))) {
    try {
      const urlParams = new URLSearchParams(href.split('?')[1]);
      const extracted = urlParams.get('q') || urlParams.get('url');
      if (extracted) return extracted;
    } catch (e) {}
  }
  return href;
}

// Validate that a link is an actual business website and not an aggregator/booking/internal link
function isValidBusinessWebsite(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();

    // Must have a valid domain dot
    if (!host.includes('.') || host.startsWith('.') || host.endsWith('.')) {
      return false;
    }

    // Ignore Google internal links & services
    if (
      host.includes('google.') || 
      host.includes('gstatic.') || 
      host.includes('googleapis.') || 
      host.includes('g.co') || 
      host.includes('goo.gl') ||
      host.includes('ggpht.com') ||
      host.includes('w3.org') || 
      host.includes('schema.org')
    ) {
      return false;
    }

    // Ignore third party booking/ordering engines
    const bookingPlatforms = [
      'opentable.com', 'tablecheck.com', 'resy.com', 'sevenrooms.com',
      'chownow.com', 'foodpanda.com', 'foodpanda.pk', 'ubereats.com',
      'doordash.com', 'grubhub.com', 'deliveroo.com', 'zomato.com',
      'talabat.com', 'careem.com', 'daraz.pk', 'olx.com', 'pakwheels.com',
      'swiggy.com', 'justdial.com', 'indiamart.com', 'trustpilot.com'
    ];
    if (bookingPlatforms.some(b => host === b || host.endsWith('.' + b))) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

// Extract official Website link strictly from Google Maps card Website button
function extractWebsiteFromCard(card) {
  if (!card) return '';

  // 1. Check Google Maps authoritative Website button selectors
  const authoritySelectors = [
    'a[data-item-id="authority"]',
    'a[data-value="Website"]',
    'a[data-value="website"]',
    'a[aria-label^="Website" i]',
    'a[aria-label*="Website:" i]',
    'a[aria-label*="Website" i]',
    'a[data-tooltip*="website" i]',
    'a[aria-label*="sitio web" i]',
    'a[aria-label*="site web" i]',
    'a[aria-label*="webseite" i]'
  ];

  for (const selector of authoritySelectors) {
    const el = card.querySelector(selector);
    if (el) {
      const rawHref = el.getAttribute('href') || el.getAttribute('data-attribution-url') || '';
      const clean = cleanExtractedUrl(rawHref);
      if (clean && isValidBusinessWebsite(clean)) {
        return clean;
      }
    }
  }

  // 2. Explicit Website check on anchor elements inside card
  const cardLinks = Array.from(card.querySelectorAll('a'));
  for (const a of cardLinks) {
    const text = (a.textContent || '').trim().toLowerCase();
    const aria = (a.getAttribute('aria-label') || '').toLowerCase();
    const tooltip = (a.getAttribute('data-tooltip') || '').toLowerCase();
    const dataVal = (a.getAttribute('data-value') || '').toLowerCase();
    const itemId = (a.getAttribute('data-item-id') || '').toLowerCase();

    const isExplicitWebsite = 
      itemId === 'authority' ||
      dataVal === 'website' ||
      text === 'website' ||
      text === 'site' ||
      text === 'sitio web' ||
      tooltip === 'open website' ||
      tooltip === 'website' ||
      aria.startsWith('website:') ||
      aria === 'website' ||
      aria.includes('open website');

    if (isExplicitWebsite) {
      const rawHref = a.getAttribute('href') || a.getAttribute('data-attribution-url') || '';
      const clean = cleanExtractedUrl(rawHref);
      if (clean && isValidBusinessWebsite(clean)) {
        return clean;
      }
    }
  }

  // No official website button on this listing
  return '';
}

// Clean business name for accurate search queries
function cleanBusinessNameForSearch(name) {
  if (!name) return '';
  return name
    .replace(/\s*[-–—|]\s*(?:Branch|Outlet|Campus|Store|Shop|\d+).*/i, '') // Remove branch tags
    .replace(/[^\w\s\u0600-\u06FF]/gi, ' ') // Keep letters, digits, Urdu/Arabic
    .replace(/\s+/g, ' ')
    .trim();
}

// Score and Tier calculation logic
function calculateScore(lead, websiteStatus) {
  let score = 0;
  let reasons = [];

  // Website logic
  if (websiteStatus === 'NO_WEBSITE') {
    score += 40; reasons.push('NO_WEBSITE (+40)');
  } else if (websiteStatus === 'BROKEN_WEBSITE') {
    score += 35; reasons.push('BROKEN_WEBSITE (+35)');
  } else if (websiteStatus === 'SOCIAL_ONLY') {
    score += 30; reasons.push('SOCIAL_ONLY (+30)');
  } else if (websiteStatus === 'DIRECTORY_ONLY') {
    score += 28; reasons.push('DIRECTORY_ONLY (+28)');
  } else if (websiteStatus === 'DOMAIN_ONLY') {
    score += 20; reasons.push('DOMAIN_ONLY (+20)');
  } else if (websiteStatus === 'VALID_WEBSITE') {
    score += 0; reasons.push('VALID_WEBSITE (0)');
  }

  // Phone
  if (lead.phone) {
    score += 15; reasons.push('Has phone (+15)');
  }
  // Email
  if (lead.email) {
    score += 10; reasons.push('Has email (+10)');
  }
  
  // Rating
  const ratingNum = parseFloat(lead.rating || '0');
  const reviewsStr = String(lead.reviewsCount || '').replace(/,/g, '').replace('K', '000');
  const reviewsNum = parseFloat(reviewsStr || '0');

  if (ratingNum >= 4.0 && reviewsNum >= 20) {
    score += 15; reasons.push('Rating 4.0+ & 20+ reviews (+15)');
  } else if (ratingNum >= 3.0 && ratingNum <= 3.9 && reviewsNum > 0) {
    score += 8; reasons.push('Rating 3.0-3.9 with reviews (+8)');
  }

  // Instagram
  if (lead.instagram) {
    score += 5; reasons.push('Has Instagram (+5)');
  }

  // Category
  const catLower = (lead.category || '').toLowerCase();
  if (['restaurant', 'clinic', 'salon', 'gym', 'shop', 'dentist', 'cafe', 'hotel', 'agency', 'store'].some(c => catLower.includes(c))) {
    score += 10; reasons.push('Category bonus (+10)');
  }

  let tier = '❄️ LOW';
  let status = 'VERIFIED';
  if (score >= 70) {
    tier = '🔥 HOT';
    status = 'QUALIFIED';
  } else if (score >= 45) {
    tier = '⚡ WARM';
    status = 'QUALIFIED';
  }

  return { score, tier, status, qualificationReason: reasons.join(', ') };
}

// Start Scraper Loop
async function startScraping(defaultDelay) {
  stopScraping(); // Clean up previous loop if running

  const container = findScrollableContainer();
  if (!container) {
    alert("Scraper: Could not find results pane. Please perform a search in Google Maps first!");
    await setStorage({ isScraping: false });
    return;
  }

  console.log("Scraper: Started scanning results...");
  await setStorage({ isScraping: true });

  lastScrollHeight = container.scrollHeight;
  scrollAttempts = 0;
  noNewLeadsAttempts = 0;

  async function step() {
    // Fetch state from storage
    const state = await getStorage(['isScraping', 'leads', 'scrollDelay']);
    if (!state.isScraping) {
      stopScraping();
      return;
    }

    let leads = state.leads || [];
    const startCount = leads.length;

    // Scrape all visible cards
    const placeLinks = Array.from(container.querySelectorAll('a[href*="/maps/place/"]'));
    
    // We process links sequentially to avoid overwhelming background search
    for (const link of placeLinks) {
      const href = link.getAttribute('href');
      const fullUrl = href.startsWith('http') ? href : `https://www.google.com${href}`;

      // Unique constraint on URL
      if (leads.some(item => item.link === fullUrl)) continue;

      const card = getCardContainer(link);
      
      // Parse business name
      const nameEl = card.querySelector('div.qBF1Pd') || card.querySelector('div.fontHeadlineSmall') || link;
      const name = nameEl ? nameEl.textContent.trim() : '';
      if (!name) continue;

      // Parse rating
      let rating = '';
      let reviewsCount = '';
      const ratingEl = card.querySelector('span.MW4etd') || card.querySelector('span[role="img"][aria-label*="stars"]');
      if (ratingEl) {
        const ratingText = ratingEl.textContent.trim();
        const ratingMatch = ratingText.match(/([0-9][.,][0-9])/);
        if (ratingMatch) rating = ratingMatch[1];
      }

      // Parse reviews count
      const reviewsEl = card.querySelector('span.UY7F9') || card.querySelector('span.fontBodyMedium');
      if (reviewsEl) {
        const revText = reviewsEl.textContent.trim();
        const countMatch = revText.match(/\(([\d,.]+K?)\)/);
        if (countMatch) reviewsCount = countMatch[1];
      }

      // Parse details (Category, Address, Phone)
      const { category, address, phone } = parseDetails(card, name);

      // 1. Extract Website URL strictly from the Google Maps listing's Website button
      const rawWebsite = extractWebsiteFromCard(card);
      let websiteUrl = rawWebsite || '';
      let email = '';
      let instagram = '';
      let websiteStatus = 'NO_WEBSITE';

      // 2. If a website button exists, evaluate and verify its status
      if (websiteUrl) {
        const urlLower = websiteUrl.toLowerCase();
        
        // Social platforms
        if (urlLower.includes('facebook.com') || urlLower.includes('instagram.com') || urlLower.includes('twitter.com') || urlLower.includes('x.com') || urlLower.includes('linkedin.com') || urlLower.includes('tiktok.com') || urlLower.includes('pinterest.com') || urlLower.includes('youtube.com')) {
          websiteStatus = 'SOCIAL_ONLY';
          if (urlLower.includes('instagram.com')) {
            instagram = websiteUrl;
          }
        } 
        // Directories & aggregators
        else if (urlLower.includes('yelp.') || urlLower.includes('tripadvisor.') || urlLower.includes('yellowpages.') || urlLower.includes('linktr.ee') || urlLower.includes('foursquare.com')) {
          websiteStatus = 'DIRECTORY_ONLY';
        } 
        // Independent business website: verify online status
        else {
          try {
            const resp = await new Promise(resolve => {
              chrome.runtime.sendMessage({ action: 'fetchWebsite', url: websiteUrl }, resolve);
            });
            
            if (resp && resp.success) {
              const html = resp.html || '';

              // Extract clean email (filter false positives like sentry, example, image names)
              const emailMatches = html.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
              for (const m of emailMatches) {
                const foundEmail = m[1];
                const lower = foundEmail.toLowerCase();
                if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.webp') && !lower.endsWith('.svg') && !lower.includes('sentry') && !lower.includes('example.com') && !lower.includes('w3.org') && !lower.includes('domain.com')) {
                  email = foundEmail;
                  break;
                }
              }

              // Extract Instagram profile link if embedded on website
              const igMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.-]{3,30})/i);
              if (igMatch && !instagram) {
                const username = igMatch[1];
                const ignoredIg = ['p', 'explore', 'reel', 'reels', 'stories', 'accounts', 'about', 'legal', 'developer'];
                if (!ignoredIg.includes(username.toLowerCase())) {
                  instagram = `https://www.instagram.com/${username}/`;
                }
              }

              // Placeholder or parked domain detection
              if (html.length < 250) {
                websiteStatus = 'DOMAIN_ONLY';
              } else {
                websiteStatus = 'VALID_WEBSITE';
              }
            } else {
              // Website unreachable or returned 404/500
              websiteStatus = 'BROKEN_WEBSITE';
            }
          } catch (err) {
            websiteStatus = 'BROKEN_WEBSITE';
          }
        }
      } else {
        // Business has NO website listed on Google Maps
        websiteStatus = 'NO_WEBSITE';
      }

      const leadBase = {
        name,
        rating,
        reviewsCount,
        category,
        address,
        phone,
        link: fullUrl,
        websiteUrl,
        websiteStatus,
        email,
        instagram
      };

      const scoring = calculateScore(leadBase, websiteStatus);

      leads.push({
        ...leadBase,
        score: scoring.score,
        tier: scoring.tier,
        status: scoring.status,
        qualificationReason: scoring.qualificationReason
      });
    }

    // Check if new leads were found
    if (leads.length > startCount) {
      await setStorage({ leads: leads });
      noNewLeadsAttempts = 0;
    } else {
      noNewLeadsAttempts++;
    }

    // Scroll to the bottom of the feed container to load more items
    container.scrollTop = container.scrollHeight;
    
    // Check end condition 1: Google maps end signature elements
    const reachedEndMessage = Array.from(container.querySelectorAll('span, p, div')).some(el => {
      const text = el.textContent.trim();
      return text.includes("You've reached the end of the list") || 
             text.includes("Ending of search results") || 
             text.includes("Ending of results");
    });

    if (reachedEndMessage) {
      console.log("Scraper: End of results footer detected.");
      stopScraping();
      return;
    }

    // Check end condition 2: container scroll height not changing
    const currentScrollHeight = container.scrollHeight;
    const isAtBottom = container.scrollTop + container.clientHeight >= currentScrollHeight - 15;

    if (isAtBottom && currentScrollHeight === lastScrollHeight) {
      scrollAttempts++;
      // If we attempt to scroll 5 times and get no new height or new leads, stop
      if (scrollAttempts >= 5 && noNewLeadsAttempts >= 5) {
        console.log("Scraper: Reached end of scroll container, no more leads loading.");
        stopScraping();
        return;
      }
    } else {
      scrollAttempts = 0;
    }

    lastScrollHeight = currentScrollHeight;

    // Schedule next scroll tick
    const currentDelay = state.scrollDelay || defaultDelay;
    scrapeTimeout = setTimeout(step, currentDelay);
  }

  // Execute first tick
  step();
}

// Stop Scraper Loop
function stopScraping() {
  if (scrapeTimeout) {
    clearTimeout(scrapeTimeout);
    scrapeTimeout = null;
  }
  chrome.storage.local.set({ isScraping: false });
  console.log("Scraper: Stopped scanning results.");
}
