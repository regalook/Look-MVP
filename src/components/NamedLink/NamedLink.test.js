import React from 'react';
import '@testing-library/jest-dom';

import { testingLibrary, getDefaultConfiguration } from '../../util/testHelpers';
import { MemoryRouter, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';

import configureStore from '../../store';
import { IntlProvider } from '../../util/reactIntl';
import { ConfigurationProvider } from '../../context/configurationContext';
import { RouteConfigurationProvider } from '../../context/routeConfigurationContext';
import routeConfiguration from '../../routing/routeConfiguration';

import messages from '../../translations/en.json';

import NamedLink from './NamedLink';

const { screen } = testingLibrary;
const { render: rtlRender } = testingLibrary;

describe('NamedLink', () => {
  const renderInApp = (ui, { initialEntries = ['/en'] } = {}) => {
    const config = getDefaultConfiguration();
    const routes = routeConfiguration(config.layout, config.accessControl);
    const store = configureStore({ initialState: {} });

    return rtlRender(
      <Provider store={store}>
        <HelmetProvider>
          <ConfigurationProvider value={config}>
            <RouteConfigurationProvider value={routes}>
              <IntlProvider locale="en" messages={messages} textComponent="span">
                <MemoryRouter initialEntries={initialEntries}>
                  <Route path="/en">{ui}</Route>
                </MemoryRouter>
              </IntlProvider>
            </RouteConfigurationProvider>
          </ConfigurationProvider>
        </HelmetProvider>
      </Provider>
    );
  };

  // This is quite small component what comes to rendered HTML
  // For now, we rely on snapshot-testing and testing couple of features.
  it('matches snapshot', () => {
    const activeClassName = 'my-active-class';
    const landingPageProps = {
      name: 'LandingPage',
      activeClassName,
    };
    const searchPageProps = {
      name: 'SearchPage',
      activeClassName,
    };

    const tree = renderInApp(
      <div>
        <NamedLink {...landingPageProps}>link to a</NamedLink>
        <NamedLink {...searchPageProps}>link to b</NamedLink>
      </div>
    );

    expect(screen.getByRole('link', { name: 'link to a' })).toHaveClass(activeClassName);
    expect(screen.getByRole('link', { name: 'link to b' })).not.toHaveClass(activeClassName);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('should contain correct link', () => {
    const id = '12';
    renderInApp(
      <NamedLink name="ListingPageCanonical" params={{ id }}>
        to ListingPage
      </NamedLink>
    );
    const link = screen.getByRole('link', { name: 'to ListingPage' });
    expect(link.getAttribute('href')).toEqual(`/en/l/${id}`);
  });
});
