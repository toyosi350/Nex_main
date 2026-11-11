
import { configureStore } from '@reduxjs/toolkit'

import authReducer from '../store/authSlice.js'
import uiReducer from '../store/uiSlice.js'

import { authApi } from '../features/auth/api.js'
import { vendorApi } from '../features/vendor/api.js'
import { adminApi } from '../features/admin/api.js'
import { shopApi } from '../marketplace/api/shopApi.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,

    [authApi.reducerPath]: authApi.reducer,
    [vendorApi.reducerPath]: vendorApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [shopApi.reducerPath]: shopApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['auth'],
      },
    }).concat(
      authApi.middleware,
      vendorApi.middleware,
      adminApi.middleware,
      shopApi.middleware,
    ),
})

export const apiReducers = [
  authApi,
  vendorApi,
  adminApi,
  shopApi,
]
