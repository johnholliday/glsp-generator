// Mock for chalk to avoid ESM issues in tests
// This mock properly supports chaining like chalk.red.bold('text')

const createChalkMock = () => {
  const mockFunction = function (str) {
    return String(str || "");
  };

  // Use Proxy to handle any property access and return chainable mock
  return new Proxy(mockFunction, {
    get(target, prop) {
      // Handle special properties
      if (prop === "supportsColor") {
        return {
          stdout: { level: 0, hasBasic: false, has256: false, has16m: false },
          stderr: { level: 0, hasBasic: false, has256: false, has16m: false },
        };
      }
      if (prop === "level") return 0;
      if (prop === "stderr" || prop === "stdout") return target;

      // For any style property, return the same chainable mock
      if (typeof prop === "string") {
        return createChalkMock();
      }

      return target[prop];
    },
  });
};

const chalk = createChalkMock();

// Export as default ESM module
export default chalk;
