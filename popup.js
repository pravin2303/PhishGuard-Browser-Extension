document.addEventListener('DOMContentLoaded', initPopup);

function initPopup() {
  const elements = {
    status: document.getElementById('status'),
    results: document.getElementById('results'),
    phishingStatus: document.getElementById('phishing-status'),
    heuristicScore: document.getElementById('heuristic-score'),
    mlConfidence: document.getElementById('ml-confidence'),
    detailsBtn: document.getElementById('details-btn'),
    enableHeuristics: document.getElementById('enable-heuristics'),
    enableML: document.getElementById('enable-ml')
  };

  // Initialize with default settings
  chrome.storage.sync.get(['enableHeuristics', 'enableML'], (result) => {
    elements.enableHeuristics.checked = result.enableHeuristics !== false;
    elements.enableML.checked = result.enableML !== false;
    refreshAnalysis(elements);
  });

  // Settings change handlers
  elements.enableHeuristics.addEventListener('change', (e) => {
    chrome.storage.sync.set({ enableHeuristics: e.target.checked });
    refreshAnalysis(elements);
  });

  elements.enableML.addEventListener('change', (e) => {
    chrome.storage.sync.set({ enableML: e.target.checked });
    refreshAnalysis(elements);
  });

  // View Details button
  elements.detailsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/details.html') });
  });
}

function refreshAnalysis(elements) {
  showLoadingState(elements);
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showErrorState(elements, "No active tab found");
      return;
    }

    chrome.runtime.sendMessage(
      { action: "checkPhishing", url: tabs[0].url },
      (response) => {
        if (chrome.runtime.lastError || response.error) {
          showErrorState(elements, response?.error || chrome.runtime.lastError.message);
          return;
        }
        updateUI(elements, response);
      }
    );
  });
}

function showLoadingState(elements) {
  elements.status.classList.remove('hidden');
  elements.results.classList.add('hidden');
}

function showErrorState(elements, message) {
  elements.status.classList.add('hidden');
  elements.results.classList.remove('hidden');
  
  elements.phishingStatus.textContent = "Error";
  elements.phishingStatus.className = "value danger";
  elements.heuristicScore.textContent = "N/A";
  elements.mlConfidence.textContent = "N/A";
  
  console.error("PhishGuard Error:", message);
}

function updateUI(elements, data) {
  elements.status.classList.add('hidden');
  elements.results.classList.remove('hidden');

  const heuristicsEnabled = elements.enableHeuristics.checked;
  const mlEnabled = elements.enableML.checked;

  // Update heuristic score display
  elements.heuristicScore.textContent = heuristicsEnabled 
    ? `${data.heuristics?.score || 0}/100` 
    : "Disabled";

  // Update ML confidence display
  const mlProb = data.mlPrediction?.probability || 0;
  elements.mlConfidence.textContent = mlEnabled
    ? `${Math.round(mlProb * 100)}%`
    : "Disabled";

  // Determine overall status
  if (!heuristicsEnabled && !mlEnabled) {
    elements.phishingStatus.textContent = "All checks disabled";
    elements.phishingStatus.className = "value warning";
  } else if (data.isPhishing) {
    elements.phishingStatus.textContent = "Potential Phishing";
    elements.phishingStatus.className = "value danger";
  } else if ((data.heuristics?.score || 0) > 50 || mlProb > 0.5) {
    elements.phishingStatus.textContent = "Suspicious";
    elements.phishingStatus.className = "value warning";
  } else {
    elements.phishingStatus.textContent = "Safe";
    elements.phishingStatus.className = "value safe";
  }
}
