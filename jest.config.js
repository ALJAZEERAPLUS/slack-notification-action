// jest.config.js
// Sync object
module.exports = {
    verbose: true,
    automock: false,
    setupFiles: [
        "./setupJest.js"
    ],
    testResultsProcessor: 'jest-sonar-reporter',
    coverageDirectory: './coverage/',
    testPathIgnorePatterns: ['node_modules'],
    collectCoverageFrom: [
        'src/**',
        '!**/__mocks__/**',
        '!**/node_modules/**',
        '!.github/**',
        '!src/send-slack-message.test.js',
    ],
};