// Tokenizes text into lowercase words, removing punctuation
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// Builds a term-frequency map for a document
function termFrequency(tokens) {
  const tf = {};
  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });
  return tf;
}

// Computes cosine similarity between two TF maps
function cosineSimilarity(tfA, tfB) {
  const allTerms = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
  let dotProduct = 0, magA = 0, magB = 0;

  allTerms.forEach(term => {
    const a = tfA[term] || 0;
    const b = tfB[term] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Computes a text similarity score (0 to 1) between two posts' text
function textSimilarity(textA, textB) {
  const tfA = termFrequency(tokenize(textA));
  const tfB = termFrequency(tokenize(textB));
  return cosineSimilarity(tfA, tfB);
}

// Computes how close two dates are (1 = same day, decays over time)
function dateProximity(dateA, dateB) {
  const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - diffDays / 14); // fades to 0 after 14 days apart
}

// Computes an overall match score between a lost post and a found post
function computeMatchScore(postA, postB) {
  const textScore = textSimilarity(
    `${postA.title} ${postA.description}`,
    `${postB.title} ${postB.description}`
  );

  const locationScore = (postA.location && postB.location &&
    postA.location.toLowerCase().trim() === postB.location.toLowerCase().trim()) ? 1 : 0;

  const dateScore = dateProximity(postA.createdAt, postB.createdAt);

  // Weighted combination — text similarity matters most
  const finalScore = (textScore * 0.6) + (locationScore * 0.25) + (dateScore * 0.15);
  return Math.round(finalScore * 100); // as a percentage
}

module.exports = { computeMatchScore };