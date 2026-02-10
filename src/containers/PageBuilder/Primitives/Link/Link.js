import React from 'react';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';

import { useConfiguration } from '../../../../context/configurationContext';
import { useRouteConfiguration } from '../../../../context/routeConfigurationContext.js';
import { matchPathname } from '../../../../util/routes.js';

import { NamedLink, ExternalLink } from '../../../../components/index.js';
import css from './Link.module.css';

/**
 * Link element which internally uses NamedLink or ExternalLink
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {ReactNode} props.children
 * @param {string} props.href link destination. In-app links need to start with '/'.
 * @returns {JSX.Element} link element
 */
export const Link = React.forwardRef((props, ref) => {
  const location = useLocation();
  const config = useConfiguration();
  const routes = useRouteConfiguration();

  const { className, rootClassName, href, title, children } = props;
  const classes = classNames(rootClassName || css.link, className);
  const titleMaybe = title ? { title } : {};
  const linkProps = { className: classes, href, children, ...titleMaybe };

  // Markdown parser (rehype-sanitize) might return undefined href
  if (!href || !children) {
    return null;
  }

  // Some hosted content uses absolute URLs even for in-app pages.
  // If the absolute URL points to this marketplace, treat it as an internal link
  // to keep navigation in the same tab and preserve SPA routing.
  const isAbsoluteHttpUrl = href.startsWith('http://') || href.startsWith('https://');
  if (isAbsoluteHttpUrl) {
    try {
      const hrefUrl = new URL(href);
      const marketplaceOrigins = [config?.marketplaceRootURL, config?.canonicalRootURL]
        .filter(Boolean)
        .map(u => {
          try {
            return new URL(u).origin;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      if (marketplaceOrigins.includes(hrefUrl.origin)) {
        const matchedRoutes = matchPathname(hrefUrl.pathname, routes);
        if (matchedRoutes.length > 0) {
          const found = matchedRoutes[0];
          const to = { search: hrefUrl.search, hash: hrefUrl.hash };
          return (
            <NamedLink
              name={found.route.name}
              params={found.params}
              to={to}
              {...linkProps}
              ref={ref}
            />
          );
        }
      }
    } catch (e) {
      // Fall through to external link rendering.
    }
  }

  if (href.charAt(0) === '/') {
    // Internal link
    const testURL = new URL('http://my.marketplace.com' + href);
    const matchedRoutes = matchPathname(testURL.pathname, routes);
    if (matchedRoutes.length > 0) {
      const found = matchedRoutes[0];
      const to = { search: testURL.search, hash: testURL.hash };
      return (
        <NamedLink name={found.route.name} params={found.params} to={to} {...linkProps} ref={ref} />
      );
    }
  }

  if (href.charAt(0) === '#') {
    if (typeof window !== 'undefined') {
      const hash = href;
      let testURL = new URL(
        `http://my.marketplace.com${location.pathname}${location.hash}${location.search}`
      );
      testURL.hash = hash;
      const matchedRoutes = matchPathname(testURL.pathname, routes);
      if (matchedRoutes.length > 0) {
        const found = matchedRoutes[0];
        const to = { search: testURL.search, hash: testURL.hash };
        return (
          <NamedLink
            name={found.route.name}
            params={found.params}
            to={to}
            {...linkProps}
            ref={ref}
          />
        );
      }
    }
  }

  return <ExternalLink {...linkProps} ref={ref} />;
});

Link.displayName = 'Link';
