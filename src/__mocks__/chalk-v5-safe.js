// Safe mock for Chalk v5 that avoids Proxy conflicts
// This mock returns plain strings without any styling

const createChalkMock = () => {
  // Create a function that just returns its input
  const chalkFunction = (str) => String(str || '');
  
  // List of all chalk methods and properties
  const methods = [
    'reset', 'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough',
    'visible', 'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'gray', 'grey', 'blackBright', 'redBright', 'greenBright', 'yellowBright',
    'blueBright', 'magentaBright', 'cyanBright', 'whiteBright', 'bgBlack', 'bgRed',
    'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite', 'bgGray',
    'bgGrey', 'bgBlackBright', 'bgRedBright', 'bgGreenBright', 'bgYellowBright',
    'bgBlueBright', 'bgMagentaBright', 'bgCyanBright', 'bgWhiteBright', 'rgb', 'hex',
    'keyword', 'hsl', 'hsv', 'hwb', 'ansi', 'ansi256', 'bgRgb', 'bgHex', 'bgKeyword',
    'bgHsl', 'bgHsv', 'bgHwb', 'bgAnsi', 'bgAnsi256'
  ];
  
  // Create a self-referential object where every property returns itself
  const chalk = Object.create(chalkFunction);
  
  // Add all methods as chainable properties
  methods.forEach(method => {
    Object.defineProperty(chalk, method, {
      get() {
        return chalk; // Return chalk itself for chaining
      },
      enumerable: true,
      configurable: true
    });
  });
  
  // Add special properties
  chalk.supportsColor = { level: 0, hasBasic: false, has256: false, has16m: false };
  chalk.stderr = chalk;
  chalk.stdout = chalk;
  chalk.level = 0;
  
  // Make it callable
  chalk.call = chalkFunction.call.bind(chalkFunction);
  chalk.apply = chalkFunction.apply.bind(chalkFunction);
  
  return chalk;
};

// Create and export the mock
const chalk = createChalkMock();
export default chalk;