import { PERMISSIONS as P } from '../../constants/roles.js'
import {
  MdSpaceDashboard,
  MdStorefront,
  MdGroups,
  MdPeople,
  MdPointOfSale,
  MdReceiptLong,
  MdShoppingCart,
  MdRequestQuote,
  MdLocalShipping,
  MdInventory2,
  MdSwapHoriz,
  MdAdjust,
  MdWarehouse,
  MdAccountBalance,
  MdAssessment,
  MdTrendingUp,
  MdReceipt,
  MdPayments,
  MdShoppingBasket,
  MdHomeWork,
  MdPieChart,
  MdAttachMoney,
  MdBadge,
  MdEventAvailable,
  MdBeachAccess,
  MdFolderShared,
  MdTask,
  MdSupportAgent,
  MdManageAccounts,
  MdSummarize,
  MdAdminPanelSettings,
  MdPersonOutline,
  MdOutlineTune,
  MdHelpOutline,
  MdShoppingBag,
} from 'react-icons/md'

export const PLATFORM_NAV = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: MdSpaceDashboard, end: true, permission: P.DASHBOARD_VIEW },
      { label: 'Storefront', path: '/home', icon: MdShoppingBag },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Vendors', path: '/admin/vendors', icon: MdStorefront, permission: P.VENDOR_VIEW },
      { label: 'Users', path: '/admin/users', icon: MdGroups, permission: P.USER_MANAGE },
      { label: 'Audit Logs', path: '/admin/audit', icon: MdSummarize, permission: P.AUDIT_VIEW },
      { label: 'Reports', path: '/admin/reports', icon: MdAssessment, permission: P.REPORT_VIEW },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', path: '/admin/profile', icon: MdPersonOutline },
      { label: 'Preferences', path: '/admin/preferences', icon: MdOutlineTune },
      { label: 'Help & support', path: '/admin/support', icon: MdHelpOutline },
    ],
  },
]

export const VENDOR_NAV = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: MdSpaceDashboard, end: true, permission: P.DASHBOARD_VIEW },
      { label: 'Storefront', path: '/home', icon: MdShoppingBag },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Leads', path: '/crm/leads', icon: MdPeople, permission: P.LEAD_VIEW },
      { label: 'Customers', path: '/customers', icon: MdGroups, permission: P.CUSTOMER_VIEW },
      { label: 'Quotes', path: '/sales/quotes', icon: MdRequestQuote, permission: P.QUOTE_VIEW },
      { label: 'Orders', path: '/sales/orders', icon: MdShoppingCart, permission: P.ORDER_VIEW },
      { label: 'Invoices', path: '/sales/invoices', icon: MdReceiptLong, permission: P.INVOICE_VIEW },
      { label: 'Payments', path: '/finance/payments', icon: MdPayments, permission: P.PAYMENT_VIEW },
    ],
  },
  {
    label: 'Purchasing',
    items: [
      { label: 'Suppliers', path: '/purchasing/suppliers', icon: MdLocalShipping, permission: P.SUPPLIER_VIEW },
      { label: 'Purchase Requests', path: '/purchasing/requests', icon: MdShoppingBasket, permission: P.PURCHASE_VIEW },
      { label: 'Purchase Orders', path: '/purchasing/orders', icon: MdReceipt, permission: P.PURCHASE_VIEW },
      { label: 'Goods Receipts', path: '/purchasing/receipts', icon: MdLocalShipping, permission: P.PURCHASE_RECEIVE },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products', path: '/inventory/products', icon: MdInventory2, permission: P.PRODUCT_VIEW },
      { label: 'Stock Levels', path: '/inventory/stock', icon: MdPieChart, permission: P.INVENTORY_VIEW },
      { label: 'Transfers', path: '/inventory/transfers', icon: MdSwapHoriz, permission: P.TRANSFER_CREATE },
      { label: 'Adjustments', path: '/inventory/adjustments', icon: MdAdjust, permission: P.INVENTORY_ADJUST },
      { label: 'Warehouses', path: '/inventory/warehouses', icon: MdWarehouse, permission: P.WAREHOUSE_MANAGE },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Overview', path: '/finance/overview', icon: MdAccountBalance, permission: P.ACCOUNTING_VIEW },
      { label: 'Receivables', path: '/finance/receivables', icon: MdTrendingUp, permission: P.INVOICE_VIEW },
      { label: 'Payables', path: '/finance/payables', icon: MdPointOfSale, permission: P.PURCHASE_VIEW },
      { label: 'Expenses', path: '/finance/expenses', icon: MdAttachMoney, permission: P.EXPENSE_VIEW },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Employees', path: '/hr/employees', icon: MdBadge, permission: P.EMPLOYEE_VIEW },
      { label: 'Attendance', path: '/hr/attendance', icon: MdEventAvailable, permission: P.ATTENDANCE_VIEW },
      { label: 'Leave', path: '/hr/leave', icon: MdBeachAccess, permission: P.LEAVE_MANAGE },
      { label: 'Departments', path: '/hr/departments', icon: MdHomeWork, permission: P.DEPARTMENT_MANAGE },
    ],
  },
  {
    label: 'Projects',
    items: [
      { label: 'Projects', path: '/projects', icon: MdFolderShared, permission: P.PROJECT_VIEW },
      { label: 'Tasks', path: '/tasks', icon: MdTask, permission: P.TASK_MANAGE },
    ],
  },
  {
    label: 'Support',
    items: [{ label: 'Tickets', path: '/support/tickets', icon: MdSupportAgent, permission: P.TICKET_VIEW }],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Reports', path: '/reports', icon: MdAssessment, permission: P.REPORT_VIEW }],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Users & Roles', path: '/settings/users', icon: MdManageAccounts, permission: P.USER_MANAGE },
      { label: 'Audit Logs', path: '/settings/audit', icon: MdAdminPanelSettings, permission: P.AUDIT_VIEW },
    ],
  },
]

export const EMPLOYEE_NAV = [
  {
    label: 'Overview',
    items: [{ label: 'My Dashboard', path: '/me', icon: MdSpaceDashboard, end: true }],
  },
  {
    label: 'My Workplace',
    items: [
      { label: 'Tasks', path: '/me/tasks', icon: MdTask },
      { label: 'Attendance', path: '/me/attendance', icon: MdEventAvailable },
      { label: 'Leave', path: '/me/leave', icon: MdBeachAccess },
      { label: 'Expenses', path: '/me/expenses', icon: MdAttachMoney },
    ],
  },
]