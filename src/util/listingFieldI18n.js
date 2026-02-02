export const LISTING_FIELD_LABEL_IDS_BY_KEY = {
  dimensionsHeightCm: 'ListingPage.detailDimensionsHeightCm',
  dimensions_height_cm: 'ListingPage.detailDimensionsHeightCm',
  dimensionsHeight: 'ListingPage.detailDimensionsHeightCm',
  dimensionsWidthCm: 'ListingPage.detailDimensionsWidthCm',
  dimensions_width_cm: 'ListingPage.detailDimensionsWidthCm',
  dimensionsWidth: 'ListingPage.detailDimensionsWidthCm',
  estimatedVisibilityFootTraffic: 'ListingPage.detailEstimatedVisibilityFootTraffic',
  estimated_visibility_foot_traffic: 'ListingPage.detailEstimatedVisibilityFootTraffic',
  visibilityFootTraffic: 'ListingPage.detailEstimatedVisibilityFootTraffic',
  footTraffic: 'ListingPage.detailEstimatedVisibilityFootTraffic',
  lightingVisibilityFeatures: 'ListingPage.detailLightingVisibilityFeatures',
  lighting_visibility_features: 'ListingPage.detailLightingVisibilityFeatures',
  allowedAdTypes: 'ListingPage.detailAllowedAdTypes',
  allowed_ad_types: 'ListingPage.detailAllowedAdTypes',
};

export const LISTING_FIELD_LABEL_IDS_BY_LABEL = {
  'Dimensions Height cm': 'ListingPage.detailDimensionsHeightCm',
  'Dimensions Width cm': 'ListingPage.detailDimensionsWidthCm',
  'Estimated Visibility / Foot Traffic': 'ListingPage.detailEstimatedVisibilityFootTraffic',
  'Lighting & Visibility Features': 'ListingPage.detailLightingVisibilityFeatures',
  'Allowed Ad Types': 'ListingPage.detailAllowedAdTypes',
};

export const getListingFieldLabel = ({ key, label }, intl) => {
  const id =
    LISTING_FIELD_LABEL_IDS_BY_KEY[key] || LISTING_FIELD_LABEL_IDS_BY_LABEL[label] || null;
  return id && intl ? intl.formatMessage({ id }) : label;
};

export const isAllowedAdTypesField = key =>
  key === 'allowedAdTypes' || key === 'allowed_ad_types';

export const isAllowedAdsField = key => key === 'allowedAds' || key === 'allowed_ads';

export const getAllowedAdTypeLabel = (value, fallbackLabel, intl) => {
  if (!intl) return fallbackLabel || value;
  const id = `Listing.allowedAdTypes.${value}`;
  return intl.formatMessage({ id, defaultMessage: fallbackLabel || value });
};

export const getAllowedAdsLabel = (value, fallbackLabel, intl) => {
  if (!intl) return fallbackLabel || value;
  const id = `Listing.allowedAds.${value}`;
  return intl.formatMessage({ id, defaultMessage: fallbackLabel || value });
};
