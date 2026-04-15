import React from 'react';
import { render } from '@testing-library/react';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// T10: this test only checks that the component renders without crashing.
// It provides no signal about whether the component actually works correctly.
// A meaningful test would check visible content, accessible roles, or user interactions.
describe('Index', () => {
  it('should render successfully', () => {
    // Import inline to avoid issues with getServerSideProps
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: HomePage } = require('../src/pages/index');
    const { baseElement } = render(<HomePage featured={[]} timestamp={Date.now()} />);
    expect(baseElement).toBeTruthy();
  });
});
