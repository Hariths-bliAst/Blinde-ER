module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [['babel-preset-expo', { enableBabelRuntime: false }]],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-speech|expo-haptics|expo-camera|expo-modules-core)/)',
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
};
