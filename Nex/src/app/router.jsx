import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, RoleRoute, TenantRoute } from '../components/guards/RouteGuards.jsx'
import { AdminLayout } from '../components/layout/AdminLayout.jsx'
import { VendorLayout } from '../components/layout/VendorLayout.jsx'
import { EmployeeLayout } from '../components/layout/EmployeeLayout.jsx'
import { AuthLayout } from '../components/layout/AuthLayout.jsx'

import { LoginPage } from '../features/auth/LoginPage.jsx'
import { RegisterPage } from '../features/auth/RegisterPage.jsx'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage.jsx'
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage.jsx'

import { NotFoundPage } from '../pages/NotFoundPage.jsx'
import { NoAccessPage } from '../pages/NoAccessPage.jsx'

// Platform
import { AdminDashboardPage } from '../features/admin/AdminDashboardPage.jsx'
import { VendorOnboardingListPage } from '../features/admin/VendorOnboardingListPage.jsx'
import { VendorOnboardingDetailPage } from '../features/admin/VendorOnboardingDetailPage.jsx'
import { PlatformUsersPage } from '../features/admin/PlatformUsersPage.jsx'
import { PlatformAuditPage } from '../features/admin/PlatformAuditPage.jsx'
import { PlatformReportsPage } from '../features/admin/PlatformReportsPage.jsx'

// Vendor modules
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx'
import { CustomerListPage } from '../features/crm/CustomerListPage.jsx'
import { CustomerDetailPage } from '../features/crm/CustomerDetailPage.jsx'
import { LeadListPage } from '../features/crm/LeadListPage.jsx'
import { LeadPipelinePage } from '../features/crm/LeadPipelinePage.jsx'
import { LeadDetailPage } from '../features/crm/LeadDetailPage.jsx'
import { QuoteListPage } from '../features/sales/QuoteListPage.jsx'
import { QuoteDetailPage } from '../features/sales/QuoteDetailPage.jsx'
import { OrderListPage } from '../features/sales/OrderListPage.jsx'
import { OrderDetailPage } from '../features/sales/OrderDetailPage.jsx'
import { InvoiceListPage } from '../features/sales/InvoiceListPage.jsx'
import { InvoiceDetailPage } from '../features/sales/InvoiceDetailPage.jsx'
import { SupplierListPage } from '../features/purchasing/SupplierListPage.jsx'
import { SupplierDetailPage } from '../features/purchasing/SupplierDetailPage.jsx'
import { PurchaseRequestListPage } from '../features/purchasing/PurchaseRequestListPage.jsx'
import { PurchaseOrderListPage } from '../features/purchasing/PurchaseOrderListPage.jsx'
import { PurchaseOrderDetailPage } from '../features/purchasing/PurchaseOrderDetailPage.jsx'
import { GoodsReceiptListPage } from '../features/purchasing/GoodsReceiptListPage.jsx'
import { ProductListPage } from '../features/inventory/ProductListPage.jsx'
import { ProductDetailPage } from '../features/inventory/ProductDetailPage.jsx'
import { StockLevelsPage } from '../features/inventory/StockLevelsPage.jsx'
import { TransferListPage } from '../features/inventory/TransferListPage.jsx'
import { AdjustmentListPage } from '../features/inventory/AdjustmentListPage.jsx'
import { WarehouseListPage } from '../features/inventory/WarehouseListPage.jsx'
import { FinanceOverviewPage } from '../features/finance/FinanceOverviewPage.jsx'
import { ReceivablesPage } from '../features/finance/ReceivablesPage.jsx'
import { PayablesPage } from '../features/finance/PayablesPage.jsx'
import { PaymentListPage } from '../features/finance/PaymentListPage.jsx'
import { ExpenseListPage } from '../features/finance/ExpenseListPage.jsx'
import { EmployeeListPage } from '../features/hr/EmployeeListPage.jsx'
import { EmployeeDetailPage } from '../features/hr/EmployeeDetailPage.jsx'
import { AttendancePage } from '../features/hr/AttendancePage.jsx'
import { LeavePage } from '../features/hr/LeavePage.jsx'
import { DepartmentPage } from '../features/hr/DepartmentPage.jsx'
import { ProjectListPage } from '../features/projects/ProjectListPage.jsx'
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage.jsx'
import { TaskListPage } from '../features/projects/TaskListPage.jsx'
import { TicketListPage } from '../features/support/TicketListPage.jsx'
import { TicketDetailPage } from '../features/support/TicketDetailPage.jsx'
import { ReportCenterPage } from '../features/reports/ReportCenterPage.jsx'
import { TeamUsersPage } from '../features/settings/TeamUsersPage.jsx'
import { AuditLogsPage } from '../features/settings/AuditLogsPage.jsx'
import { ProfilePage } from '../features/settings/ProfilePage.jsx'
import { PreferencesPage } from '../features/settings/PreferencesPage.jsx'
import { SupportPortalPage } from '../features/settings/SupportPortalPage.jsx'
import { NotificationsPage } from '../features/settings/NotificationsPage.jsx'

