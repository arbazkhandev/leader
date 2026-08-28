chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchWebsite') {
    fetch(request.url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
      redirect: 'follow'
    })
      .then(async (response) => {
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
        sendResponse({ success: false, error: error.toString() });
      });
  } else if (request.action === 'searchGoogleForWebsite') {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(request.query)}`;
    fetch(searchUrl)
      .then(async (response) => {
        if (!response.ok) {
          sendResponse({ success: false, status: response.status });
          return;
        }
        try {
          const html = await response.text();
          // Extract first valid organic result URL
          // Looking for <div class="g"> or <a> with href starting with http but not google
          const regex = /<a[^>]+href=["'](https?:\/\/(?!www\.google\.|maps\.google\.|play\.google\.|youtube\.|facebook\.|instagram\.|twitter\.|linkedin\.|yelp\.|tripadvisor\.|yellowpages\.)[^"']+)["']/i;
          const match = html.match(regex);
          if (match && match[1]) {
            // Found a potential website
            sendResponse({ success: true, finalUrl: match[1] });
          } else {
            sendResponse({ success: false, error: 'No website found in search results' });
          }
        } catch (e) {
          sendResponse({ success: false, error: 'Failed to read search response' });
        }
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.toString() });
      });
    return true; // Indicates async response
  }
});
