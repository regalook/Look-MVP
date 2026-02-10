/**
 * @jest-environment node
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import forEach from 'lodash/forEach';
import { getHostedConfiguration } from './util/testHelpers';
import { ServerApp } from './app';
import configureStore from './store';

const originalConsoleError = console.error;

beforeAll(() => {
  // SSR tests exercise config merging. In this repo `.env` does not provide map tokens,
  // and config helpers log an error when map provider credentials are missing.
  // Suppress only that one expected message to keep the test signal clean.
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = String(args[0] ?? '');
    if (msg.includes('The access tokens are not in place for the selected map provider')) {
      return;
    }
    originalConsoleError(...args);
  });
});

afterAll(() => {
  console.error.mockRestore?.();
});

const render = (url, context) => {
  const store = configureStore({});

  const helmetContext = {};

  const body = ReactDOMServer.renderToString(
    <ServerApp
      url={url}
      context={context}
      helmetContext={helmetContext}
      store={store}
      hostedConfig={getHostedConfiguration()}
    />
  );

  const { helmet: head } = helmetContext;
  return { head, body };
};

describe('Application - node environment', () => {
  it('renders in the server without crashing', () => {
    render('/', {});
  });

  it('renders the styleguide without crashing', () => {
    render('/en/styleguide', {});
  });

  it('server renders redirects for pages that require authentication', () => {
    const loginPath = '/en/login';
    const signupPath = '/en/signup';
    const urlRedirects = {
      '/en/l/new': signupPath,
      '/en/l/listing-title-slug/1234/new/description': signupPath,
      '/en/l/listing-title-slug/1234/checkout': signupPath,
      '/en/profile-settings': loginPath,
      '/en/inbox': loginPath,
      '/en/inbox/orders': loginPath,
      '/en/inbox/sales': loginPath,
      '/en/order/1234': loginPath,
      '/en/sale/1234': loginPath,
      '/en/listings': loginPath,
      '/en/account': loginPath,
      '/en/account/contact-details': loginPath,
      '/en/account/change-password': loginPath,
      '/en/account/payments': loginPath,
      '/verify-email': loginPath,
    };
    forEach(urlRedirects, (redirectPath, url) => {
      const context = {};
      render(url, context);
      expect(context.url).toEqual(redirectPath);
    });
  });

  it('redirects to correct URLs', () => {
    const urlRedirects = { '/en/l': '/en', '/en/u': '/en' };
    forEach(urlRedirects, (redirectPath, url) => {
      const context = {};
      render(url, context);
      expect(context.url).toEqual(redirectPath);
    });
  });
});
