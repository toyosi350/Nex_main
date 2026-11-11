import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from '../../services/baseQuery.js'

const v = (vendorId, path) => `/vendor/${vendorId}${path}`

export const vendorApi = createApi({
  reducerPath: 'vendorApi',
  baseQuery,
  tagTypes: [
    'Dashboard',
    'Customers',
    'CustomerDetail',
    'Suppliers',
    'SupplierDetail',
    'Products',
    'ProductDetail',
    'Categories',
    'Warehouses',
    'WarehouseDetail',
    'Inventory',
    'InventorySummary',
    'Adjustments',
    'Transfers',
    'Quotes',
    'QuoteDetail',
    'Orders',
    'OrderDetail',
    'Invoices',
    'InvoiceDetail',
    'Payments',
    'Receivables',
    'Payables',
    'PurchaseRequests',
    'PurchaseOrders',
    'PurchaseOrderDetail',
    'GoodsReceipts',
    'Expenses',
    'Financial',
    'Departments',
    'Employees',
    'EmployeeDetail',
    'Attendance',
    'Leave',
    'Projects',
    'ProjectDetail',
    'Tasks',
    'Leads',
    'Tickets',
    'TicketDetail',
    'Notifications',
    'Reports',
    'AuditLogs',
  ],
  endpoints: (builder) => ({
    /* ---------- Dashboard ---------- */
    getVendorDashboard: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/dashboard') }),
      providesTags: ['Dashboard'],
    }),

    /* ---------- Customers ---------- */
    getCustomers: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/customers'), params }),
      providesTags: ['Customers'],
    }),
    getCustomer: builder.query({
      query: ({ vendorId, customerId }) => ({ url: v(vendorId, `/customers/${customerId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'CustomerDetail', id: arg.customerId }],
    }),
    createCustomer: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/customers'), method: 'POST', body }),
      invalidatesTags: ['Customers', 'Dashboard'],
    }),
    updateCustomer: builder.mutation({
      query: ({ vendorId, customerId, ...body }) => ({
        url: v(vendorId, `/customers/${customerId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Customers',
        { type: 'CustomerDetail', id: arg.customerId },
        'Dashboard',
      ],
    }),
    deleteCustomer: builder.mutation({
      query: ({ vendorId, customerId }) => ({ url: v(vendorId, `/customers/${customerId}`), method: 'DELETE' }),
      invalidatesTags: ['Customers', 'Dashboard'],
    }),

    /* ---------- Suppliers ---------- */
    getSuppliers: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/suppliers'), params }),
      providesTags: ['Suppliers'],
    }),
    getSupplier: builder.query({
      query: ({ vendorId, supplierId }) => ({ url: v(vendorId, `/suppliers/${supplierId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'SupplierDetail', id: arg.supplierId }],
    }),
    createSupplier: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/suppliers'), method: 'POST', body }),
      invalidatesTags: ['Suppliers', 'Dashboard'],
    }),
    updateSupplier: builder.mutation({
      query: ({ vendorId, supplierId, ...body }) => ({
        url: v(vendorId, `/suppliers/${supplierId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Suppliers',
        { type: 'SupplierDetail', id: arg.supplierId },
        'Dashboard',
      ],
    }),

    /* ---------- Categories / Products ---------- */
    getCategories: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/categories') }),
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/categories'), method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    getProducts: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/products'), params }),
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: ({ vendorId, productId }) => ({ url: v(vendorId, `/products/${productId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'ProductDetail', id: arg.productId }],
    }),
    createProduct: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/products'), method: 'POST', body }),
      invalidatesTags: ['Products', 'Inventory', 'Categories', 'Dashboard'],
    }),
    updateProduct: builder.mutation({
      query: ({ vendorId, productId, ...body }) => ({
        url: v(vendorId, `/products/${productId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Products',
        { type: 'ProductDetail', id: arg.productId },
        'Inventory',
        'Dashboard',
      ],
    }),

    /* ---------- Warehouses / Inventory ---------- */
    getWarehouses: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/warehouses') }),
      providesTags: ['Warehouses'],
    }),
    getWarehouse: builder.query({
      query: ({ vendorId, warehouseId }) => ({ url: v(vendorId, `/warehouses/${warehouseId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'WarehouseDetail', id: arg.warehouseId }],
    }),
    getInventory: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/inventory'), params }),
      providesTags: ['Inventory'],
    }),
    getInventorySummary: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/inventory/summary') }),
      providesTags: ['InventorySummary'],
    }),
    getStockAdjustments: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/stock-adjustments'), params }),
      providesTags: ['Adjustments'],
    }),
    createStockAdjustment: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/stock-adjustments'), method: 'POST', body }),
      invalidatesTags: ['Adjustments', 'Inventory', 'InventorySummary', 'Dashboard'],
    }),
    getStockTransfers: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/stock-transfers'), params }),
      providesTags: ['Transfers'],
    }),
    createStockTransfer: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/stock-transfers'), method: 'POST', body }),
      invalidatesTags: ['Transfers', 'Inventory', 'InventorySummary', 'Dashboard'],
    }),
    transferTransition: builder.mutation({
      query: ({ vendorId, transferId, to }) => ({
        url: v(vendorId, `/stock-transfers/${transferId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: ['Transfers', 'Inventory', 'InventorySummary', 'Dashboard'],
    }),

    /* ---------- Quotes ---------- */
    getQuotes: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/quotes'), params }),
      providesTags: ['Quotes'],
    }),
    getQuote: builder.query({
      query: ({ vendorId, quoteId }) => ({ url: v(vendorId, `/quotes/${quoteId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'QuoteDetail', id: arg.quoteId }],
    }),
    createQuote: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/quotes'), method: 'POST', body }),
      invalidatesTags: ['Quotes', 'Dashboard'],
    }),
    updateQuote: builder.mutation({
      query: ({ vendorId, quoteId, ...body }) => ({
        url: v(vendorId, `/quotes/${quoteId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => ['Quotes', { type: 'QuoteDetail', id: arg.quoteId }],
    }),
    quoteTransition: builder.mutation({
      query: ({ vendorId, quoteId, to }) => ({
        url: v(vendorId, `/quotes/${quoteId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Quotes',
        { type: 'QuoteDetail', id: arg.quoteId },
        'Dashboard',
      ],
    }),
    convertQuote: builder.mutation({
      query: ({ vendorId, quoteId }) => ({ url: v(vendorId, `/quotes/${quoteId}/convert`), method: 'POST' }),
      invalidatesTags: ['Quotes', 'Orders', 'Dashboard'],
    }),

    /* ---------- Orders ---------- */
    getOrders: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/orders'), params }),
      providesTags: ['Orders'],
    }),
    getOrder: builder.query({
      query: ({ vendorId, orderId }) => ({ url: v(vendorId, `/orders/${orderId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'OrderDetail', id: arg.orderId }],
    }),
    createOrder: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/orders'), method: 'POST', body }),
      invalidatesTags: ['Orders', 'Inventory', 'InventorySummary', 'Dashboard'],
    }),
    orderTransition: builder.mutation({
      query: ({ vendorId, orderId, to }) => ({
        url: v(vendorId, `/orders/${orderId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Orders',
        { type: 'OrderDetail', id: arg.orderId },
        'Inventory',
        'InventorySummary',
        'Dashboard',
      ],
    }),

    /* ---------- Invoices & Payments ---------- */
    getInvoices: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/invoices'), params }),
      providesTags: ['Invoices'],
    }),
    getInvoice: builder.query({
      query: ({ vendorId, invoiceId }) => ({ url: v(vendorId, `/invoices/${invoiceId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'InvoiceDetail', id: arg.invoiceId }],
    }),
    createInvoice: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/invoices'), method: 'POST', body }),
      invalidatesTags: ['Invoices', 'Receivables', 'Dashboard'],
    }),
    updateInvoice: builder.mutation({
      query: ({ vendorId, invoiceId, ...body }) => ({
        url: v(vendorId, `/invoices/${invoiceId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Invoices',
        { type: 'InvoiceDetail', id: arg.invoiceId },
        'Receivables',
        'Dashboard',
      ],
    }),
    invoiceTransition: builder.mutation({
      query: ({ vendorId, invoiceId, to }) => ({
        url: v(vendorId, `/invoices/${invoiceId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Invoices',
        { type: 'InvoiceDetail', id: arg.invoiceId },
        'Receivables',
        'Financial',
        'Dashboard',
      ],
    }),
    recordInvoicePayment: builder.mutation({
      query: ({ vendorId, invoiceId, ...body }) => ({
        url: v(vendorId, `/invoices/${invoiceId}/payments`),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Invoices',
        { type: 'InvoiceDetail', id: arg.invoiceId },
        'Payments',
        'Receivables',
        'Financial',
        'Dashboard',
      ],
    }),
    getPayments: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/payments'), params }),
      providesTags: ['Payments'],
    }),
    getReceivables: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/accounting/receivables'), params }),
      providesTags: ['Receivables'],
    }),
    getPayables: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/accounting/payables') }),
      providesTags: ['Payables'],
    }),

    /* ---------- Purchasing ---------- */
    getPurchaseRequests: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/purchase-requests'), params }),
      providesTags: ['PurchaseRequests'],
    }),
    createPurchaseRequest: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/purchase-requests'), method: 'POST', body }),
      invalidatesTags: ['PurchaseRequests', 'Dashboard'],
    }),
    purchaseRequestTransition: builder.mutation({
      query: ({ vendorId, id, to }) => ({
        url: v(vendorId, `/purchase-requests/${id}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: ['PurchaseRequests', 'Dashboard'],
    }),
    getPurchaseOrders: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/purchase-orders'), params }),
      providesTags: ['PurchaseOrders'],
    }),
    getPurchaseOrder: builder.query({
      query: ({ vendorId, poId }) => ({ url: v(vendorId, `/purchase-orders/${poId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'PurchaseOrderDetail', id: arg.poId }],
    }),
    createPurchaseOrder: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/purchase-orders'), method: 'POST', body }),
      invalidatesTags: ['PurchaseOrders', 'Dashboard'],
    }),
    purchaseOrderTransition: builder.mutation({
      query: ({ vendorId, poId, to }) => ({
        url: v(vendorId, `/purchase-orders/${poId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: (_r, _e, arg) => [
        'PurchaseOrders',
        { type: 'PurchaseOrderDetail', id: arg.poId },
        'PurchaseRequests',
        'Dashboard',
      ],
    }),
    receivePurchaseOrder: builder.mutation({
      query: ({ vendorId, poId, lines }) => ({
        url: v(vendorId, `/purchase-orders/${poId}/receive`),
        method: 'POST',
        body: { lines },
      }),
      invalidatesTags: (_r, _e, arg) => [
        'PurchaseOrders',
        { type: 'PurchaseOrderDetail', id: arg.poId },
        'GoodsReceipts',
        'Inventory',
        'InventorySummary',
        'Payables',
        'Dashboard',
      ],
    }),
    getGoodsReceipts: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/goods-receipts'), params }),
      providesTags: ['GoodsReceipts'],
    }),

    /* ---------- Expenses / Finance ---------- */
    getExpenses: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/expenses'), params }),
      providesTags: ['Expenses'],
    }),
    createExpense: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/expenses'), method: 'POST', body }),
      invalidatesTags: ['Expenses', 'Dashboard'],
    }),
    expenseTransition: builder.mutation({
      query: ({ vendorId, expenseId, to }) => ({
        url: v(vendorId, `/expenses/${expenseId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: () => ['Expenses', 'Financial', 'Dashboard'],
    }),
    getFinancial: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/accounting/financial'), params }),
      providesTags: ['Financial'],
    }),
    getCashflow: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/accounting/cashflow') }),
      providesTags: ['Financial'],
    }),

    /* ---------- HR ---------- */
    getDepartments: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/departments') }),
      providesTags: ['Departments'],
    }),
    createDepartment: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/departments'), method: 'POST', body }),
      invalidatesTags: ['Departments', 'Dashboard'],
    }),
    getEmployees: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/employees'), params }),
      providesTags: ['Employees'],
    }),
    getEmployee: builder.query({
      query: ({ vendorId, employeeId }) => ({ url: v(vendorId, `/employees/${employeeId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'EmployeeDetail', id: arg.employeeId }],
    }),
    createEmployee: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/employees'), method: 'POST', body }),
      invalidatesTags: ['Employees', 'Departments', 'Dashboard'],
    }),
    updateEmployee: builder.mutation({
      query: ({ vendorId, employeeId, ...body }) => ({
        url: v(vendorId, `/employees/${employeeId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Employees',
        { type: 'EmployeeDetail', id: arg.employeeId },
        'Departments',
        'Dashboard',
      ],
    }),
    getAttendance: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/attendance'), params }),
      providesTags: ['Attendance'],
    }),
    createAttendance: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/attendance'), method: 'POST', body }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    getLeave: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/leave'), params }),
      providesTags: ['Leave'],
    }),
    createLeave: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/leave'), method: 'POST', body }),
      invalidatesTags: ['Leave', 'Dashboard'],
    }),
    leaveTransition: builder.mutation({
      query: ({ vendorId, leaveId, to }) => ({
        url: v(vendorId, `/leave/${leaveId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: ['Leave', 'Attendance', 'Dashboard'],
    }),

    /* ---------- Projects ---------- */
    getProjects: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/projects'), params }),
      providesTags: ['Projects'],
    }),
    getProject: builder.query({
      query: ({ vendorId, projectId }) => ({ url: v(vendorId, `/projects/${projectId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'ProjectDetail', id: arg.projectId }],
    }),
    createProject: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/projects'), method: 'POST', body }),
      invalidatesTags: ['Projects', 'Dashboard'],
    }),
    updateProject: builder.mutation({
      query: ({ vendorId, projectId, ...body }) => ({
        url: v(vendorId, `/projects/${projectId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Projects',
        { type: 'ProjectDetail', id: arg.projectId },
        'Dashboard',
      ],
    }),
    getTasks: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/tasks'), params }),
      providesTags: ['Tasks'],
    }),
    createTask: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/tasks'), method: 'POST', body }),
      invalidatesTags: ['Tasks', 'Projects', 'ProjectDetail', 'Dashboard'],
    }),
    updateTask: builder.mutation({
      query: ({ vendorId, taskId, ...body }) => ({
        url: v(vendorId, `/tasks/${taskId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: () => ['Tasks', 'Projects', 'ProjectDetail', 'Dashboard'],
    }),

    /* ---------- CRM Leads ---------- */
    getLeads: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/leads'), params }),
      providesTags: ['Leads'],
    }),
    getLeadsPipeline: builder.query({
      query: (vendorId) => ({ url: v(vendorId, '/leads/pipeline') }),
      providesTags: ['Leads', 'Dashboard'],
    }),
    createLead: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/leads'), method: 'POST', body }),
      invalidatesTags: ['Leads', 'Dashboard'],
    }),
    updateLead: builder.mutation({
      query: ({ vendorId, leadId, ...body }) => ({
        url: v(vendorId, `/leads/${leadId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Leads', 'Dashboard'],
    }),

    /* ---------- Tickets ---------- */
    getTickets: builder.query({
      query: ({ vendorId, params }) => ({ url: v(vendorId, '/tickets'), params }),
      providesTags: ['Tickets'],
    }),
    getTicket: builder.query({
      query: ({ vendorId, ticketId }) => ({ url: v(vendorId, `/tickets/${ticketId}`) }),
      providesTags: (_r, _e, arg) => [{ type: 'TicketDetail', id: arg.ticketId }],
    }),
    createTicket: builder.mutation({
      query: ({ vendorId, ...body }) => ({ url: v(vendorId, '/tickets'), method: 'POST', body }),
      invalidatesTags: ['Tickets', 'Dashboard'],
    }),
    updateTicket: builder.mutation({
      query: ({ vendorId, ticketId, ...body }) => ({
        url: v(vendorId, `/tickets/${ticketId}`),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Tickets',
        { type: 'TicketDetail', id: arg.ticketId },
        'Dashboard',
      ],
    }),
    ticketTransition: builder.mutation({
      query: ({ vendorId, ticketId, to }) => ({
        url: v(vendorId, `/tickets/${ticketId}/transition`),
        method: 'POST',
        body: { to },
      }),
      invalidatesTags: (_r, _e, arg) => [
        'Tickets',
        { type: 'TicketDetail', id: arg.ticketId },
        'Dashboard',
      ],
    }),
    addTicketComment: builder.mutation({
      query: ({ vendorId, ticketId, text }) => ({
        url: v(vendorId, `/tickets/${ticketId}/comments`),
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'TicketDetail', id: arg.ticketId }, 'Tickets'],
    }),

    /* ---------- Notifications / Reports / Audit / Search ---------- */
    getNotifications: builder.query({
      query: () => ({ url: '/notifications' }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    getReport: builder.query({
      query: ({ vendorId, reportType, params }) => ({
        url: v(vendorId, `/reports/${reportType}`),
        params,
      }),
      providesTags: (_r, _e, arg) => [{ type: 'Reports', id: arg.reportType }],
    }),
    globalSearch: builder.query({
      query: (params) => ({ url: '/search', params }),
    }),
  }),
})

export const {
  useGetVendorDashboardQuery,
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useGetInventoryQuery,
  useGetInventorySummaryQuery,
  useGetStockAdjustmentsQuery,
  useCreateStockAdjustmentMutation,
  useGetStockTransfersQuery,
  useCreateStockTransferMutation,
  useTransferTransitionMutation,
  useGetQuotesQuery,
  useGetQuoteQuery,
  useCreateQuoteMutation,
  useUpdateQuoteMutation,
  useQuoteTransitionMutation,
  useConvertQuoteMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useOrderTransitionMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useInvoiceTransitionMutation,
  useRecordInvoicePaymentMutation,
  useGetPaymentsQuery,
  useGetReceivablesQuery,
  useGetPayablesQuery,
  useGetPurchaseRequestsQuery,
  useCreatePurchaseRequestMutation,
  usePurchaseRequestTransitionMutation,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  usePurchaseOrderTransitionMutation,
  useReceivePurchaseOrderMutation,
  useGetGoodsReceiptsQuery,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useExpenseTransitionMutation,
  useGetFinancialQuery,
  useGetCashflowQuery,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetAttendanceQuery,
  useCreateAttendanceMutation,
  useGetLeaveQuery,
  useCreateLeaveMutation,
  useLeaveTransitionMutation,
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useGetLeadsQuery,
  useGetLeadsPipelineQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useTicketTransitionMutation,
  useAddTicketCommentMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetReportQuery,
  useGlobalSearchQuery,
} = vendorApi