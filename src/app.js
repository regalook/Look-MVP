import loadable from '@loadable/component';
import mapValues from 'lodash/mapValues';
import moment from 'moment';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter, StaticRouter, useLocation } from 'react-router-dom';

// Configs and store setup
import defaultConfig from './config/configDefault';
import appSettings from './config/settings';
import configureStore from './store';

// utils
import { ConfigurationProvider } from './context/configurationContext';
import { RouteConfigurationProvider } from './context/routeConfigurationContext';
import { mergeConfig } from './util/configHelpers';
import { IncludeScripts } from './util/includeScripts';
import { IntlProvider } from './util/reactIntl';
import { includeCSSProperties } from './util/style';

import { MaintenanceMode } from './components';

// routing
import routeConfiguration from './routing/routeConfiguration';
import Routes from './routing/Routes';

// Multi-language support
import {
  DEFAULT_LOCALE,
  LocaleProvider,
  getLocaleFromPath,
  SUPPORTED_LOCALES,
} from './context/localeContext';
import { getMessages } from './translations';

// Sharetribe Web Template uses English translations as default translations.
import defaultMessages from './translations/en.json';

// Note that there is also translations in './translations/countryCodes.js' file
// This file contains ISO 3166-1 alpha-2 country codes, country names and their translations in our default languages
// This used to collect billing address in StripePaymentAddress on CheckoutPage

// Test environment uses keys as values for predictable testing
const isTestEnv = process.env.NODE_ENV === 'test';
const testMessages = mapValues(defaultMessages, (val, key) => key);

// For customized apps, this dynamic loading of locale files is not necessary.
// It helps locale change from configDefault.js file or hosted configs, but customizers should probably
// just remove this and directly import the necessary locale on step 2.
const MomentLocaleLoader = props => {
  const { children, locale } = props;
  const isAlreadyImportedLocale =
    typeof hardCodedLocale !== 'undefined' && locale === hardCodedLocale;

  // Moment's built-in locale does not need loader
  const NoLoader = props => <>{props.children()}</>;

  // The default locale is en (en-US). Here we dynamically load one of the other common locales.
  // However, the default is to include all supported locales package from moment library.
  const MomentLocale =
    ['en', 'en-US'].includes(locale) || isAlreadyImportedLocale
      ? NoLoader
      : ['fr', 'fr-FR'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "fr" */ 'moment/locale/fr'))
      : ['de', 'de-DE'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "de" */ 'moment/locale/de'))
      : ['es', 'es-ES'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "es" */ 'moment/locale/es'))
      : ['fi', 'fi-FI'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "fi" */ 'moment/locale/fi'))
      : ['nl', 'nl-NL'].includes(locale)
      ? loadable.lib(() => import(/* webpackChunkName: "nl" */ 'moment/locale/nl'))
      : loadable.lib(() => import(/* webpackChunkName: "locales" */ 'moment/min/locales.min'));

  return (
    <MomentLocale>
      {() => {
        // Set the Moment locale globally
        // See: http://momentjs.com/docs/#/i18n/changing-locale/
        moment.locale(locale);
        return children;
      }}
    </MomentLocale>
  );
};

const Configurations = props => {
  const { appConfig, children } = props;
  const routeConfig = routeConfiguration(appConfig.layout, appConfig?.accessControl);

  return (
    <ConfigurationProvider value={appConfig}>
      <RouteConfigurationProvider value={routeConfig}>{children}</RouteConfigurationProvider>
    </ConfigurationProvider>
  );
};

/**
 * IntlWrapper - Wraps IntlProvider and reacts to location changes
 * This must be inside BrowserRouter to access useLocation
 */
