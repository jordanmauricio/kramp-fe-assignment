import 'isomorphic-fetch'; // A4: unnecessary polyfill — fetch is global in Node 18+ and all modern browsers
import { AppProps } from 'next/app';
import Head from 'next/head';
import { createContext } from 'react';
import { useCart } from '../hooks/useCart';
import { Header } from '../components/Header';
import './styles.css';

// CartContext typed as any — no generic, no TypeScript safety for consumers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CartContext = createContext<any>(null);

function CustomApp({ Component, pageProps }: AppProps) {
  const cart = useCart();

  // P6: context value is an object literal created inline on every render.
  // Every component that calls useContext(CartContext) re-renders whenever
  // the parent renders — even if the cart data hasn't changed.
  // Fix: wrap in useMemo, or split into CartStateContext + CartDispatchContext.
  return (
    <CartContext.Provider value={{ cart }}>
      <Head>
        <title>Kramp Webshop</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main className="app">
        <Component {...pageProps} />
      </main>
    </CartContext.Provider>
  );
}

export default CustomApp;
