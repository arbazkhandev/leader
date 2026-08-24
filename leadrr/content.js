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
  const hoursKeywords = ['Open', 'Closed', 'Closes', 'Opens', '24 hours', 'pm', 'am', 'PM', 'AM'];

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
    if (!address && token.length > 6 && (/\d/.test(token) || token.includes(',') || token.includes('Street') || token.includes('Rd') || token.includes('St') || token.includes('Ave'))) {
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
    const placeLinks = container.querySelectorAll('a[href*="/maps/place/"]');
    
    placeLinks.forEach(link => {
      const href = link.getAttribute('href');
      const fullUrl = href.startsWith('http') ? href : `https://www.google.com${href}`;

      // Unique constraint on URL
      if (leads.some(item => item.link === fullUrl)) return;

      const card = getCardContainer(link);
      
      // Parse business name
      const nameEl = card.querySelector('div.qBF1Pd') || card.querySelector('div.fontHeadlineSmall') || link;
      const name = nameEl ? nameEl.textContent.trim() : '';
      if (!name) return;

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

      // Parse details
      const { category, address, phone } = parseDetails(card, name);

      leads.push({
        name,
        rating,
        reviewsCount,
        category,
        address,
        phone,
        link: fullUrl
      });
    });

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
