import React from 'react';
import '@testing-library/jest-dom';

import { testingLibrary } from '../../../../util/testHelpers';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';

import configureStore from '../../../../store';
import { IntlProvider } from '../../../../util/reactIntl';
import { ConfigurationProvider } from '../../../../context/configurationContext';
import { RouteConfigurationProvider } from '../../../../context/routeConfigurationContext';
import routeConfiguration from '../../../../routing/routeConfiguration';

import messages from '../../../../translations/en.json';

import { Link } from './Link';

const { screen } = testingLibrary;
const { render } = testingLibrary;

describe('PageBuilder Link primitive', () => {
  it('treats same-origin absolute URLs as internal links (no target=_blank)', () => {
    const config = { marketplaceRootURL: 'https://www.lookthesoftware.com', canonicalRootURL: 'https://www.lookthesoftware.com' };
    const routes = routeConfiguration({}, {});
    const store = configureStore({ initialState: {} });

    render(
      <ConfigurationProvider value={config}>
        <RouteConfigurationProvider value={routes}>
          <IntlProvider locale="en" messages={messages} textComponent="span">
            <Provider store={store}>
              <HelmetProvider>
                <MemoryRouter initialEntries={['/es']}>
                  <Link href="https://www.lookthesoftware.com/p/terms-of-service-es">TOS</Link>
                </MemoryRouter>
              </HelmetProvider>
            </Provider>
          </IntlProvider>
        </RouteConfigurationProvider>
      </ConfigurationProvider>
    );

    const link = screen.getByRole('link', { name: 'TOS' });
    // Link should be internal (same-tab) so that SPA routing can handle the legacy redirect.
    expect(link).toHaveAttribute('href', '/p/terms-of-service-es');
    expect(link).not.toHaveAttribute('target');
  });
});
