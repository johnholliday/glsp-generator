// Mock for chalk to avoid ESM issues in tests
const createChalkFunction = (str) => str;

// Create chainable chalk functions
const createChalkColor = () => {
  const fn = createChalkFunction;
  fn.bold = createChalkFunction;
  fn.dim = createChalkFunction;
  fn.italic = createChalkFunction;
  fn.underline = createChalkFunction;
  fn.inverse = createChalkFunction;
  fn.strikethrough = createChalkFunction;
  return fn;
};

const chalk = {
  blue: createChalkColor(),
  red: createChalkColor(),
  green: createChalkColor(),
  yellow: createChalkColor(),
  gray: createChalkColor(),
  cyan: createChalkColor(),
  bold: createChalkFunction,
  dim: createChalkFunction,
  italic: createChalkFunction,
  underline: createChalkFunction,
  inverse: createChalkFunction,
  strikethrough: createChalkFunction,
};

// Support both default and named exports
chalk.default = chalk;

module.exports = chalk;
module.exports.default = chalk;
