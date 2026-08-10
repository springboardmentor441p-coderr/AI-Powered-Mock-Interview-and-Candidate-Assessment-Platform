let currentSessionId = null;
let currentToken = null;

const API_BASE = "http://localhost:8000";

async function logEvent(eventType, description) {
  if (!currentSessionId || !currentToken) return;

  try {
    await fetch(`${API_BASE}/interview/${currentSessionId}/integrity-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        event_type: eventType,
        duration_seconds: 0,
        description: description,
        severity: "high"
      })
    });
  } catch (err) {
    console.error("Failed to log integrity event", err);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_SESSION') {
    currentSessionId = message.sessionId;
    currentToken = message.token;
  } else if (message.type === 'END_SESSION') {
    currentSessionId = null;
    currentToken = null;
  } else if (message.type === 'TAB_BLUR') {
    logEvent('TAB_SWITCH', 'Candidate switched tabs or minimized the interview window.');
  }
});

// Detect active tab changes (switching to another tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (currentSessionId) {
    // If they switched to a different tab, log it
    logEvent('TAB_SWITCH', 'Candidate switched to a different browser tab.');
  }
});

// Detect DevTools opening (this is tricky, but we can detect attachment)
// A common way in extensions is chrome.debugger
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (currentSessionId) {
    logEvent('DEVTOOLS_OPENED', 'Candidate opened developer tools.');
  }
});

// To track blocked AI sites, we can use declarativeNetRequest.onRuleMatchedDebug
// Note: This requires the extension to be unpacked and have declarativeNetRequestFeedback permission
if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    if (currentSessionId) {
      logEvent('BLOCKED_SITE_ATTEMPT', `Candidate attempted to access blocked domain: ${info.request.url}`);
    }
  });
}
