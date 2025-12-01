import classNames from 'classnames';
import { useState } from 'react';

// Import configs and util modules
import { FIXED, isBookingProcess } from '../../../../transactions/transaction';
import { isPriceVariationsEnabled } from '../../../../util/configHelpers';
import { isValidCurrencyForTransactionProcess } from '../../../../util/fieldHelpers';
import { FormattedMessage } from '../../../../util/reactIntl';
import { types as sdkTypes } from '../../../../util/sdkLoader';
import { LISTING_STATE_DRAFT, propTypes } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import {
  getInitialValuesForPriceVariants,
  handleSubmitValuesForPriceVariants,
} from './BookingPriceVariants';
import EditListingPricingForm from './EditListingPricingForm';
import css from './EditListingPricingPanel.module.css';
import {
  getInitialValuesForStartTimeInterval,
  handleSubmitValuesForStartTimeInterval,
} from './StartTimeInverval';

const { Money } = sdkTypes;

const getListingTypeConfig = (publicData, listingTypes) => {
  const selectedListingType = publicData.listingType;
  return listingTypes.find(conf => conf.listingType === selectedListingType);
};

// NOTE: components that handle price variants and start time interval are currently
// exporting helper functions that handle the initial values and the submission values.
// This is a tentative approach to contain logic in one place.
// Helper to get installation cost as Money object from publicData
const getInstallationCostMaybe = (publicData, currency) => {
  const { installationCostInSubunits } = publicData || {};
  return installationCostInSubunits && currency
    ? { installationCost: new Money(installationCostInSubunits, currency) }
    : {};
};

// Helper to get installation days after from publicData
const getInstallationDaysAfterMaybe = publicData => {
  const { installationDaysAfter } = publicData || {};
  return installationDaysAfter != null
    ? { installationDaysAfter: String(installationDaysAfter) }
    : {};
};

const getInitialValues = props => {
  const { listing, listingTypes } = props;
  const { publicData, price } = listing?.attributes || {};
  const { unitType } = publicData || {};
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypes);
  const currency = price?.currency;

  const installationCostMaybe = getInstallationCostMaybe(publicData, currency);
  const installationDaysAfterMaybe = getInstallationDaysAfterMaybe(publicData);

  return unitType === FIXED || isPriceVariationsInUse
    ? {
        ...getInitialValuesForPriceVariants(props, isPriceVariationsInUse),
        ...getInitialValuesForStartTimeInterval(props),
        ...installationCostMaybe,
        ...installationDaysAfterMaybe,
      }
    : {
        price: listing?.attributes?.price,
        ...installationCostMaybe,
        ...installationDaysAfterMaybe,
      };
};

// This is needed to show the listing's price consistently over XHR calls.
// I.e. we don't change the API entity saved to Redux store.
// Instead, we use a temporary entity inside the form's state.
const getOptimisticListing = (listing, updateValues) => {
  const tmpListing = {
    ...listing,
    attributes: {
      ...listing.attributes,
      ...updateValues,
      publicData: {
        ...listing.attributes?.publicData,
        ...updateValues?.publicData,
      },
    },
  };
  return tmpListing;
};

/**
 * The EditListingPricingPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {string} props.marketplaceCurrency - The marketplace currency
 * @param {number} props.listingMinimumPriceSubUnits - The listing minimum price sub units
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Function} props.onSubmit - The submit function
 * @param {string} props.submitButtonText - The submit button text
 * @param {Array<propTypes.listingType>} props.listingTypes - The listing types
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the panel is updating
 * @param {Object} props.errors - The errors
 * @returns {JSX.Element}
 */
