// Simplified ML model with proper error handling
export async function predict(url, pageContent) {
  try {
    const features = extractFeatures(url, pageContent);
    const probability = calculateProbability(features);
    
    return {
      probability,
      isPhishing: probability > 0.7,
      features
    };
  } catch (error) {
    console.error("Prediction failed:", error);
    return {
      probability: 0,
      isPhishing: false,
      error: error.message
    };
  }
}

function extractFeatures(url, pageContent) {
  const domain = new URL(url).hostname;
  
  return {
    urlLength: url.length,
    domainLength: domain.length,
    numSubdomains: domain.split('.').length - 2,
    hasIp: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(domain),
    hasHttps: url.startsWith('https://'),
    numDashes: (domain.match(/-/g) || []).length,
    numDigits: (domain.match(/\d/g) || []).length,
    numParams: (url.match(/\?/g) || []).length
  };
}

function calculateProbability(features) {
  // Simple weighted calculation
  let score = 0;
  
  if (!features.hasHttps) score += 0.3;
  if (features.hasIp) score += 0.4;
  if (features.numSubdomains > 2) score += 0.2;
  if (features.numDashes > 3) score += 0.15;
  if (features.numDigits > 5) score += 0.1;
  if (features.numParams > 3) score += 0.1;
  
  // Sigmoid function to get probability between 0-1
  return 1 / (1 + Math.exp(-score * 5));
}
