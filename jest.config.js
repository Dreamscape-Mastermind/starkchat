export default {
  transform: {},
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  // Setup files to run before tests
  setupFiles: ['<rootDir>/jest.setup.js']
}; 