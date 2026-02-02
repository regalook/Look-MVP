export const CATEGORY_MESSAGE_PREFIX = 'Listing.category';
export const SUBCATEGORY_MESSAGE_PREFIX = 'Listing.subcategory';

export const getCategoryLabel = ({ id, name, level }, intl) => {
  if (!id) return name;
  const prefix = level && level > 1 ? SUBCATEGORY_MESSAGE_PREFIX : CATEGORY_MESSAGE_PREFIX;
  const messageId = `${prefix}.${id}`;
  return intl ? intl.formatMessage({ id: messageId, defaultMessage: name }) : name;
};

