import React from 'react';
import { useConfiguration } from '../../context/configurationContext';
import loadable from '@loadable/component';
import { useLocale } from '../../context/localeContext';

const SectionBuilder = loadable(
  () => import(/* webpackChunkName: "SectionBuilder" */ '../PageBuilder/PageBuilder'),
  {
    resolveComponent: components => components.SectionBuilder,
  }
);

const FooterComponent = () => {
  const { footer = {}, topbar } = useConfiguration();
  const { locale } = useLocale();

  // If footer asset is not set, let's not render Footer at all.
  if (Object.keys(footer).length === 0) {
    return null;
  }

  // The footer asset does not specify sectionId or sectionType. However, the SectionBuilder
  // expects sectionId and sectionType in order to identify the section. We add those
  // attributes here before passing the asset to SectionBuilder.
  const normalizedLocale = (locale || '').split('-')[0].toLowerCase();
  const isSpanish = normalizedLocale === 'es';
  const blocks = Array.isArray(footer.blocks) ? footer.blocks : [];
  const isSpanishBlock = b => (b?.blockId || '').toLowerCase().endsWith('-es');
  const defaultBlocks = blocks.filter(b => !isSpanishBlock(b));
  const spanishBlocks = blocks.filter(isSpanishBlock);
  const filteredBlocks = isSpanish ? (spanishBlocks.length > 0 ? spanishBlocks : defaultBlocks) : defaultBlocks;

  const footerSection = {
    ...footer,
    sectionId: 'footer',
    sectionType: 'footer',
    linkLogoToExternalSite: topbar?.logoLink,
    blocks: filteredBlocks,
  };

  return <SectionBuilder sections={[footerSection]} />;
};

// NOTE: if you want to add dynamic data to FooterComponent,
//       you could just connect this FooterContainer to Redux Store
//
// const mapStateToProps = state => {
//   const { currentUser } = state.user;
//   return { currentUser };
// };
// const FooterContainer = compose(connect(mapStateToProps))(FooterComponent);
// export default FooterContainer;

export default FooterComponent;
