const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};

// Overwrite Jest's transformIgnorePatterns to allow compilation of ESM packages in node_modules
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    "node_modules/(?!(@stellar|@noble|@x402|lucide-react|nanoid|undici|uint8array-extras)/)",
  ];
  return config;
};
