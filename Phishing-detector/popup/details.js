document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage(
    { action: "getDetailedResults" },
    (response) => {
      const detailsDiv = document.getElementById('details-content');
      
      if (response.error) {
        detailsDiv.innerHTML = `<p class="danger">Error loading details: ${response.error}</p>`;
        return;
      }

      let html = `
        <div class="detail-item">
          <span class="label">Current URL:</span>
          <span class="value">${response.url || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Final Status:</span>
          <span class="value ${response.isPhishing ? 'danger' : 'safe'}">
            ${response.isPhishing ? 'PHISHING' : 'SAFE'}
          </span>
        </div>
        <h3>Heuristic Analysis</h3>
      `;

      // Add heuristic details
      for (const [key, value] of Object.entries(response.heuristics.details || {})) {
        html += `
          <div class="detail-item">
            <span class="label">${formatLabel(key)}:</span>
            <span class="value">${formatValue(value)}</span>
          </div>
        `;
      }

      html += `<h3>Machine Learning Analysis</h3>`;
      
      // Add ML details
      for (const [key, value] of Object.entries(response.mlPrediction.features || {})) {
        html += `
          <div class="detail-item">
            <span class="label">${formatLabel(key)}:</span>
            <span class="value">${formatValue(value)}</span>
          </div>
        `;
      }

      detailsDiv.innerHTML = html;
    }
  );

  function formatLabel(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  function formatValue(value) {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  }
});
