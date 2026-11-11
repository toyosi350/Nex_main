INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'VENDOR_ADMIN';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'CUSTOMER_CREATE',
        'CUSTOMER_EDIT',
        'CUSTOMER_VIEW',
        'DASHBOARD_VIEW',
        'INVENTORY_VIEW',
        'INVOICE_CREATE',
        'INVOICE_VIEW',
        'LEAD_CREATE',
        'LEAD_EDIT',
        'LEAD_VIEW',
        'ORDER_ACTION',
        'ORDER_CREATE',
        'ORDER_EDIT',
        'ORDER_VIEW',
        'PAYMENT_CREATE',
        'PAYMENT_VIEW',
        'PRODUCT_VIEW',
        'QUOTE_ACTION',
        'QUOTE_CREATE',
        'QUOTE_EDIT',
        'QUOTE_VIEW',
        'REPORT_EXPORT',
        'REPORT_VIEW',
        'TICKET_CREATE',
        'TICKET_VIEW'
    )
WHERE r.name = 'SALES_MANAGER';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'ACCOUNTING_VIEW',
        'CUSTOMER_VIEW',
        'DASHBOARD_VIEW',
        'EXPENSE_PROCESS',
        'EXPENSE_VIEW',
        'INVENTORY_VIEW',
        'INVOICE_CREATE',
        'INVOICE_EDIT',
        'INVOICE_VIEW',
        'ORDER_VIEW',
        'PAYMENT_CREATE',
        'PAYMENT_VIEW',
        'PRODUCT_VIEW',
        'PURCHASE_VIEW',
        'QUOTE_VIEW',
        'REPORT_EXPORT',
        'REPORT_VIEW',
        'SUPPLIER_VIEW'
    )
WHERE r.name = 'ACCOUNTANT';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',
        'INVENTORY_ADJUST',
        'INVENTORY_VIEW',
        'PRODUCT_CREATE',
        'PRODUCT_EDIT',
        'PRODUCT_VIEW',
        'PURCHASE_RECEIVE',
        'PURCHASE_VIEW',
        'REPORT_VIEW',
        'TRANSFER_APPROVE',
        'TRANSFER_CREATE',
        'TRANSFER_RECEIVE',
        'WAREHOUSE_MANAGE'
    )
WHERE r.name = 'INVENTORY_MANAGER';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'AUDIT_VIEW',
        'DASHBOARD_VIEW',
        'REPORT_VIEW',
        'USER_MANAGE'
    )
WHERE r.name = 'PLATFORM_SUPPORT';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'CUSTOMER_CREATE',
        'CUSTOMER_EDIT',
        'CUSTOMER_VIEW',
        'DASHBOARD_VIEW',
        'INVOICE_VIEW',
        'LEAD_CREATE',
        'LEAD_EDIT',
        'LEAD_VIEW',
        'ORDER_CREATE',
        'ORDER_VIEW',
        'PRODUCT_VIEW',
        'QUOTE_ACTION',
        'QUOTE_CREATE',
        'QUOTE_EDIT',
        'QUOTE_VIEW',
        'TICKET_CREATE',
        'TICKET_VIEW'
    )
WHERE r.name = 'SALES_AGENT';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',
        'EMPLOYEE_VIEW',
        'INVENTORY_ADJUST',
        'INVENTORY_VIEW',
        'PRODUCT_VIEW',
        'PURCHASE_RECEIVE',
        'PURCHASE_VIEW',
        'REPORT_VIEW',
        'TRANSFER_CREATE',
        'TRANSFER_RECEIVE',
        'WAREHOUSE_MANAGE'
    )
WHERE r.name = 'WAREHOUSE_MANAGER';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'ATTENDANCE_EDIT',
        'ATTENDANCE_VIEW',
        'DASHBOARD_VIEW',
        'DEPARTMENT_MANAGE',
        'EMPLOYEE_CREATE',
        'EMPLOYEE_DELETE',
        'EMPLOYEE_EDIT',
        'EMPLOYEE_VIEW',
        'LEAVE_APPROVE',
        'LEAVE_MANAGE',
        'PROJECT_VIEW',
        'REPORT_VIEW'
    )
WHERE r.name = 'HR_MANAGER';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',
        'EXPENSE_CREATE',
        'INVENTORY_VIEW',
        'PRODUCT_VIEW',
        'PURCHASE_APPROVE',
        'PURCHASE_CREATE',
        'PURCHASE_RECEIVE',
        'PURCHASE_VIEW',
        'REPORT_VIEW',
        'SUPPLIER_CREATE',
        'SUPPLIER_EDIT',
        'SUPPLIER_VIEW'
    )
WHERE r.name = 'PURCHASING_MANAGER';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'CUSTOMER_VIEW',
        'DASHBOARD_VIEW',
        'PROJECT_VIEW',
        'TICKET_ACTION',
        'TICKET_CREATE',
        'TICKET_EDIT',
        'TICKET_VIEW'
    )
WHERE r.name = 'SUPPORT_AGENT';


INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
JOIN permissions p
    ON p.code IN (
        'DASHBOARD_VIEW',
        'EXPENSE_CREATE',
        'LEAVE_CREATE',
        'PROJECT_VIEW',
        'TASK_MANAGE',
        'TICKET_CREATE'
    )
WHERE r.name = 'EMPLOYEE';
