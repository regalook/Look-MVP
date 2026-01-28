import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { isNotFoundError } from '../../util/errors';
import { localizedSlug, pageAssetPath } from '../../util/localizedPageAssets';

export const ASSET_NAME = 'privacy-policy';

export const loadData = (params, search) => async dispatch => {
  const locale = params?.locale;
  const localizedAssetName = localizedSlug(ASSET_NAME, locale);
  const hasFallbackContent = true;

  if (localizedAssetName === ASSET_NAME) {
    const pageAsset = { privacyPolicy: pageAssetPath(ASSET_NAME) };
    return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
  }

  try {
    const localizedAsset = { privacyPolicy: pageAssetPath(localizedAssetName) };
    return await dispatch(fetchPageAssets(localizedAsset, hasFallbackContent));
  } catch (e) {
    if (isNotFoundError(e) || e?.status === 404) {
      const fallbackAsset = { privacyPolicy: pageAssetPath(ASSET_NAME) };
      return dispatch(fetchPageAssets(fallbackAsset, hasFallbackContent));
    }
    throw e;
  }
};
