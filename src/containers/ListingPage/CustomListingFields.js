import React from 'react';

// Utils
import { SCHEMA_TYPE_MULTI_ENUM, SCHEMA_TYPE_TEXT, SCHEMA_TYPE_YOUTUBE } from '../../util/types';
import {
  isFieldForCategory,
  pickCategoryFields,
  pickCustomFieldProps,
} from '../../util/fieldHelpers.js';
import {
  getAllowedAdTypeLabel,
  getAllowedAdsLabel,
  getListingFieldLabel,
  isAllowedAdTypesField,
  isAllowedAdsField,
} from '../../util/listingFieldI18n';

import SectionDetailsMaybe from './SectionDetailsMaybe';
import SectionMultiEnumMaybe from './SectionMultiEnumMaybe';
import SectionTextMaybe from './SectionTextMaybe';
import SectionYoutubeVideoMaybe from './SectionYoutubeVideoMaybe';

/**
 * Renders custom listing fields.
 * - SectionDetailsMaybe is used if schemaType is 'enum', 'long', or 'boolean'
 * - SectionMultiEnumMaybe is used if schemaType is 'multi-enum'
 * - SectionTextMaybe is used if schemaType is 'text'
 *
 * @param {*} props include publicData, metadata, listingFieldConfigs, categoryConfiguration
 * @returns React.Fragment containing aforementioned components
 */
const CustomListingFields = props => {
  const { publicData, metadata, listingFieldConfigs, categoryConfiguration, intl } = props;

  const { key: categoryPrefix, categories: listingCategoriesConfig } = categoryConfiguration;
  const categoriesObj = pickCategoryFields(publicData, categoryPrefix, 1, listingCategoriesConfig);
  const currentCategories = Object.values(categoriesObj);

  const isFieldForSelectedCategories = fieldConfig => {
    const isTargetCategory = isFieldForCategory(currentCategories, fieldConfig);
    return isTargetCategory;
  };
  const propsForCustomFieldsRaw =
    pickCustomFieldProps(
      publicData,
      metadata,
      listingFieldConfigs,
      'listingType',
      isFieldForSelectedCategories
    ) || [];
  const propsForCustomFields = propsForCustomFieldsRaw.map(fieldProps => {
    const translatedHeading = getListingFieldLabel(
      { key: fieldProps.key, label: fieldProps.heading },
      intl
    );
    if (
      fieldProps.schemaType === SCHEMA_TYPE_MULTI_ENUM &&
      (isAllowedAdTypesField(fieldProps.key) || isAllowedAdsField(fieldProps.key))
    ) {
      const translatedOptions = (fieldProps.options || []).map(o => ({
        ...o,
        label: isAllowedAdsField(fieldProps.key)
          ? getAllowedAdsLabel(o.key, o.label, intl)
          : getAllowedAdTypeLabel(o.key, o.label, intl),
      }));
      return { ...fieldProps, heading: translatedHeading, options: translatedOptions };
    }
    return { ...fieldProps, heading: translatedHeading };
  });

  return (
    <>
      <SectionDetailsMaybe {...props} isFieldForCategory={isFieldForSelectedCategories} />
      {propsForCustomFields.map(customFieldProps => {
        const { schemaType, key, ...fieldProps } = customFieldProps;
        return schemaType === SCHEMA_TYPE_MULTI_ENUM ? (
          <SectionMultiEnumMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_TEXT ? (
          <SectionTextMaybe key={key} {...fieldProps} />
        ) : schemaType === SCHEMA_TYPE_YOUTUBE ? (
          <SectionYoutubeVideoMaybe key={key} {...fieldProps} />
        ) : null;
      })}
    </>
  );
};

export default CustomListingFields;
