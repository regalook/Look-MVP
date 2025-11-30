import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { denormalisedEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';
import { getSupportedProcessesInfo } from '../../transactions/transaction';
import { addMarketplaceEntities } from '../../ducks/marketplaceData.duck';

import { fetchCurrentUser } from '../../ducks/user.duck';

// Pagination page size might need to be dynamic on responsive page layouts
// Current design has max 3 columns 42 is divisible by 2 and 3
// So, there's enough cards to fill all columns on full pagination pages
const RESULT_PAGE_SIZE = 42;

// ================ Selectors ================ //

/**
 * Get the denormalised transaction entities with the given IDs
 *
 * @param {Object} state the full Redux store
 * @param {Array<UUID>} transactionIds transaction IDs to select from the store
 */
export const getTransactionsById = (state, transactionIds) => {
  if (!transactionIds || transactionIds.length === 0) {
    return [];
  }
  if (!state.marketplaceData || !state.marketplaceData.entities) {
    console.warn('marketplaceData or entities not found in state');
    return [];
  }
  const resources = transactionIds.map(id => ({
    id,
    type: 'transaction',
  }));
  const throwIfNotFound = false;
  const result = denormalisedEntities(state.marketplaceData.entities, resources, throwIfNotFound);
  console.log('getTransactionsById result:', { transactionIds, result });
  return result || [];
};

// ================ Async Thunks ================ //

//////////////////////////
// Query Rented Items   //
//////////////////////////
const queryRentedItemsPayloadCreator = (queryParams, { extra: sdk, dispatch, rejectWithValue }) => {
  const processNames = getSupportedProcessesInfo().map(p => p.name);
  
  const params = {
    ...queryParams,
    only: 'order', // Get transactions where current user is the customer
    processNames,
    include: [
      'listing',
      'listing.images',
      'provider',
      'provider.profileImage',
    ],
    'fields.transaction': [
      'processName',
      'lastTransition',
      'lastTransitionedAt',
      'lineItems',
    ],
    'fields.listing': ['title', 'description', 'price', 'publicData', 'deleted'],
    'fields.user': ['profile.displayName', 'profile.abbreviatedName'],
    'fields.image': ['variants.listing-card', 'variants.listing-card-2x'],
  };

  return sdk.transactions
    .query(params)
    .then(response => {
      dispatch(addMarketplaceEntities(response));
      return response;
    })
    .catch(e => {
      return rejectWithValue(storableError(e));
    });
};

export const queryRentedItemsThunk = createAsyncThunk(
  'app/ManageRentedListingsPage/queryRentedItems',
  queryRentedItemsPayloadCreator
);
// Backward compatible wrapper for the thunk
export const queryRentedItems = queryParams => (dispatch, getState, sdk) => {
  return dispatch(queryRentedItemsThunk(queryParams)).unwrap();
};

// ================ Slice ================ //

const resultIds = data => data.data.data.map(t => t.id);

const manageRentedListingsPageSlice = createSlice({
  name: 'ManageRentedListingsPage',
  initialState: {
    pagination: null,
    queryParams: null,
    queryInProgress: false,
    queryTransactionsError: null,
    currentPageResultIds: [],
  },
  reducers: {},
  extraReducers: builder => {
    // Query rented items (transactions where user is customer)
    builder
      .addCase(queryRentedItemsThunk.pending, (state, action) => {
        state.queryParams = action.meta.arg;
        state.queryInProgress = true;
        state.queryTransactionsError = null;
        state.currentPageResultIds = [];
      })
      .addCase(queryRentedItemsThunk.fulfilled, (state, action) => {
        state.currentPageResultIds = resultIds(action.payload);
        state.pagination = action.payload.data.meta;
        state.queryInProgress = false;
      })
      .addCase(queryRentedItemsThunk.rejected, (state, action) => {
        // eslint-disable-next-line no-console
        console.error(action.payload || action.error);
        state.queryInProgress = false;
        state.queryTransactionsError = action.payload;
      });
  },
});

export default manageRentedListingsPageSlice.reducer;

// ================ Load data ================ //

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  const queryParams = parse(search);
  const page = queryParams.page || 1;

  return Promise.all([
    dispatch(fetchCurrentUser()),
    dispatch(
      queryRentedItems({
        page,
        perPage: RESULT_PAGE_SIZE,
      })
    ),
  ])
    .then(response => {
      // const currentUser = response[0]?.data?.data;
      const transactions = response[1]?.data?.data;
      return transactions;
    })
    .catch(e => {
      throw e;
    });
};
