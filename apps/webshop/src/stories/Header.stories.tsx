// A1: CSF v2 storiesOf format — deprecated and removed in Storybook 7+
// No args, no controls, no play functions.

import { storiesOf } from '@storybook/react';

// Note: Header depends on CartContext and Next.js router.
// In CSF3 this would be handled with decorators and mocking.
// Here it's just rendered directly — will likely fail without providers,
// which is itself a sign that the component is not well-structured for isolation.
import { Header } from '../components/Header';

storiesOf('Header', module)
  .add('default', () => <Header />)
  .add('with items', () => <Header />);
// No args, no mocked context, no meaningful variation
