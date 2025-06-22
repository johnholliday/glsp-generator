// Mock for performance/grammar-converter to avoid ESM issues in tests
function parseGrammarToAST(parsedGrammar) {
  // Simply return the parsed grammar as-is for tests
  return parsedGrammar;
}

module.exports = {
  parseGrammarToAST
};
