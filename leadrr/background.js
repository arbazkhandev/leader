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
    return true; // Indicates async response
  }
});
