import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { showCreateListingLinkForUser } from '../../util/userHelpers';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

import {
  H3,
  Page,
  PaginationLinks,
  UserNav,
  LayoutSingleColumn,
  NamedLink,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { getTransactionsById } from './ManageRentedListingsPage.duck';
import css from './ManageRentedListingsPage.module.css';

const Heading = props => {
  const { listingsAreLoaded, pagination } = props;
  const hasResults = listingsAreLoaded && pagination && pagination.totalItems > 0;
  const hasNoResults = listingsAreLoaded && pagination && pagination.totalItems === 0;

  return hasResults ? (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage
        id="ManageRentedListingsPage.youHaveListings"
        values={{ count: pagination.totalItems }}
      />
    </H3>
  ) : hasNoResults ? (
    <div className={css.noResultsContainer}>
      <H3 as="h1" className={css.headingNoListings}>
        <FormattedMessage id="ManageRentedListingsPage.noResults" />
      </H3>
      <p className={css.createListingParagraph}>
        <NamedLink className={css.createListingLink} name="SearchPage">
          <FormattedMessage id="ManageRentedListingsPage.browseListings" />
        </NamedLink>
      </p>
    </div>
  ) : null;
};

const PaginationLinksMaybe = props => {
  const { listingsAreLoaded, pagination, page } = props;
  return listingsAreLoaded && pagination && pagination.totalPages > 1 ? (
    <PaginationLinks
      className={css.pagination}
      pageName="ManageRentedListingsPage"
      pageSearchParams={{ page }}
      pagination={pagination}
    />
  ) : null;
};

/**
 * The ManageRentedListingsPage component.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element} manage rented listings page component
 */
export const ManageRentedListingsPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();

  const {
    currentUser,
    transactions = [],
    pagination,
    queryInProgress,
    queryTransactionsError,
    queryParams,
    scrollingDisabled,
  } = props;

  // Debug logging
  console.log('ManageRentedListingsPage render:', {
    queryInProgress,
    pagination,
    transactionsCount: transactions?.length,
    queryTransactionsError,
  });

  const hasPaginationInfo = !!pagination && pagination.totalItems != null;
  const listingsAreLoaded = !queryInProgress && hasPaginationInfo;

  const loadingResults = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="ManageRentedListingsPage.loadingOwnListings" />
      </H3>
    </div>
  );

  const queryError = (
    <div className={css.messagePanel}>
      <H3 as="h2" className={css.heading}>
        <FormattedMessage id="ManageRentedListingsPage.queryError" />
      </H3>
    </div>
  );

  const showManageListingsLink = showCreateListingLinkForUser(config, currentUser);

  // Show loading if in progress or if we haven't loaded pagination info yet
  const shouldShowLoading = queryInProgress || (!hasPaginationInfo && !queryTransactionsError);

  return (
    <Page
      title={intl.formatMessage({ id: 'ManageRentedListingsPage.title' })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer />
            <UserNav
              currentPage="ManageRentedListingsPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        footer={<FooterContainer />}
      >
        {shouldShowLoading ? loadingResults : null}
        {queryTransactionsError ? queryError : null}

        {listingsAreLoaded ? (
          <div className={css.listingPanel}>
            <Heading listingsAreLoaded={listingsAreLoaded} pagination={pagination} />

            <div className={css.listingCards}>
              {transactions && transactions.length > 0 ? (
                transactions.map(tx => {
                  if (!tx || !tx.id) return null;
                  const listing = tx.listing;
                  return (
                    <div key={tx.id.uuid} className={css.listingCard}>
                      <p>Rented: {listing?.attributes?.title || 'Untitled'}</p>
                      <p>Provider: {tx.provider?.attributes?.profile?.displayName || 'Unknown'}</p>
                    </div>
                  );
                })
              ) : null}
            </div>

            <PaginationLinksMaybe
              listingsAreLoaded={listingsAreLoaded}
              pagination={pagination}
              page={queryParams ? queryParams.page : 1}
            />
          </div>
        ) : null}
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    currentPageResultIds = [],
    pagination,
    queryInProgress,
    queryTransactionsError,
    queryParams,
  } = state.ManageRentedListingsPage || {};
  const transactions = getTransactionsById(state, currentPageResultIds) || [];
  
  console.log('mapStateToProps:', {
    currentPageResultIds,
    transactionsFromSelector: transactions,
    pagination,
    queryInProgress,
  });
  
  return {
    currentUser,
    currentPageResultIds,
    transactions,
    pagination,
    queryInProgress,
    queryTransactionsError,
    queryParams,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const ManageRentedListingsPage = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(ManageRentedListingsPageComponent);

export default ManageRentedListingsPage;