// Employee self-service
import { EmployeeDashboardPage } from '../features/employee/EmployeeDashboardPage.jsx'
import { MyTasksPage } from '../features/employee/MyTasksPage.jsx'
import { MyAttendancePage } from '../features/employee/MyAttendancePage.jsx'
import { MyLeavePage } from '../features/employee/MyLeavePage.jsx'
import { MyExpensesPage } from '../features/employee/MyExpensesPage.jsx'

// Storefront (marketplace, merged in from Nex-IV)
import ShopShell, { ShopPaymentRoute } from '../marketplace/ShopShell.jsx'
import Home from '../marketplace/pages/Home'
import Account from '../marketplace/pages/Account'
import Cart from '../marketplace/pages/Cart'
import Checkout from '../marketplace/pages/Checkout'
import Payment from '../marketplace/pages/Payment'
import Category from '../marketplace/pages/Category'
import FAQPage from '../marketplace/pages/FAQPage'
import ProductDetails from '../marketplace/pages/ProductDetails'
import VendorDetails from '../marketplace/pages/VendorDetails'
import Wishlist from '../marketplace/pages/Wishlist'
import AboutUs from '../marketplace/pages/AboutUs'
import Order from '../marketplace/pages/Order'

import { RootIndexGate } from './RootIndexGate.jsx'
import { ROLES } from '../constants/roles.js'

const platformRoles = [ROLES.SUPER_ADMIN, ROLES.PLATFORM_SUPPORT]

