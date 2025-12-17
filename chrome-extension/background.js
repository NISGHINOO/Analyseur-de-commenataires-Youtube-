// Background Service Worker
// Handles background tasks and communication between popup and content scripts

console.log('🔧 Cyberbullying Detector - Background Service Worker Active');

// Configuration
const API_URL = 'http://127.0.0.1:8000';

// Installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ Extension installed successfully');
    
    // Set default settings
    chrome.storage.local.set({
      theme: 'light',
      autoHighlight: true,
      notificationsEnabled: true
    });
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated');
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeComments') {
    handleAnalysis(request.comments, sender.tab?.id)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open
  }
  
  if (request.action === 'checkAPIHealth') {
    checkAPIHealth()
      .then(status => sendResponse({ success: true, status }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['theme', 'autoHighlight', 'notificationsEnabled'], (settings) => {
      sendResponse({ success: true, settings });
    });
    return true;
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.local.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle comment analysis
async function handleAnalysis(comments, tabId) {
  try {
    // Call API
    const response = await fetch(`${API_URL}/predict_batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comments })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }
    
    const results = await response.json();
    
    // Log statistics
    console.log(`📊 Analysis complete: ${results.statistics.total_comments} comments analyzed`);
    console.log(`⚠️ Harassment detected: ${results.statistics.harassment_detected} (${results.statistics.harassment_percentage.toFixed(1)}%)`);
    
    // Show notification if harassment is high
    const settings = await getSettings();
    if (settings.notificationsEnabled && results.statistics.harassment_percentage > 20) {
      showNotification(results.statistics);
    }
    
    // Auto-highlight if enabled
    if (settings.autoHighlight && tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'highlightComments',
        predictions: results.predictions
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    throw error;
  }
}

// Check API health
async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('API is not responding');
    }
    
    const data = await response.json();
    console.log('✅ API Health Check:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ API Health Check Failed:', error);
    throw new Error('Cannot connect to API. Make sure the server is running on http://127.0.0.1:8000');
  }
}

// Get settings from storage
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['theme', 'autoHighlight', 'notificationsEnabled'], (settings) => {
      resolve({
        theme: settings.theme || 'light',
        autoHighlight: settings.autoHighlight !== false,
        notificationsEnabled: settings.notificationsEnabled !== false
      });
    });
  });
}

// Show notification
function showNotification(statistics) {
  const percentage = statistics.harassment_percentage.toFixed(1);
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '⚠️ Harcèlement détecté',
    message: `${statistics.harassment_detected} commentaires de harcèlement détectés (${percentage}%)`,
    priority: 2
  });
}

// Badge management
function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString(), tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#f56565', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

// Tab updates - reset badge when navigating
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com/watch')) {
    updateBadge(tabId, 0);
  }
});

// Context menu (right-click) - optional feature
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzePage',
    title: 'Analyser les commentaires de cette page',
    contexts: ['page'],
    documentUrlPatterns: ['*://www.youtube.com/watch*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzePage') {
    // Trigger analysis
    chrome.action.openPopup();
  }
});

// Periodic API health check (every 5 minutes)
setInterval(async () => {
  try {
    await checkAPIHealth();
  } catch (error) {
    console.warn('API health check failed:', error.message);
  }
}, 5 * 60 * 1000);

// Alarm for periodic checks (alternative to setInterval)
chrome.alarms.create('healthCheck', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'healthCheck') {
    checkAPIHealth().catch(console.error);
  }
});

console.log('🎯 Background service worker ready');