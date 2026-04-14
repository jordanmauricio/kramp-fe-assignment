import { composePlugins, withNx } from '@nx/next';
import { WithNxOptions } from '@nx/next/plugins/with-nx';

const nextConfig: WithNxOptions = {
  nx: {},
};

const plugins = [withNx];

const config = composePlugins(...plugins)(nextConfig);

export default config;
