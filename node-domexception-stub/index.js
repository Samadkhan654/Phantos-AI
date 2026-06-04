// Export native DOMException from global scope
module.exports = globalThis.DOMException || Error;
