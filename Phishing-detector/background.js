// Initialize with default settings if none exist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enableHeuristics: true,
    enableML: true,
    lastAnalysis: null
  });
});

// Enhanced message handler with error recovery
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleError = (error) => {
    console.error("PhishGuard Error:", error);
    return {
      error: error.message,
      isPhishing: false,
      heuristics: { score: 0, details: {} },
      mlPrediction: { probability: 0, isPhishing: false, features: {} }
    };
  };

  if (request.action === "checkPhishing") {
    // Use fallback URL if none provided
    const url = request.url || (sender.tab ? sender.tab.url : '');
    
    checkPhishing(url, request.pageContent || {})
      .then(result => {
        chrome.storage.local.set({ lastAnalysis: result });
        sendResponse(result);
      })
      .catch(error => sendResponse(handleError(error)));
    return true; // Keep message channel open
  }

  if (request.action === "getDetailedResults") {
    chrome.storage.local.get(['lastAnalysis'], ({ lastAnalysis }) => {
      sendResponse(lastAnalysis || handleError(new Error("No analysis data available")));
    });
    return true;
  }
});

// Robust phishing check with fallbacks
async function checkPhishing(url, pageContent) {
  if (!url) throw new Error("No URL provided");

  // Get current settings with defaults
  const { enableHeuristics = true, enableML = true } = await chrome.storage.sync.get([
    'enableHeuristics',
    'enableML'
  ]);

  // Run checks with proper error handling
  let heuristics = { score: 0, details: {} };
  let mlPrediction = { probability: 0, isPhishing: false, features: {} };

  try {
    if (enableHeuristics) {
      heuristics = runHeuristicChecks(url, pageContent);
    }

    if (enableML) {
      try {
        mlPrediction = await runMLModel(url, pageContent);
      } catch (mlError) {
        console.warn("ML Model Warning:", mlError);
        // Continue with degraded functionality
      }
    }
  } catch (error) {
    console.error("Check failed:", error);
    throw error;
  }

  return {
    url,
    isPhishing: heuristics.score > 70 || mlPrediction.probability > 0.7,
    heuristics,
    mlPrediction,
    timestamp: new Date().toISOString()
  };
}

// Basic heuristic checks with fallbacks
function runHeuristicChecks(url, pageContent = {}) {
  try {
    const details = {
      hasHttps: url.startsWith('https://'),
      suspiciousUrl: hasSuspiciousUrl(url),
      hiddenElements: pageContent.hiddenElements || 0,
      formCount: pageContent.formCount || 0,
      externalResources: pageContent.externalResources || 0
    };

    let score = 0;
    if (!details.hasHttps) score += 30;
    if (details.suspiciousUrl) score += 40;
    if (details.hiddenElements > 3) score += 20;
    if (details.formCount > 2) score += 15;
    if (details.externalResources > 5) score += 10;

    return {
      score: Math.min(100, score),
      details
    };
  } catch (error) {
    console.error("Heuristics failed:", error);
    return { score: 0, details: {} };
  }
}

// ML model with enhanced error handling
async function runMLModel(url, pageContent = {}) {
  try {
    // Dynamic import with fallback
    const mlModule = await import('./ml-model/model.js').catch(() => ({
      predict: () => ({
        probability: 0,
        isPhishing: false,
        features: {}
      })
    }));

    return await mlModule.predict(url, pageContent);
  } catch (error) {
    console.error("ML failed:", error);
    return {
      probability: 0,
      isPhishing: false,
      features: {},
      error: error.message
    };
  }
}
