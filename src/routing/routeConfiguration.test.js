import routeConfiguration from './routeConfiguration';
import { matchPathname } from '../util/routes';

describe('routeConfiguration', () => {
  const routes = routeConfiguration({}, {});

  test('matches legacy CMS page route without locale prefix (/p/:pageId)', () => {
    const matches = matchPathname('/p/terms-of-service-es', routes);
    expect(matches).toHaveLength(1);
    expect(matches[0].route.name).toBe('CMSPageLegacy');
    expect(matches[0].params).toEqual({ pageId: 'terms-of-service-es' });
  });

  test('still matches localized CMS page route (/:locale/p/:pageId)', () => {
    const matches = matchPathname('/es/p/about', routes);
    expect(matches).toHaveLength(1);
    expect(matches[0].route.name).toBe('CMSPage');
    expect(matches[0].params).toEqual({ locale: 'es', pageId: 'about' });
  });

  test('still matches localized Terms of Service route (/:locale/terms-of-service)', () => {
    const matches = matchPathname('/en/terms-of-service', routes);
    expect(matches).toHaveLength(1);
    expect(matches[0].route.name).toBe('TermsOfServicePage');
    expect(matches[0].params).toEqual({ locale: 'en' });
  });
});

