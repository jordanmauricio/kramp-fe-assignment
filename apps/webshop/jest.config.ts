import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config = {
  displayName: 'webshop',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/webshop',
  testEnvironment: 'jsdom',
};

export default createJestConfig(config);
