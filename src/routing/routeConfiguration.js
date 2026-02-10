import loadable from '@loadable/component';

import NotFoundPage from '../containers/NotFoundPage/NotFoundPage';
import getPageDataLoadingAPI from '../containers/pageDataLoadingAPI';
import PreviewResolverPage from '../containers/PreviewResolverPage/PreviewResolverPage';

// routeConfiguration needs to initialize containers first
// Otherwise, components will import form container eventually and
// at that point css bundling / imports will happen in wrong order.
import { NamedRedirect } from '../components';

// Multi-language support
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../context/localeContext';

const pageDataLoadingAPI = getPageDataLoadingAPI();

const AuthenticationPage = loadable(() => import(/* webpackChunkName: "AuthenticationPage" */ '../containers/AuthenticationPage/AuthenticationPage'));
const CheckoutPage = loadable(() => import(/* webpackChunkName: "CheckoutPage" */ '../containers/CheckoutPage/CheckoutPage'));
const CMSPage = loadable(() => import(/* webpackChunkName: "CMSPage" */ '../containers/CMSPage/CMSPage'));
const ContactDetailsPage = loadable(() => import(/* webpackChunkName: "ContactDetailsPage" */ '../containers/ContactDetailsPage/ContactDetailsPage'));
const EditListingPage = loadable(() => import(/* webpackChunkName: "EditListingPage" */ '../containers/EditListingPage/EditListingPage'));
const EmailVerificationPage = loadable(() => import(/* webpackChunkName: "EmailVerificationPage" */ '../containers/EmailVerificationPage/EmailVerificationPage'));
const InboxPage = loadable(() => import(/* webpackChunkName: "InboxPage" */ '../containers/InboxPage/InboxPage'));
const MakeOfferPage = loadable(() => import(/* webpackChunkName: "MakeOfferPage" */ '../containers/MakeOfferPage/MakeOfferPage'));
const LandingPage = loadable(() => import(/* webpackChunkName: "LandingPage" */ '../containers/LandingPage/LandingPage'));
const ListingPageCoverPhoto = loadable(() => import(/* webpackChunkName: "ListingPageCoverPhoto" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCoverPhoto'));
const ListingPageCarousel = loadable(() => import(/* webpackChunkName: "ListingPageCarousel" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCarousel'));
const ManageListingsPage = loadable(() => import(/* webpackChunkName: "ManageListingsPage" */ '../containers/ManageListingsPage/ManageListingsPage'));
const ManageRentedListingsPage = loadable(() => import(/* webpackChunkName: "ManageRentedListingsPage" */ '../containers/ManageRentedListingsPage/ManageRentedListingsPage'));
const ManageAccountPage = loadable(() => import(/* webpackChunkName: "ManageAccountPage" */ '../containers/ManageAccountPage/ManageAccountPage'));
const PasswordChangePage = loadable(() => import(/* webpackChunkName: "PasswordChangePage" */ '../containers/PasswordChangePage/PasswordChangePage'));
const PasswordRecoveryPage = loadable(() => import(/* webpackChunkName: "PasswordRecoveryPage" */ '../containers/PasswordRecoveryPage/PasswordRecoveryPage'));
const PasswordResetPage = loadable(() => import(/* webpackChunkName: "PasswordResetPage" */ '../containers/PasswordResetPage/PasswordResetPage'));
const PaymentMethodsPage = loadable(() => import(/* webpackChunkName: "PaymentMethodsPage" */ '../containers/PaymentMethodsPage/PaymentMethodsPage'));
const PrivacyPolicyPage = loadable(() => import(/* webpackChunkName: "PrivacyPolicyPage" */ '../containers/PrivacyPolicyPage/PrivacyPolicyPage'));
const ProfilePage = loadable(() => import(/* webpackChunkName: "ProfilePage" */ '../containers/ProfilePage/ProfilePage'));
const ProfileSettingsPage = loadable(() => import(/* webpackChunkName: "ProfileSettingsPage" */ '../containers/ProfileSettingsPage/ProfileSettingsPage'));
const RequestQuotePage = loadable(() => import(/* webpackChunkName: "RequestQuotePage" */ '../containers/RequestQuotePage/RequestQuotePage'));
const SearchPageWithMap = loadable(() => import(/* webpackChunkName: "SearchPageWithMap" */ /* webpackPrefetch: true */  '../containers/SearchPage/SearchPageWithMap'));
const SearchPageWithGrid = loadable(() => import(/* webpackChunkName: "SearchPageWithGrid" */ /* webpackPrefetch: true */  '../containers/SearchPage/SearchPageWithGrid'));
const StripePayoutPage = loadable(() => import(/* webpackChunkName: "StripePayoutPage" */ '../containers/StripePayoutPage/StripePayoutPage'));
const TermsOfServicePage = loadable(() => import(/* webpackChunkName: "TermsOfServicePage" */ '../containers/TermsOfServicePage/TermsOfServicePage'));
const TransactionPage = loadable(() => import(/* webpackChunkName: "TransactionPage" */ '../containers/TransactionPage/TransactionPage'));
const NoAccessPage = loadable(() => import(/* webpackChunkName: "NoAccessPage" */ '../containers/NoAccessPage/NoAccessPage'));