export const routes = [
  {
    path: '/',
    children: [
      /* ---------------------------------------------------------------
       * Landing gate: workspace sessions open their dashboard,
       * everyone else lands on the storefront home.
       * ------------------------------------------------------------- */
      { index: true, element: <RootIndexGate /> },

      /* ---------------------------------------------------------------
       * Storefront (marketplace) - public routes with the shop header
       * and footer around them.
       * ------------------------------------------------------------- */
      { element: <ShopShell />, children: [
        { path: 'home', element: <Home /> },
        { path: 'search', element: <Category /> },
        { path: 'categories', element: <Category /> },
        { path: 'categories/:categorySlug', element: <Category /> },
        { path: 'categories/:categorySlug/:subcategorySlug', element: <Category /> },
        { path: 'product/:id', element: <ProductDetails /> },
        { path: 'vendor', element: <Navigate to="/home" replace /> },
        { path: 'vendor/:vendorId', element: <VendorDetails /> },
        { path: 'account', element: <Account /> },
        { path: 'account/:section', element: <Account /> },
        { path: 'cart', element: <Cart /> },
        { path: 'checkout', element: <Checkout /> },
        { path: 'checkout/payment', element: <ShopPaymentRoute /> },
        { path: 'checkout/payment/add', element: <Payment /> },
        { path: 'order/:orderId', element: <Order /> },
        { path: 'wishlist', element: <Wishlist /> },
        { path: 'faq', element: <FAQPage /> },
        { path: 'about', element: <AboutUs /> },
      ]},

      /* ---------------------------------------------------------------
       * Vendor workspace (ERP)
       * ------------------------------------------------------------- */
      { element: <ProtectedRoute />, children: [
        { element: <TenantRoute />, children: [{ element: <VendorLayout />, children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'crm/leads', element: <LeadListPage /> },
          { path: 'crm/leads/pipeline', element: <LeadPipelinePage /> },
          { path: 'crm/leads/:leadId', element: <LeadDetailPage /> },
          { path: 'customers', element: <CustomerListPage /> },
          { path: 'customers/:customerId', element: <CustomerDetailPage /> },
          { path: 'sales/quotes', element: <QuoteListPage /> },
          { path: 'sales/quotes/:quoteId', element: <QuoteDetailPage /> },
          { path: 'sales/orders', element: <OrderListPage /> },
          { path: 'sales/orders/:orderId', element: <OrderDetailPage /> },
          { path: 'sales/invoices', element: <InvoiceListPage /> },
          { path: 'sales/invoices/:invoiceId', element: <InvoiceDetailPage /> },
          { path: 'purchasing/suppliers', element: <SupplierListPage /> },
          { path: 'purchasing/suppliers/:supplierId', element: <SupplierDetailPage /> },
          { path: 'purchasing/requests', element: <PurchaseRequestListPage /> },
          { path: 'purchasing/orders', element: <PurchaseOrderListPage /> },
          { path: 'purchasing/orders/:poId', element: <PurchaseOrderDetailPage /> },
          { path: 'purchasing/receipts', element: <GoodsReceiptListPage /> },
          { path: 'inventory/products', element: <ProductListPage /> },
          { path: 'inventory/products/:productId', element: <ProductDetailPage /> },
          { path: 'inventory/stock', element: <StockLevelsPage /> },
          { path: 'inventory/transfers', element: <TransferListPage /> },
          { path: 'inventory/adjustments', element: <AdjustmentListPage /> },
          { path: 'inventory/warehouses', element: <WarehouseListPage /> },
          { path: 'finance/overview', element: <FinanceOverviewPage /> },
          { path: 'finance/receivables', element: <ReceivablesPage /> },
          { path: 'finance/payables', element: <PayablesPage /> },
          { path: 'finance/payments', element: <PaymentListPage /> },
          { path: 'finance/payments/:paymentId', element: <PaymentListPage /> },
          { path: 'finance/expenses', element: <ExpenseListPage /> },
          { path: 'hr/employees', element: <EmployeeListPage /> },
          { path: 'hr/employees/:employeeId', element: <EmployeeDetailPage /> },
          { path: 'hr/attendance', element: <AttendancePage /> },
          { path: 'hr/leave', element: <LeavePage /> },
          { path: 'hr/departments', element: <DepartmentPage /> },
          { path: 'projects', element: <ProjectListPage /> },
          { path: 'projects/:projectId', element: <ProjectDetailPage /> },
          { path: 'tasks', element: <TaskListPage /> },
          { path: 'support/tickets', element: <TicketListPage /> },
          { path: 'support/tickets/:ticketId', element: <TicketDetailPage /> },
          { path: 'reports', element: <ReportCenterPage /> },
          { path: 'settings/users', element: <TeamUsersPage /> },
          { path: 'settings/audit', element: <AuditLogsPage /> },
          { path: 'settings/profile', element: <ProfilePage /> },
          { path: 'settings/preferences', element: <PreferencesPage /> },
          { path: 'settings/support', element: <SupportPortalPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
        ]}]},
      ]},

    /* ---------------------------------------------------------------
     * Platform admin
     * ------------------------------------------------------------- */
    { path: 'admin', element: <ProtectedRoute />, children: [
      { element: <RoleRoute roles={platformRoles} />, children: [
        { element: <AdminLayout />, children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'vendors', element: <VendorOnboardingListPage /> },
          { path: 'vendors/:vendorId', element: <VendorOnboardingDetailPage /> },
          { path: 'users', element: <PlatformUsersPage /> },
          { path: 'audit', element: <PlatformAuditPage /> },
          { path: 'reports', element: <PlatformReportsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'preferences', element: <PreferencesPage /> },
          { path: 'support', element: <SupportPortalPage /> },
        ]},
      ]},
    ]},

    /* ---------------------------------------------------------------
     * Employee self-service
     * ------------------------------------------------------------- */
    { path: 'me', element: <ProtectedRoute />, children: [
      { element: <TenantRoute />, children: [
        { element: <EmployeeLayout />, children: [
          { index: true, element: <EmployeeDashboardPage /> },
          { path: 'tasks', element: <MyTasksPage /> },
          { path: 'attendance', element: <MyAttendancePage /> },
          { path: 'leave', element: <MyLeavePage /> },
          { path: 'expenses', element: <MyExpensesPage /> },
        ]},
      ]},
    ]},

    /* ---------------------------------------------------------------
     * Auth - one shared system for both halves of the app
     * ------------------------------------------------------------- */
    {
      path: 'login',
      element: <AuthLayout />,
      children: [{ index: true, element: <LoginPage /> }],
    },
    {
      path: 'register',
      element: <AuthLayout />,
      children: [{ index: true, element: <RegisterPage /> }],
    },
    // Legacy storefront path (the marketplace used to mount its own page here).
    { path: 'auth', element: <Navigate to="/login" replace /> },
    {
      path: 'forgot-password',
      element: <AuthLayout />,
      children: [{ index: true, element: <ForgotPasswordPage /> }],
    },
    {
      path: 'reset-password',
      element: <AuthLayout />,
      children: [{ index: true, element: <ResetPasswordPage /> }],
    },

    { path: 'no-access', element: <NoAccessPage /> },
    { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
