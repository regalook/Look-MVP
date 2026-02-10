import routeConfiguration from './routeConfiguration';
import { matchPathname } from '../util/routes';

describe('routeConfiguration', () => {
  const routes = routeConfiguration({}, {});

  test('redirects legacy /p/terms-of-service-es to canonical localized Terms route', () => {
    const matches = matchPathname('/p/terms-of-service-es', routes);
    expect(matches).toHaveLength(1);
    expect(matches[0].route.name).toBe('LegacyTermsOfServiceEsRedirect');
    expect(matches[0].params).toEqual({});
  });

  test('matches legacy CMS page route without locale prefix (/p/:pageId) for non-permanent pages', () => {
    const matches = matchPathname('/p/about-es', routes);
    expect(matches).toHaveLength(1);
    expect(matches[0].route.name).toBe('CMSPageLegacy');
    expect(matches[0].params).toEqual({ pageId: 'about-es' });
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