// Styleguide helps you to review current components and develop new ones
const StyleguidePage = loadable(() => import(/* webpackChunkName: "StyleguidePage" */ '../containers/StyleguidePage/StyleguidePage'));

export const ACCOUNT_SETTINGS_PAGES = [
  'ContactDetailsPage',
  'PasswordChangePage',
  'StripePayoutPage',
  'PaymentMethodsPage',
  'ManageAccountPage'
];

// https://en.wikipedia.org/wiki/Universally_unique_identifier#Nil_UUID
const draftId = '00000000-0000-0000-0000-000000000000';
const draftSlug = 'draft';

const RedirectToLandingPage = () => <NamedRedirect name="LandingPage" />;

// Redirect root path to default locale
const LocaleRedirect = () => {
  // On client side, we can check browser preference
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language?.split('-')[0];
    const locale = SUPPORTED_LOCALES.includes(browserLang) ? browserLang : DEFAULT_LOCALE;
    return <NamedRedirect name="LandingPage" params={{ locale }} />;
  }
  // On server side, default to DEFAULT_LOCALE
  return <NamedRedirect name="LandingPage" params={{ locale: DEFAULT_LOCALE }} />;
};

/**
 * Add locale prefix to route path
 * @param {string} path - Original route path
 * @returns {string} - Path with locale prefix
 */
const withLocale = path => {
  if (path === '/') {
    return '/:locale';
  }
  return `/:locale${path}`;
};

// NOTE: Most server-side endpoints are prefixed with /api. Requests to those
// endpoints are indended to be handled in the server instead of the browser and
// they will not render the application. So remember to avoid routes starting
// with /api and if you encounter clashing routes see server/index.js if there's
// a conflicting route defined there.

