// A1: Storybook 6 configuration file.
// The current version is Storybook 8. This file format (.js, not .ts) and
// the configuration shape are from Storybook 6.x / 7.x.
// Candidates should identify the outdated version and propose upgrading.
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-links',
    '@storybook/addon-actions',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
};