const IntlWrapper = props => {
  const { children, hostedTranslations } = props;
  const location = useLocation();
  const locale = getLocaleFromPath(location.pathname) || DEFAULT_LOCALE;
  const messages = isTestEnv ? testMessages : getMessages(locale, hostedTranslations);
  const effectiveLocale = isTestEnv ? 'en' : locale;

  return (
    <LocaleProvider value={{ locale: effectiveLocale }}>
      <MomentLocaleLoader locale={effectiveLocale}>
        <IntlProvider
          key={effectiveLocale}
          locale={effectiveLocale}
          messages={messages}
          textComponent="span"
        >
          {children}
        </IntlProvider>
      </MomentLocaleLoader>
    </LocaleProvider>
  );
};

const MaintenanceModeError = props => {
  const { locale, messages, helmetContext } = props;
  return (
    <IntlProvider locale={locale} messages={messages} textComponent="span">
      <HelmetProvider context={helmetContext}>
        <MaintenanceMode />
      </HelmetProvider>
    </IntlProvider>
  );
};

// This displays a warning if environment variable key contains a string "SECRET"
const EnvironmentVariableWarning = props => {
  const suspiciousEnvKey = props.suspiciousEnvKey;
  // https://github.com/sharetribe/flex-integration-api-examples#warning-usage-with-your-web-app--website
  const containsINTEG = str => str.toUpperCase().includes('INTEG');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <div style={{ width: '600px' }}>
        <p>
          Are you sure you want to reveal to the public web an environment variable called:{' '}
          <b>{suspiciousEnvKey}</b>
        </p>
        <p>
          All the environment variables that start with <i>REACT_APP_</i> prefix will be part of the
          published React app that's running on a browser. Those variables are, therefore, visible
          to anyone on the web. Secrets should only be used on a secure environment like the server.
        </p>
        {containsINTEG(suspiciousEnvKey) ? (
          <p>
            {'Note: '}
            <span style={{ color: 'red' }}>
              Do not use Integration API directly from the web app.
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Client App
 * @param {Object} props
 * @param {Object} props.store
 * @param {Object} props.hostedTranslations
 * @param {Object} props.hostedConfig
 * @returns {JSX.Element}
 */
export const ClientApp = props => {
  const { store, hostedTranslations = {}, hostedConfig = {} } = props;
  const appConfig = mergeConfig(hostedConfig, defaultConfig);

  if (typeof window !== 'undefined' && process.env.REACT_APP_DEBUG_I18N === 'true') {
    // Avoid noisy logs on re-render in production unless explicitly enabled.
    if (!window.__DEBUG_I18N_LOGGED__) {
      window.__DEBUG_I18N_LOGGED__ = true;
      // eslint-disable-next-line no-console
      console.info('[i18n-debug]', {
        origin: window.location.origin,
        envCanonicalRootURL: process.env.REACT_APP_CANONICAL_ROOT_URL,
        envMarketplaceRootURL: process.env.REACT_APP_MARKETPLACE_ROOT_URL,
        configCanonicalRootURL: appConfig.canonicalRootURL,
        configMarketplaceRootURL: appConfig.marketplaceRootURL,
        supportedLocalesConfig: appConfig.localization?.availableLocales,
        supportedLocalesContext: SUPPORTED_LOCALES,
      });
    }
  }

  // Show warning on the localhost:3000, if the environment variable key contains "SECRET"
  if (appSettings.dev) {
    const envVars = process.env || {};
    const envVarKeys = Object.keys(envVars);
    const containsSECRET = str => str.toUpperCase().includes('SECRET');
    const suspiciousSECRETKey = envVarKeys.find(
      key => key.startsWith('REACT_APP_') && containsSECRET(key)
    );

    if (suspiciousSECRETKey) {
      return <EnvironmentVariableWarning suspiciousEnvKey={suspiciousSECRETKey} />;
    }
  }

  // Show MaintenanceMode if the mandatory configurations are not available
  if (!appConfig.hasMandatoryConfigurations) {
    const locale = getLocaleFromPath(window.location.pathname) || DEFAULT_LOCALE;
    const messages = getMessages(locale, hostedTranslations);
    return <MaintenanceModeError locale={locale} messages={messages} />;
  }

  // Marketplace color and the color for <PrimaryButton> come from configs
  // If set, we need to create CSS Property and set it to DOM (documentElement is selected here)
  // This provides marketplace color for everything under <html> tag (including modals/portals)
  // Note: This is also set on Page component to provide server-side rendering.
  const elem = window.document.documentElement;
  includeCSSProperties(appConfig.branding, elem);

  // This gives good input for debugging issues on live environments, but with test it's not needed.
  const logLoadDataCalls = appSettings?.env !== 'test';

  return (
    <Configurations appConfig={appConfig}>
      <Provider store={store}>
        <HelmetProvider>
          <IncludeScripts config={appConfig} />
          <BrowserRouter>
            <IntlWrapper hostedTranslations={hostedTranslations}>
              <Routes logLoadDataCalls={logLoadDataCalls} />
            </IntlWrapper>
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    </Configurations>
  );
};

/**
 * Server App
 * @param {Object} props
 * @param {string} props.url
 * @param {Object} props.context
 * @param {Object} props.helmetContext
 * @param {Object} props.store
 * @param {Object} props.hostedTranslations
 * @param {Object} props.hostedConfig
 * @returns {JSX.Element}
 */
export const ServerApp = props => {
  const { url, context, helmetContext, store, hostedTranslations = {}, hostedConfig = {} } = props;
  const appConfig = mergeConfig(hostedConfig, defaultConfig);
  HelmetProvider.canUseDOM = false;

  // Get locale from URL path for SSR
  const locale = getLocaleFromPath(url);

  // Get messages for the current locale
  const messages = getMessages(locale, hostedTranslations);

  // Show MaintenanceMode if the mandatory configurations are not available
  if (!appConfig.hasMandatoryConfigurations) {
    return (
      <MaintenanceModeError locale={locale} messages={messages} helmetContext={helmetContext} />
    );
  }

  return (
    <Configurations appConfig={appConfig}>
      <Provider store={store}>
        <HelmetProvider context={helmetContext}>
          <IncludeScripts config={appConfig} />
          <StaticRouter location={url} context={context}>
            <LocaleProvider value={{ locale }}>
              <MomentLocaleLoader locale={locale}>
                <IntlProvider locale={locale} messages={messages} textComponent="span">
                  <Routes />
                </IntlProvider>
              </MomentLocaleLoader>
            </LocaleProvider>
          </StaticRouter>
        </HelmetProvider>
      </Provider>
    </Configurations>
  );
};

/**
 * Render the given route.
 *
 * @param {String} url Path to render
 * @param {Object} serverContext Server rendering context from react-router
 *
 * @returns {Object} Object with keys:
 *  - {String} body: Rendered application body of the given route
 *  - {Object} head: Application head metadata from react-helmet
 */
export const renderApp = (
  url,
  serverContext,
  preloadedState,
  hostedTranslations,
  hostedConfig,
  collectChunks
) => {
  // Don't pass an SDK instance since we're only rendering the
  // component tree with the preloaded store state and components
  // shouldn't do any SDK calls in the (server) rendering lifecycle.
  const store = configureStore({ initialState: preloadedState });

  const helmetContext = {};

  // When rendering the app on server, we wrap the app with webExtractor.collectChunks
  // This is needed to figure out correct chunks/scripts to be included to server-rendered page.
  // https://loadable-components.com/docs/server-side-rendering/#3-setup-chunkextractor-server-side
  const WithChunks = collectChunks(
    <ServerApp
      url={url}
      context={serverContext}
      helmetContext={helmetContext}
      store={store}
      hostedTranslations={hostedTranslations}
      hostedConfig={hostedConfig}
    />
  );

  // Let's keep react-dom/server out of the main code-chunk.
  return import('react-dom/server').then(mod => {
    const { default: ReactDOMServer } = mod;
    const body = ReactDOMServer.renderToString(WithChunks);
    const { helmet: head } = helmetContext;
    return { head, body };
  });
};
