import React from 'react';
import loadable from '@loadable/component';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

// NOTE: You could add the actual Terms of Service here as a fallback
//       instead of showing this error message.
const fallbackTerms = {
  en: `
# An error occurred
The web app couldn\'t reach the backend to fetch the Term of Service page.

## Possible actions
Please refresh the page and, if that doesn't help, contact the marketplace administrators.
`,
  es: `
# Se produjo un error
La aplicación web no pudo conectarse al backend para obtener la página de Términos del servicio.

## Posibles acciones
Actualiza la página y, si eso no ayuda, ponte en contacto con los administradores del marketplace.
`,
};

// Create fallback content (array of sections) in page asset format:
export const fallbackSections = {
  sections: [
    {
      sectionType: 'article',
      sectionId: 'terms',
      appearance: { fieldType: 'customAppearance', backgroundColor: '#ffffff' },
      title: {
        fieldType: 'heading1',
        content: { en: 'Terms of Service', es: 'Términos del servicio' },
      },
      blocks: [
        {
          blockType: 'defaultBlock',
          blockId: 'hero-content',
          text: {
            fieldType: 'markdown',
            content: fallbackTerms,
          },
        },
      ],
    },
  ],
  meta: {
    pageTitle: {
      fieldType: 'metaTitle',
      content: { en: 'Terms of service page', es: 'Página de términos del servicio' },
    },
    pageDescription: {
      fieldType: 'metaDescription',
      content: {
        en: 'Terms of service fetch failed',
        es: 'No se pudieron cargar los términos del servicio',
      },
    },
  },
};

// This is the fallback page, in case there's no Terms of Service asset defined in Console.
const FallbackPage = props => {
  return <PageBuilder pageAssetsData={fallbackSections} {...props} />;
};

export default FallbackPage;
