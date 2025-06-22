// Content script that runs on web pages
function extractPageContent() {
  return {
    url: window.location.href,
    title: document.title,
    text: document.body.innerText,
    hiddenElements: document.querySelectorAll('*[style*="display:none"], *[style*="visibility:hidden"]').length,
    formCount: document.forms.length,
    // Add more features as needed
  };
}

// Check page on load
const pageContent = extractPageContent();

// Send data to background script for analysis
chrome.runtime.sendMessage(
  {action: "checkPhishing", url: pageContent.url, pageContent},
  (response) => {
    if (response.warning) {
      showWarning(response.warning);
    }
  }
);

function showWarning(message) {
  const warningDiv = document.createElement('div');
  warningDiv.style.position = 'fixed';
  warningDiv.style.top = '0';
  warningDiv.style.left = '0';
  warningDiv.style.width = '100%';
  warningDiv.style.backgroundColor = '#ff3333';
  warningDiv.style.color = 'white';
  warningDiv.style.padding = '10px';
  warningDiv.style.textAlign = 'center';
  warningDiv.style.zIndex = '9999';
  warningDiv.style.fontWeight = 'bold';
  warningDiv.textContent = `⚠️ ${message} ⚠️`;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.marginLeft = '10px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => warningDiv.remove();
  
  warningDiv.appendChild(closeButton);
  document.body.prepend(warningDiv);
}
