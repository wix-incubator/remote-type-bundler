/** @type {import('jest').Config} */
module.exports = {
    "projects": [
        {
          "displayName": "unit",
           "testMatch": ["<rootDir>/__tests__/unit/**/*.spec.*"],
        },
        {
          "displayName": "e2e",
          "testMatch": ["<rootDir>/__tests__/e2e/**/*.spec.ts"],
        }
    ],
    testPathIgnorePatterns: [
        "dist/.*",
    ],
    transform: {
        "^.+\\.tsx?$": ['babel-jest', {rootMode: "upward"}]
    },
    snapshotFormat: {
      printBasicPrototype: true,
      escapeString: false,
    },
};
