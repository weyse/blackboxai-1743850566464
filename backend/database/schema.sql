-- Drop database if exists and create new one
DROP DATABASE IF EXISTS ebms_db;
CREATE DATABASE ebms_db;
USE ebms_db;

-- Users table for authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'manager', 'staff') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ACCOUNTING MODULE --

-- Chart of Accounts
CREATE TABLE chart_of_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    description TEXT,
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
);

-- Journal Entries
CREATE TABLE journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entry_date DATE NOT NULL,
    reference_no VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    status ENUM('draft', 'posted', 'void') DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Journal Details
CREATE TABLE journal_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    journal_id INT NOT NULL,
    account_id INT NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    FOREIGN KEY (journal_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

-- Budget
CREATE TABLE budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    fiscal_year INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

-- Fixed Assets
CREATE TABLE fixed_assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    asset_name VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(15,2) NOT NULL,
    useful_life_years INT NOT NULL,
    salvage_value DECIMAL(15,2),
    depreciation_method ENUM('straight_line', 'declining_balance') NOT NULL,
    account_id INT NOT NULL,
    status ENUM('active', 'disposed', 'fully_depreciated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
);

-- Asset Depreciation
CREATE TABLE asset_depreciation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    depreciation_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    accumulated_depreciation DECIMAL(15,2) NOT NULL,
    book_value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES fixed_assets(id)
);

-- FINANCIAL MODULE --

-- Bank Accounts
CREATE TABLE bank_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    opening_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bank Transactions
CREATE TABLE bank_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bank_account_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    type ENUM('deposit', 'withdrawal', 'transfer') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_no VARCHAR(50),
    description TEXT,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- FRONT DESK MODULE --

-- Saung (Gazebo/Hut)
CREATE TABLE saung (
    id INT PRIMARY KEY AUTO_INCREMENT,
    saung_code VARCHAR(20) UNIQUE NOT NULL,
    saung_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    id_type ENUM('KTP', 'SIM', 'Passport') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reservations
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_code VARCHAR(20) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    saung_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (saung_id) REFERENCES saung(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Additional Charges
CREATE TABLE additional_charges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id INT NOT NULL,
    charge_description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PURCHASING MODULE --

-- Suppliers
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    po_number VARCHAR(20) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    status ENUM('draft', 'submitted', 'approved', 'received', 'cancelled') DEFAULT 'draft',
    total_amount DECIMAL(15,2) NOT NULL,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Purchase Returns
CREATE TABLE purchase_returns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    return_number VARCHAR(20) UNIQUE NOT NULL,
    po_id INT NOT NULL,
    return_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'completed', 'rejected') DEFAULT 'pending',
    total_amount DECIMAL(15,2) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- LOGISTICS MODULE --

-- Categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Units
CREATE TABLE units (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unit_code VARCHAR(10) NOT NULL,
    unit_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_code VARCHAR(20) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    item_name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    unit_id INT NOT NULL,
    minimum_stock INT DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
);

-- Warehouses
CREATE TABLE warehouses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_code VARCHAR(20) UNIQUE NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    location TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stock
CREATE TABLE stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Stock Movements
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    movement_type ENUM('in', 'out', 'transfer') NOT NULL,
    quantity INT NOT NULL,
    reference_no VARCHAR(50),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PERSONNEL MODULE --

-- Departments
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dept_code VARCHAR(20) UNIQUE NOT NULL,
    dept_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Positions
CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    position_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Employees
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    position_id INT NOT NULL,
    hire_date DATE NOT NULL,
    birth_date DATE,
    gender ENUM('M', 'F') NOT NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed'),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    bank_account VARCHAR(50),
    bank_name VARCHAR(100),
    tax_number VARCHAR(50),
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- Attendance
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status ENUM('present', 'absent', 'late', 'leave') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Salary Components
CREATE TABLE salary_components (
    id INT PRIMARY KEY AUTO_INCREMENT,
    component_name VARCHAR(100) NOT NULL,
    component_type ENUM('earning', 'deduction') NOT NULL,
    is_taxable BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee Salary
CREATE TABLE employee_salary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    component_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (component_id) REFERENCES salary_components(id)
);

-- Payroll
CREATE TABLE payroll (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    status ENUM('draft', 'approved', 'paid') DEFAULT 'draft',
    payment_date DATE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PARKING MODULE --

-- Parking Rates
CREATE TABLE parking_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_type ENUM('car', 'motorcycle', 'truck') NOT NULL,
    first_hour_rate DECIMAL(10,2) NOT NULL,
    additional_hour_rate DECIMAL(10,2) NOT NULL,
    daily_max_rate DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parking Members
CREATE TABLE parking_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('car', 'motorcycle', 'truck') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parking Transactions
CREATE TABLE parking_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('car', 'motorcycle', 'truck') NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    amount DECIMAL(10,2),
    status ENUM('active', 'completed', 'lost_ticket') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PACKAGE MODULE --

-- Education Packages
CREATE TABLE education_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_code VARCHAR(20) UNIQUE NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INT NOT NULL COMMENT 'in hours',
    price DECIMAL(15,2) NOT NULL,
    max_participants INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Package Bookings
CREATE TABLE package_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    package_id INT NOT NULL,
    customer_id INT NOT NULL,
    booking_date DATE NOT NULL,
    participant_count INT NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES education_packages(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Package Invoices
CREATE TABLE package_invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    booking_id INT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES package_bookings(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert initial admin user
INSERT INTO users (username, password, email, full_name, role) 
VALUES ('admin', '$2a$10$xxxxxxxxxxx', 'admin@example.com', 'System Administrator', 'admin');