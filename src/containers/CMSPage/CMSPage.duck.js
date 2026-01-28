import { fetchPageAssets } from '../../ducks/hostedAssets.duck';
import { isNotFoundError } from '../../util/errors';
import { localizedSlug, pageAssetPath } from '../../util/localizedPageAssets';

export const loadData = (params, search) => async dispatch => {
  const pageId = params.pageId;
  const locale = params.locale;
  const localizedPageId = localizedSlug(pageId, locale);
  const hasFallbackContent = false;

  if (localizedPageId === pageId) {
    const pageAsset = { [pageId]: pageAssetPath(pageId) };
    return dispatch(fetchPageAssets(pageAsset, hasFallbackContent));
  }

  try {
    const localizedAsset = { [pageId]: pageAssetPath(localizedPageId) };
    return await dispatch(fetchPageAssets(localizedAsset, hasFallbackContent));
  } catch (e) {
    if (isNotFoundError(e) || e?.status === 404) {
      const baseAsset = { [pageId]: pageAssetPath(pageId) };
      return dispatch(fetchPageAssets(baseAsset, hasFallbackContent));
    }
    throw e;
  }
};
