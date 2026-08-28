chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchWebsite') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(request.url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow',
      signal: controller.signal
    })
      .then(async (response) => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          sendResponse({ success: false, status: response.status });
          return;
        }
        try {
          const html = await response.text();
          sendResponse({ success: true, html: html, finalUrl: response.url });
        } catch (e) {
          sendResponse({ success: false, error: 'Failed to read response' });
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: error.toString() });
      });
    return true; // Indicates async response
  } 
  
  if (request.action === 'searchGoogleForWebsite') {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(request.query)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    })
      .then(async (response) => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          sendResponse({ success: false, status: response.status });
          return;
        }
        try {
          const html = await response.text();
          const targetUrl = extractOrganicWebsite(html);
          if (targetUrl) {
            sendResponse({ success: true, finalUrl: targetUrl });
          } else {
            sendResponse({ success: false, error: 'No valid business website found' });
          }
        } catch (e) {
          sendResponse({ success: false, error: 'Failed to read search response' });
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        sendResponse({ success: false, error: error.toString() });
      });
    return true; // Indicates async response
  }
});

// Helper: Extract valid business website URL from Google Search HTML
function extractOrganicWebsite(html) {
  const candidateUrls = [];

  // Pattern 1: Extract all links embedded in /url?q=... or /url?url=...
  const redirectRegex = /\/url\?(?:[^"'>]*&)?(?:q|url)=(https?[^"'>&]+)/gi;
  let match;
  while ((match = redirectRegex.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(match[1]);
      candidateUrls.push(decoded);
    } catch (e) {}
  }

  // Pattern 2: Extract standard direct <a href="https://..."> links
  const directLinkRegex = /<a[^>]+href=["'](https?:\/\/[^"'>]+)["']/gi;
  while ((match = directLinkRegex.exec(html)) !== null) {
    candidateUrls.push(match[1]);
  }

  // Filter against Google, Social, Directory, and Aggregator domains
  for (const urlStr of candidateUrls) {
    if (isValidDiscoveredWebsite(urlStr)) {
      return urlStr;
    }
  }

  return null;
}

function isValidDiscoveredWebsite(urlStr) {
  if (!urlStr || !urlStr.startsWith('http')) return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // Block all Google domains and services
    if (
      host.includes('google.') ||
      host.includes('gstatic.') ||
      host.includes('googleapis.') ||
      host.includes('g.co') ||
      host.includes('w3.org') ||
      host.includes('schema.org')
    ) {
      return false;
    }

    // Block common directories, booking engines, food delivery, and social networks
    const blockedDomains = [
      'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com',
      'pinterest.com', 'tiktok.com', 'threads.net', 'youtube.com', 'wikipedia.org',
      'yelp.com', 'tripadvisor.com', 'yellowpages.com', 'yellowpages.pk', 'dnb.com',
      'zoominfo.com', 'bbb.org', 'mapquest.com', 'foursquare.com', 'linktr.ee',
      'ubereats.com', 'foodpanda.com', 'foodpanda.pk', 'doordash.com', 'grubhub.com',
      'deliveroo.com', 'zomato.com', 'talabat.com', 'opentable.com', 'tablecheck.com',
      'resy.com', 'chownow.com', 'sevenrooms.com', 'careem.com'
    ];

    if (blockedDomains.some(b => host === b || host.endsWith('.' + b))) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}
