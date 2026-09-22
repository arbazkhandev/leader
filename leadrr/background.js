// Query cache to prevent redundant searches
const searchCache = new Map();

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
  
  if (request.action === 'searchGoogleForWebsite' || request.action === 'searchOnlineForWebsite') {
    const query = (request.query || '').trim();
    if (!query) {
      sendResponse({ success: false, error: 'Empty query' });
      return true;
    }

    if (searchCache.has(query)) {
      sendResponse(searchCache.get(query));
      return true;
    }

    performMultiEngineSearch(query)
      .then((result) => {
        // Cache result (limit cache size to 300 entries)
        if (searchCache.size > 300) {
          const firstKey = searchCache.keys().next().value;
          searchCache.delete(firstKey);
        }
        searchCache.set(query, result);
        sendResponse(result);
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.toString() });
      });

    return true; // Indicates async response
  }
});

// Blocked aggregator, search engine, social and directory domains
const blockedEnginesAndAggregators = [
  'google.', 'gstatic.', 'googleapis.', 'g.co', 'w3.org', 'schema.org',
  'bing.com', 'duckduckgo.com', 'yahoo.com', 'baidu.com', 'yandex.ru',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com',
  'pinterest.com', 'tiktok.com', 'threads.net', 'youtube.com', 'wikipedia.org',
  'yelp.com', 'tripadvisor.com', 'yellowpages.com', 'yellowpages.pk', 'dnb.com',
  'zoominfo.com', 'bbb.org', 'mapquest.com', 'foursquare.com', 'linktr.ee',
  'ubereats.com', 'foodpanda.com', 'foodpanda.pk', 'doordash.com', 'grubhub.com',
  'deliveroo.', 'zomato.com', 'talabat.com', 'opentable.com', 'tablecheck.com',
  'resy.com', 'chownow.com', 'sevenrooms.com', 'careem.com', 'daraz.pk', 'olx.com',
  'pakwheels.com', 'justdial.com', 'indiamart.com', 'trustpilot.com'
];

const socialDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com'];
const directoryDomains = ['yelp.', 'tripadvisor.', 'yellowpages.', 'foursquare.com', 'zoominfo.com', 'dnb.com', 'bbb.org', 'linktr.ee'];

// Validate if URL belongs to an independent business
function isIndependentBusinessWebsite(urlStr) {
  if (!urlStr || !urlStr.startsWith('http')) return false;
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return !blockedEnginesAndAggregators.some(blocked => host.includes(blocked));
  } catch (e) {
    return false;
  }
}

// Multi-engine search fallback (DDG HTML -> Bing -> DDG fallback)
async function performMultiEngineSearch(query) {
  let fallbackSocial = null;
  let fallbackDirectory = null;

  // Attempt 1: DuckDuckGo HTML with "official website"
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' official website')}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(ddgUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const uddgMatches = [...html.matchAll(/uddg=([^&"'>]+)/gi)];
      for (const m of uddgMatches) {
        const candidate = decodeURIComponent(m[1]);
        if (isIndependentBusinessWebsite(candidate)) {
          return { success: true, finalUrl: candidate, type: 'BUSINESS_WEBSITE' };
        }
        const host = (new URL(candidate)).hostname.toLowerCase();
        if (!fallbackSocial && socialDomains.some(s => host.includes(s))) {
          fallbackSocial = candidate;
        }
        if (!fallbackDirectory && directoryDomains.some(d => host.includes(d))) {
          fallbackDirectory = candidate;
        }
      }
    }
  } catch (e) {}

  // Attempt 2: DuckDuckGo HTML direct query
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(ddgUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const uddgMatches = [...html.matchAll(/uddg=([^&"'>]+)/gi)];
      for (const m of uddgMatches) {
        const candidate = decodeURIComponent(m[1]);
        if (isIndependentBusinessWebsite(candidate)) {
          return { success: true, finalUrl: candidate, type: 'BUSINESS_WEBSITE' };
        }
        const host = (new URL(candidate)).hostname.toLowerCase();
        if (!fallbackSocial && socialDomains.some(s => host.includes(s))) {
          fallbackSocial = candidate;
        }
        if (!fallbackDirectory && directoryDomains.some(d => host.includes(d))) {
          fallbackDirectory = candidate;
        }
      }
    }
  } catch (e) {}

  // Attempt 3: Bing Search
  try {
    const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(bingUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const bingLinks = [...html.matchAll(/<li class="b_algo"[^>]*>[\s\S]*?<a[^>]+href="(https?:\/\/[^"]+)"/gi)];
      for (const m of bingLinks) {
        let candidate = m[1];
        if (candidate.includes('bing.com/ck/')) {
          const uMatch = candidate.match(/u=a1([a-zA-Z0-9+/=_-]+)/);
          if (uMatch) {
            try {
              let base64 = uMatch[1].replace(/-/g, '+').replace(/_/g, '/');
              while (base64.length % 4) base64 += '=';
              candidate = atob(base64);
            } catch (err) {}
          }
        }
        if (isIndependentBusinessWebsite(candidate)) {
          return { success: true, finalUrl: candidate, type: 'BUSINESS_WEBSITE' };
        }
      }
    }
  } catch (e) {}

  // Return fallback social or directory if found
  if (fallbackSocial) {
    return { success: true, finalUrl: fallbackSocial, type: 'SOCIAL' };
  }
  if (fallbackDirectory) {
    return { success: true, finalUrl: fallbackDirectory, type: 'DIRECTORY' };
  }

  return { success: false, error: 'No business website found online' };
}
