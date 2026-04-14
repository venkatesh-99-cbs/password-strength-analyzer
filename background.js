// background.js

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkBreach") {
    checkHIBP(request.hashPrefix)
      .then(count => sendResponse({ count: count }))
      .catch(error => sendResponse({ count: null, error: error.message }));
    return true; // Required for async sendResponse
  }
});

/**
 * Queries HIBP API using k-anonymity.
 * Only sends the first 5 characters of the SHA-1 hash.
 */
async function checkHIBP(prefix) {
  const url = `https://api.pwnedpasswords.com/range/${prefix}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HIBP API Error: ${response.status}`);
    }
    const text = await response.text();
    return text; // Returns the full list of suffixes and counts
  } catch (error) {
    console.error("HIBP Fetch Error:", error);
    throw error;
  }
}
