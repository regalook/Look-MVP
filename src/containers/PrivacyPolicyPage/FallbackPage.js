import React from 'react';
import loadable from '@loadable/component';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// NOTE: You could add the actual Privacy Policy here as a fallback
//       instead of showing this error message.
const fallbackPrivacyPolicy = {
  en: `
# An error occurred
The web app couldn\'t reach the backend to fetch the Privacy Policy page.

## Possible actions
Please refresh the page and, if that doesn't help, contact the marketplace administrators.
`,
  es: `
# Se produjo un error
La aplicación web no pudo conectarse al backend para obtener la página de Política de privacidad.

## Posibles acciones
Actualiza la página y, si eso no ayuda, ponte en contacto con los administradores del marketplace.
`,
};

// Create fallback content (array of sections) in page asset format:
export const fallbackSections = {
  sections: [
    {
      sectionType: 'article',
      sectionId: 'privacy',
      appearance: { fieldType: 'customAppearance', backgroundColor: '#ffffff' },
      title: {
        fieldType: 'heading1',
        content: { en: 'Privacy Policy', es: 'Política de privacidad' },
      },
      blocks: [
        {
          blockType: 'defaultBlock',
          blockId: 'hero-content',
          text: {
            fieldType: 'markdown',
            content: fallbackPrivacyPolicy,
          },
        },
      ],
    },
  ],
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: { en: 'Privacy policy page', es: 'Página de política de privacidad' },
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content: {
        en: 'Privacy policy fetch failed',
        es: 'No se pudo cargar la política de privacidad',
      },
    },
  },
};

// This is the fallback page, in case there's no Privacy Policy asset defined in Console.
const FallbackPage = props => {
  return <PageBuilder pageAssetsData={fallbackSections} {...props} />;
};

export default FallbackPage;