const EditListingPricingPanel = props => {
  const [state, setState] = useState({ initialValues: getInitialValues(props) });

  const {
    className,
    rootClassName,
    listing,
    marketplaceCurrency,
    listingMinimumPriceSubUnits,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    listingTypes,
    panelUpdated,
    updateInProgress,
    errors,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const initialValues = state.initialValues;
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const publicData = listing?.attributes?.publicData;
  const listingTypeConfig = getListingTypeConfig(publicData, listingTypes);
  const transactionProcessAlias = listingTypeConfig?.transactionType?.alias;
  const process = listingTypeConfig?.transactionType?.process;
  const isBooking = isBookingProcess(process);

  // Note: publicData contains priceVariationsEnabled if listing is created with priceVariations enabled.
  const isPriceVariationsInUse = isPriceVariationsEnabled(publicData, listingTypeConfig);

  const isCompatibleCurrency = isValidCurrencyForTransactionProcess(
    transactionProcessAlias,
    marketplaceCurrency
  );

  const priceCurrencyValid = !isCompatibleCurrency
    ? false
    : marketplaceCurrency && initialValues.price instanceof Money
    ? initialValues.price.currency === marketplaceCurrency
    : !!marketplaceCurrency;
  const unitType = listing?.attributes?.publicData?.unitType;

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingPricingPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingPricingPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>
      {priceCurrencyValid ? (
        <EditListingPricingForm
          className={css.form}
          initialValues={initialValues}
          onSubmit={values => {
            const { price, installationCost, installationDaysAfter } = values;

            // Convert installation cost Money to subunits for storage in publicData
            const installationCostInSubunits = installationCost?.amount || null;
            // Parse installation days after as integer (or null if empty)
            const installationDaysAfterValue = installationDaysAfter
              ? parseInt(installationDaysAfter, 10)
              : null;

            // New values for listing attributes
            let updateValues = {};

            if (unitType === FIXED || isPriceVariationsInUse) {
              let publicDataUpdates = {
                priceVariationsEnabled: isPriceVariationsInUse,
                installationCostInSubunits,
                installationDaysAfter: installationDaysAfterValue,
              };
              // NOTE: components that handle price variants and start time interval are currently
              // exporting helper functions that handle the initial values and the submission values.
              // This is a tentative approach to contain logic in one place.
              // We might remove or improve this setup in the future.

              // This adds startTimeInterval to publicData
              const startTimeIntervalChanges = handleSubmitValuesForStartTimeInterval(
                values,
                publicDataUpdates
              );
              // This adds lowest price variant to the listing.attributes.price and priceVariants to listing.attributes.publicData
              const priceVariantChanges = handleSubmitValuesForPriceVariants(
                values,
                publicDataUpdates,
                unitType,
                listingTypeConfig
              );
              updateValues = {
                ...priceVariantChanges,
                ...startTimeIntervalChanges,
                publicData: {
                  priceVariationsEnabled: isPriceVariationsInUse,
                  installationCostInSubunits,
                  installationDaysAfter: installationDaysAfterValue,
                  ...startTimeIntervalChanges.publicData,
                  ...priceVariantChanges.publicData,
                },
              };
            } else {
              const priceVariationsEnabledMaybe = isBooking
                ? {
                    publicData: {
                      priceVariationsEnabled: false,
                      installationCostInSubunits,
                      installationDaysAfter: installationDaysAfterValue,
                    },
                  }
                : {
                    publicData: {
                      installationCostInSubunits,
                      installationDaysAfter: installationDaysAfterValue,
                    },
                  };
              updateValues = { price, ...priceVariationsEnabledMaybe };
            }

            // Save the initialValues to state
            // Otherwise, re-rendering would overwrite the values during XHR call.
            setState({
              initialValues: getInitialValues({
                listing: getOptimisticListing(listing, updateValues),
                listingTypes,
              }),
            });
            onSubmit(updateValues);
          }}
          marketplaceCurrency={marketplaceCurrency}
          unitType={unitType}
          listingTypeConfig={listingTypeConfig}
          isPriceVariationsInUse={isPriceVariationsInUse}
          listingMinimumPriceSubUnits={listingMinimumPriceSubUnits}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency }}
          />
        </div>
      )}
    </main>
  );
};

export default EditListingPricingPanel;
