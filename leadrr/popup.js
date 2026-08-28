document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const leadsCountEl = document.getElementById('leads-count');
  const statusEl = document.getElementById('scraper-status');
  const delaySlider = document.getElementById('scroll-delay');
  const delayValEl = document.getElementById('delay-val');
  
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const btnExport = document.getElementById('btn-export');
  const btnClear = document.getElementById('btn-clear');
  const previewList = document.getElementById('leads-preview-list');

  // Initialize UI state from storage
  chrome.storage.local.get(['leads', 'isScraping', 'scrollDelay'], (result) => {
    const leads = result.leads || [];
    const isScraping = result.isScraping || false;
    const scrollDelay = result.scrollDelay || 2500;

    // Update delay slider
    delaySlider.value = scrollDelay;
    delayValEl.textContent = (scrollDelay / 1000).toFixed(1) + 's';

    // Update stats and controls
    updateUI(leads, isScraping);
  });

  // Listen for storage changes from content script
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      chrome.storage.local.get(['leads', 'isScraping'], (result) => {
        const leads = result.leads || [];
        const isScraping = result.isScraping || false;
        updateUI(leads, isScraping);
      });
    }
  });

  // Slider Input Event
  delaySlider.addEventListener('input', (e) => {
    const delay = parseInt(e.target.value);
    delayValEl.textContent = (delay / 1000).toFixed(1) + 's';
    chrome.storage.local.set({ scrollDelay: delay });

    // Send update to content script if active
    sendMessageToActiveTab({ action: 'UPDATE_DELAY', delay: delay });
  });

  // Start Button Event
  btnStart.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab) return;

    if (!tab.url || !tab.url.includes('google.com/maps')) {
      alert('Please open Google Maps and perform a search first!');
      return;
    }

    const delay = parseInt(delaySlider.value);
    chrome.storage.local.set({ isScraping: true });

    // Send start signal
    chrome.tabs.sendMessage(tab.id, { action: 'START', delay: delay }, (response) => {
      // Check for connection error (content script not loaded yet)
      if (chrome.runtime.lastError) {
        // Fallback: Programmatically inject content script or prompt user to refresh
        alert('Please refresh the Google Maps page to initialize the scraper!');
        chrome.storage.local.set({ isScraping: false });
      }
    });
  });

  // Stop Button Event
  btnStop.addEventListener('click', async () => {
    chrome.storage.local.set({ isScraping: false });
    const tab = await getActiveTab();
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { action: 'STOP' }, () => {
        // Suppress message failure errors when stopped
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    }
  });

  // Clear Button Event
  btnClear.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all scraped leads?')) {
      chrome.storage.local.set({ leads: [], isScraping: false }, () => {
        sendMessageToActiveTab({ action: 'STOP' });
        leadsCountEl.textContent = '0';
        updatePreviewList([]);
      });
    }
  });

  // Export Button Event
  btnExport.addEventListener('click', () => {
    chrome.storage.local.get(['leads'], (result) => {
      const leads = result.leads || [];
      if (leads.length === 0) return;

      const csvContent = convertToCSV(leads);
      downloadCSV(csvContent);
    });
  });

  // Helper: Update whole UI based on current data
  function updateUI(leads, isScraping) {
    // Update count
    leadsCountEl.textContent = leads.length;

    // Update status badge classes and text
    statusEl.className = 'status-badge';
    if (isScraping) {
      statusEl.classList.add('status-scraping');
      statusEl.textContent = 'Scanning...';
      btnStart.disabled = true;
      btnStop.disabled = false;
    } else {
      statusEl.classList.add(leads.length > 0 ? 'status-stopped' : 'status-idle');
      statusEl.textContent = leads.length > 0 ? 'Stopped' : 'Ready';
      btnStart.disabled = false;
      btnStop.disabled = true;
    }

    // Enable/disable export button
    btnExport.disabled = leads.length === 0;

    // Update Live Preview List
    updatePreviewList(leads);
  }

  // Helper: Update live preview list items
  function updatePreviewList(leads) {
    previewList.innerHTML = '';

    if (leads.length === 0) {
      previewList.innerHTML = `
        <li class="empty-state">
          No leads scraped yet. Search something in Google Maps and click Start.
        </li>`;
      return;
    }

    // Show top 10 most recent leads in the list (or scrollable)
    // We reverse list to show latest at top
    const displayLeads = [...leads].reverse().slice(0, 15);

    displayLeads.forEach(lead => {
      const li = document.createElement('li');
      li.className = 'lead-item';

      const ratingText = lead.rating ? `★ ${lead.rating} (${lead.reviewsCount})` : 'No rating';
      const phoneText = lead.phone ? `<span class="lead-phone">${lead.phone}</span>` : 'No phone';

      li.innerHTML = `
        <div class="lead-item-header">
          <span class="lead-name" title="${lead.name}">${lead.name}</span>
          ${lead.rating ? `<span class="lead-rating-badge">${ratingText}</span>` : ''}
        </div>
        <div class="lead-details">
          <span>${lead.category || 'Business'}</span>
          <span>•</span>
          ${phoneText}
        </div>
      `;
      previewList.appendChild(li);
    });
  }

  // Helper: Query active tab details
  async function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  // Helper: Send message to active tab
  async function sendMessageToActiveTab(message) {
    const tab = await getActiveTab();
    if (tab) {
      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    }
  }

  // Helper: Convert scraped JSON array to CSV string
  function convertToCSV(data) {
    const headers = [
      'Name',
      'Status',
      'Tier',
      'Score',
      'Qualification Reason',
      'Rating',
      'Reviews Count',
      'Category',
      'Phone Number',
      'Email',
      'Instagram',
      'Website URL',
      'Address',
      'Google Maps URL'
    ];

    const escapeField = (val) => {
      if (val === undefined || val === null) return '';
      let str = String(val).trim().replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = data.map(item => [
      item.name || '',
      item.status || '',
      item.tier || '',
      item.score || '0',
      item.qualificationReason || '',
      item.rating || '',
      item.reviewsCount || '',
      item.category || '',
      item.phone || '',
      item.email || '',
      item.instagram || '',
      item.websiteUrl || '',
      item.address || '',
      item.link || ''
    ]);

    const csvContent = [
      headers.map(escapeField).join(','),
      ...rows.map(row => row.map(escapeField).join(','))
    ].join('\n');

    // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens Arabic, Urdu, special characters correctly
    return '\uFEFF' + csvContent;
  }

  // Helper: Trigger file download in browser
  function downloadCSV(csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `gmaps_leads_${timestamp}.csv`;
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
});
