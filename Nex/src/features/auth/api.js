import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from '../../services/baseQuery.js'
import { setCredentials, logout, setCurrentUser, setCurrentVendor } from '../../store/authSlice.js'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['Me'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            setCredentials({
              user: data.user,
              vendor: data.vendor,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              remember: _args.remember,
            })
          )
          dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
        } catch {
          /* handled by caller */
        }
      },
    }),
    register: builder.mutation({
      query: (payload) => ({ url: '/auth/register', method: 'POST', body: payload }),
    }),
    getMe: builder.query({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Me'],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.user) dispatch(setCurrentUser(data.user))
          if (data.vendor) dispatch(setCurrentVendor(data.vendor))
        } catch {
          /* ignore; guarded routes will redirect */
        }
      },
    }),
    refresh: builder.mutation({
      query: (payload) => ({ url: '/auth/refresh', method: 'POST', body: payload }),
    }),
    forgotPassword: builder.mutation({
      query: (payload) => ({ url: '/auth/forgot-password', method: 'POST', body: payload }),
    }),
    resetPassword: builder.mutation({
      query: (payload) => ({ url: '/auth/reset-password', method: 'POST', body: payload }),
    }),
    changePassword: builder.mutation({
      // the contract route is PATCH /auth/change-password
      query: (payload) => ({ url: '/auth/change-password', method: 'PATCH', body: payload }),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          dispatch(logout())
        }
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useRefreshMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi

export default authApi