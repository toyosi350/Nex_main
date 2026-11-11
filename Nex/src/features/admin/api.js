import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from '../../services/baseQuery.js'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery,
  tagTypes: ['AdminVendors', 'AdminVendorDetail', 'AdminUsers', 'AuditLogs', 'AdminDashboard'],
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => ({ url: '/admin/dashboard' }),
      providesTags: ['AdminDashboard'],
    }),
    getVendors: builder.query({
      query: (params) => ({ url: '/admin/vendors', params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((v) => ({ type: 'AdminVendors', id: v.id })),
              { type: 'AdminVendors', id: 'LIST' },
            ]
          : [{ type: 'AdminVendors', id: 'LIST' }],
    }),
    getVendor: builder.query({
      query: (vendorId) => ({ url: `/admin/vendors/${vendorId}` }),
      providesTags: (_result, _error, vendorId) => [{ type: 'AdminVendorDetail', id: vendorId }],
    }),
    createVendor: builder.mutation({
      query: (body) => ({ url: '/admin/vendors', method: 'POST', body }),
      invalidatesTags: [{ type: 'AdminVendors', id: 'LIST' }, { type: 'AdminDashboard' }],
    }),
    updateVendor: builder.mutation({
      query: ({ vendorId, ...body }) => ({
        url: `/admin/vendors/${vendorId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminVendors', id: 'LIST' },
        { type: 'AdminVendorDetail', id: arg.vendorId },
        { type: 'AdminDashboard' },
      ],
    }),
    updateVendorStatus: builder.mutation({
      query: ({ vendorId, status }) => ({
        url: `/admin/vendors/${vendorId}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminVendors', id: 'LIST' },
        { type: 'AdminVendorDetail', id: arg.vendorId },
        { type: 'AdminDashboard' },
      ],
    }),
    deleteVendor: builder.mutation({
      query: (vendorId) => ({ url: `/admin/vendors/${vendorId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'AdminVendors', id: 'LIST' }, { type: 'AdminDashboard' }],
    }),
    getVendorUsers: builder.query({
      query: ({ vendorId, params }) => ({ url: `/admin/vendors/${vendorId}/users`, params }),
      providesTags: (_r, _e, arg) => [{ type: 'AdminUsers', id: arg.vendorId }],
    }),
    createVendorUser: builder.mutation({
      query: ({ vendorId, ...body }) => ({
        url: `/admin/vendors/${vendorId}/users`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'AdminUsers', id: arg.vendorId }],
    }),
    updateVendorUser: builder.mutation({
      query: ({ vendorId, userId, ...body }) => ({
        url: `/admin/vendors/${vendorId}/users/${userId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'AdminUsers', id: arg.vendorId }],
    }),
    getAdminUsers: builder.query({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['AdminUsers'],
    }),
    updateAdminUser: builder.mutation({
      query: ({ userId, ...body }) => ({ url: `/admin/users/${userId}`, method: 'PATCH', body }),
      invalidatesTags: ['AdminUsers'],
    }),
    getVendorReports: builder.query({
      query: ({ vendorId, params }) => ({ url: `/admin/vendors/${vendorId}/reports`, params }),
    }),
    getAuditLogs: builder.query({
      query: (params) => ({ url: '/audit-logs', params }),
      providesTags: ['AuditLogs'],
    }),
  }),
})

export const {
  useGetAdminDashboardQuery,
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useUpdateVendorStatusMutation,
  useDeleteVendorMutation,
  useGetVendorUsersQuery,
  useCreateVendorUserMutation,
  useUpdateVendorUserMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useGetVendorReportsQuery,
  useGetAuditLogsQuery,
} = adminApi