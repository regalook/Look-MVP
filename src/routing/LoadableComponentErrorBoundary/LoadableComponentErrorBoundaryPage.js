import { pathByRouteName } from '../../context/localeContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage } from '../../util/reactIntl';

import { Heading, InlineTextButton, LayoutSingleColumn, Logo } from '../../components';

import css from './LoadableComponentErrorBoundary.module.css';

export const LoadableComponentErrorBoundaryPage = () => {
  const routeConfiguration = useRouteConfiguration();
  const landingPagePath = pathByRouteName('LandingPage', routeConfiguration);
  const handleOnClick = () => {
    if (typeof window !== 'undefined') {
      window.location = landingPagePath;
    }
  };

  const landingPageLink = (
    <InlineTextButton onClick={handleOnClick}>
      <FormattedMessage id="LoadableComponentErrorBoundaryPage.landingPageLink" />
    </InlineTextButton>
  );

  return (
    <div>
      <LayoutSingleColumn
        topbar={
          <div className={css.topbar}>
            <InlineTextButton onClick={handleOnClick}>
              <Logo className={css.logoMobile} layout="mobile" />
              <Logo className={css.logoDesktop} layout="desktop" />
            </InlineTextButton>
          </div>
        }
        footer={null}
      >
        <div className={css.root}>
          <div className={css.content}>
            <div className={css.number}>404</div>
            <Heading as="h1" rootClassName={css.heading}>
              <FormattedMessage id="LoadableComponentErrorBoundaryPage.heading" />
            </Heading>
            <p className={css.description}>
              <FormattedMessage
                id="LoadableComponentErrorBoundaryPage.description"
                values={{ link: landingPageLink }}
              />
            </p>
          </div>
        </div>
      </LayoutSingleColumn>
    </div>
  );
};
