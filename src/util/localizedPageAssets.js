// Spanish versions of content pages must be created in Sharetribe Console
// using the "-es" suffix (e.g. "about-es", "landing-page-es").
export const localizedSlug = (slug, locale) => {
  const baseLocale = locale?.split('-')?.[0];
  return baseLocale === 'es' ? `${slug}-es` : slug;
};

export const pageAssetPath = slug => `content/pages/${slug}.json`;