// Our routes are exact by default.
// See behaviour from Routes.js where Route is created.
const routeConfiguration = (layoutConfig, accessControlConfig) => {
  const SearchPage = layoutConfig.searchPage?.variantType === 'map' 
    ? SearchPageWithMap 
    : SearchPageWithGrid;
  const ListingPage = layoutConfig.listingPage?.variantType === 'carousel' 
    ? ListingPageCarousel 
    : ListingPageCoverPhoto;

  const isPrivateMarketplace = accessControlConfig?.marketplace?.private === true;
  const authForPrivateMarketplace = isPrivateMarketplace ? { auth: true } : {};
  
  return [
    // Root path redirects to default locale
    {
      path: '/',
      name: 'LocaleRedirect',
      component: LocaleRedirect,
    },
    // Legacy permanent-page aliases (kept for existing links/SEO).
    //
    // Terms of service and privacy policy are built-in pages in this template and have
    // fixed canonical routes under `/:locale/...`. Some hosted content still links to
    // legacy CMS-style paths under `/p/...` (often as absolute URLs), so we redirect those
    // to the canonical routes.
    {
      path: '/p/terms-of-service-es',
      name: 'LegacyTermsOfServiceEsRedirect',
      component: () => <NamedRedirect name="TermsOfServicePage" params={{ locale: 'es' }} />,
    },
    {
      path: '/p/terms-of-service',
      name: 'LegacyTermsOfServiceEnRedirect',
      component: () => <NamedRedirect name="TermsOfServicePage" params={{ locale: 'en' }} />,
    },
    {
      path: '/p/privacy-policy-es',
      name: 'LegacyPrivacyPolicyEsRedirect',
      component: () => <NamedRedirect name="PrivacyPolicyPage" params={{ locale: 'es' }} />,
    },
    {
      path: '/p/privacy-policy',
      name: 'LegacyPrivacyPolicyEnRedirect',
      component: () => <NamedRedirect name="PrivacyPolicyPage" params={{ locale: 'en' }} />,
    },
    // Legacy/non-localized CMS page route.
    //
    // Some hosted content (e.g. footer markdown) may link to `/p/:pageId` without a locale prefix.
    // Our localized routes use `/:locale/p/:pageId`, so without this alias those links fall back
    // to a full page load and end up as NotFound in SSR.
    {
      path: '/p/:pageId',
      name: 'CMSPageLegacy',
      component: CMSPage,
      loadData: pageDataLoadingAPI.CMSPage.loadData,
    },
    // Do not change these paths!
    //
    // The API expects that the application implements these endpoints without locale prefix.
    // NOTE: These must be defined before the localized landing page route (`/:locale`) because
    // otherwise `/verify-email` etc. would be treated as an invalid locale and redirected.
    {
      path: '/reset-password',
      name: 'PasswordResetPage',
      component: PasswordResetPage,
    },
    {
      path: '/verify-email',
      name: 'EmailVerificationPage',
      auth: true,
      authPage: 'LoginPage',
      component: EmailVerificationPage,
      loadData: pageDataLoadingAPI.EmailVerificationPage.loadData,
    },
    {
      path: '/preview',
      name: 'PreviewResolverPage',
      component: PreviewResolverPage,
    },
    // Localized landing page
    {
      path: withLocale('/'),
      name: 'LandingPage',
      component: LandingPage,
      loadData: pageDataLoadingAPI.LandingPage.loadData,
    },
    {
      path: withLocale('/p/:pageId'),
      name: 'CMSPage',
      component: CMSPage,
      loadData: pageDataLoadingAPI.CMSPage.loadData,
    },
    // NOTE: when the private marketplace feature is enabled, the '/s' route is disallowed by the robots.txt resource.
    // If you add new routes that start with '/s*' (e.g. /support), you should add them to the robotsPrivateMarketplace.txt file.
    {
      path: withLocale('/s'),
      name: 'SearchPage',
      ...authForPrivateMarketplace,
      component: SearchPage,
      loadData: pageDataLoadingAPI.SearchPage.loadData,
    },
    {
      path: withLocale('/s/:listingType'),
      name: 'SearchPageWithListingType',
      ...authForPrivateMarketplace,
      component: SearchPage,
      loadData: pageDataLoadingAPI.SearchPage.loadData,
    },
    {
      path: withLocale('/l'),
      name: 'ListingBasePage',
      component: RedirectToLandingPage,
    },
    {
      path: withLocale('/l/:slug/:id'),
      name: 'ListingPage',
      ...authForPrivateMarketplace,
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: withLocale('/l/:slug/:id/make-offer'),
      name: 'MakeOfferPage',
      auth: true,
      component: MakeOfferPage,
      loadData: pageDataLoadingAPI.MakeOfferPage.loadData,
    },
    {
      path: withLocale('/l/:slug/:id/request-quote'),
      name: 'RequestQuotePage',
      auth: true,
      component: RequestQuotePage,
      extraProps: { mode: 'request-quote' },
      loadData: pageDataLoadingAPI.RequestQuotePage.loadData,
    },
    {
      path: withLocale('/l/:slug/:id/checkout'),
      name: 'CheckoutPage',
      auth: true,
      component: CheckoutPage,
      setInitialValues: pageDataLoadingAPI.CheckoutPage.setInitialValues,
    },
    {
      path: withLocale('/l/:slug/:id/:variant'),
      name: 'ListingPageVariant',
      auth: true,
      authPage: 'LoginPage',
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: withLocale('/l/new'),
      name: 'NewListingPage',
      auth: true,
      component: () => (
        <NamedRedirect
          name="EditListingPage"
          params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }}
        />
      ),
    },
    {
      path: withLocale('/l/:slug/:id/:type/:tab'),
      name: 'EditListingPage',
      auth: true,
      component: EditListingPage,
      loadData: pageDataLoadingAPI.EditListingPage.loadData,
    },
    {
      path: withLocale('/l/:slug/:id/:type/:tab/:returnURLType'),
      name: 'EditListingStripeOnboardingPage',
      auth: true,
      component: EditListingPage,
      loadData: pageDataLoadingAPI.EditListingPage.loadData,
    },

    // Canonical path should be after the `/l/new` path since they
    // conflict and `new` is not a valid listing UUID.
    {
      path: withLocale('/l/:id'),
      name: 'ListingPageCanonical',
      ...authForPrivateMarketplace,
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: withLocale('/u'),
      name: 'ProfileBasePage',
      component: RedirectToLandingPage,
    },
    {
      path: withLocale('/u/:id'),
      name: 'ProfilePage',
      ...authForPrivateMarketplace,
      component: ProfilePage,
      loadData: pageDataLoadingAPI.ProfilePage.loadData,
    },
    {
      path: withLocale('/u/:id/:variant'),
      name: 'ProfilePageVariant',
      auth: true,
      component: ProfilePage,
      loadData: pageDataLoadingAPI.ProfilePage.loadData,
    },
    {
      path: withLocale('/profile-settings'),
      name: 'ProfileSettingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ProfileSettingsPage,
    },

    // Note: authenticating with IdP (e.g. Facebook) expects that /login path exists
    // so that in the error case users can be redirected back to the LoginPage
    // In case you change this, remember to update the route in server/api/auth/loginWithIdp.js
    {
      path: withLocale('/login'),
      name: 'LoginPage',
      component: AuthenticationPage,
      extraProps: { tab: 'login' },
    },
    {
      path: withLocale('/signup'),
      name: 'SignupPage',
      component: AuthenticationPage,
      extraProps: { tab: 'signup' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },
    {
      path: withLocale('/signup/:userType'),
      name: 'SignupForUserTypePage',
      component: AuthenticationPage,
      extraProps: { tab: 'signup' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },
    {
      path: withLocale('/confirm'),
      name: 'ConfirmPage',
      component: AuthenticationPage,
      extraProps: { tab: 'confirm' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },
    {
      path: withLocale('/recover-password'),
      name: 'PasswordRecoveryPage',
      component: PasswordRecoveryPage,
    },
    {
      path: withLocale('/inbox'),
      name: 'InboxBasePage',
      auth: true,
      authPage: 'LoginPage',
      component: () => <NamedRedirect name="InboxPage" params={{ tab: 'sales' }} />,
    },
    {
      path: withLocale('/inbox/:tab'),
      name: 'InboxPage',
      auth: true,
      authPage: 'LoginPage',
      component: InboxPage,
      loadData: pageDataLoadingAPI.InboxPage.loadData,
    },
    {
      path: withLocale('/order/:id'),
      name: 'OrderDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: TransactionPage,
      extraProps: { transactionRole: 'customer' },
      loadData: (params, ...rest) =>
        pageDataLoadingAPI.TransactionPage.loadData({ ...params, transactionRole: 'customer' }, ...rest),
      setInitialValues: pageDataLoadingAPI.TransactionPage.setInitialValues,
    },
    {
      path: withLocale('/order/:id/details'),
      name: 'OrderDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      component: props => <NamedRedirect name="OrderDetailsPage" params={{ id: props.params?.id }} />,
    },
    {
      path: withLocale('/sale/:id'),
      name: 'SaleDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: TransactionPage,
      extraProps: { transactionRole: 'provider' },
      loadData: pageDataLoadingAPI.TransactionPage.loadData,
    },
    {
      path: withLocale('/sale/:id/details'),
      name: 'SaleDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      component: props => <NamedRedirect name="SaleDetailsPage" params={{ id: props.params?.id }} />,
    },
    {
      path: withLocale('/listings'),
      name: 'ManageListingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ManageListingsPage,
      loadData: pageDataLoadingAPI.ManageListingsPage.loadData,
    },
    {
      path: withLocale('/rented'),
      name: 'ManageRentedListingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ManageRentedListingsPage,
      loadData: pageDataLoadingAPI.ManageRentedListingsPage.loadData,
    },
    {
      path: withLocale('/account'),
      name: 'AccountSettingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: () => <NamedRedirect name="ContactDetailsPage" />,
    },
    {
      path: withLocale('/account/contact-details'),
      name: 'ContactDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ContactDetailsPage,
      loadData: pageDataLoadingAPI.ContactDetailsPage.loadData,
    },
    {
      path: withLocale('/account/change-password'),
      name: 'PasswordChangePage',
      auth: true,
      authPage: 'LoginPage',
      component: PasswordChangePage,
    },
    {
      path: withLocale('/account/payments'),
      name: 'StripePayoutPage',
      auth: true,
      authPage: 'LoginPage',
      component: StripePayoutPage,
      loadData: pageDataLoadingAPI.StripePayoutPage.loadData,
    },
    {
      path: withLocale('/account/payments/:returnURLType'),
      name: 'StripePayoutOnboardingPage',
      auth: true,
      authPage: 'LoginPage',
      component: StripePayoutPage,
      loadData: pageDataLoadingAPI.StripePayoutPage.loadData,
    },
    {
      path: withLocale('/account/payment-methods'),
      name: 'PaymentMethodsPage',
      auth: true,
      authPage: 'LoginPage',
      component: PaymentMethodsPage,
      loadData: pageDataLoadingAPI.PaymentMethodsPage.loadData,
    },
    {
      path: withLocale('/account/manage'),
      name: 'ManageAccountPage',
      auth: true,
      authPage: 'LoginPage',
      component: ManageAccountPage,
    },
    {
      path: withLocale('/terms-of-service'),
      name: 'TermsOfServicePage',
      component: TermsOfServicePage,
      loadData: pageDataLoadingAPI.TermsOfServicePage.loadData,
    },
    {
      path: withLocale('/privacy-policy'),
      name: 'PrivacyPolicyPage',
      component: PrivacyPolicyPage,
      loadData: pageDataLoadingAPI.PrivacyPolicyPage.loadData,
    },
    {
      path: withLocale('/styleguide'),
      name: 'Styleguide',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: withLocale('/styleguide/g/:group'),
      name: 'StyleguideGroup',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: withLocale('/styleguide/c/:component'),
      name: 'StyleguideComponent',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: withLocale('/styleguide/c/:component/:example'),
      name: 'StyleguideComponentExample',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: withLocale('/styleguide/c/:component/:example/raw'),
      name: 'StyleguideComponentExampleRaw',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
      extraProps: { raw: true },
    },
    {
      path: withLocale('/no-:missingAccessRight'),
      name: 'NoAccessPage',
      component: NoAccessPage,
    },
    {
      path: withLocale('/notfound'),
      name: 'NotFoundPage',
      component: props => <NotFoundPage {...props} />,
    },
  ];
};

export default routeConfiguration;
