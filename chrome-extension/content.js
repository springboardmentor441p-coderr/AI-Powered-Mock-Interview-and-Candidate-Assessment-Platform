// Inject a meta tag so the React app knows the extension is active
const meta = document.createElement('meta');
meta.name = 'smarthire-extension';
meta.content = 'active';
document.head.appendChild(meta);

// Listen for messages from the React app (e.g. to set session ID)
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'START_INTERVIEW') {
    chrome.runtime.sendMessage({
      type: 'SET_SESSION',
      sessionId: event.data.sessionId,
      token: event.data.token
    });
  }
  
  if (event.data.type === 'END_INTERVIEW') {
    chrome.runtime.sendMessage({
      type: 'END_SESSION'
    });
  }
});

// Also detect visibility change (blur/minimize) from the content script 
// because it's more accurate for the specific web app page
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    chrome.runtime.sendMessage({ type: 'TAB_BLUR' });
  }
});
