import { Redirect, useLocation } from 'react-router-dom';

import { DEFAULT_LOCALE, getLocaleFromPath } from '../../context/localeContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { pathByRouteName } from '../../util/routes';

/**
 * This component wraps React-Router's Redirect by providing name-based routing.
 * (Helps to narrow down the scope of possible format changes to routes.)
 *
 * @component
 * @param {Object} props
 * @param {string} props.name Route's name
 * @param {string?} props.search search params
 * @param {Object?} props.state history's state
 * @param {boolean?} props.push
 * @param {Object} props.params Path params
 * @returns {JSX.Element} redirect component to help navigation
 */
const NamedRedirect = props => {
  const routeConfiguration = useRouteConfiguration();
  const location = useLocation();
  const currentLocale = getLocaleFromPath(location.pathname);

  const { name, search, state = {}, params = {}, push = false } = props;

  // Check if the route requires a locale parameter
  const route = routeConfiguration.find(r => r.name === name);
  const routeHasLocale = route?.path?.includes(':locale');

  // Include locale in params only if the route requires it and it's not already provided
  const paramsWithLocale =
    routeHasLocale && !params.locale
      ? { locale: currentLocale || DEFAULT_LOCALE, ...params }
      : params;

  const pathname = pathByRouteName(name, routeConfiguration, paramsWithLocale);
  return <Redirect to={{ pathname, search, state }} push={push} />;
};

export default NamedRedirect;
