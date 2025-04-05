# Enterprise Business Management System

A comprehensive business management system with modules for Accounting, Finance, Front Desk, Purchasing, Logistics, HR, Parking, and more.

## Features

- **Accounting Module**: Chart of Accounts, General Journal, Budgeting, Balance Sheet, Fixed Assets
- **Financial Module**: Bank Operations, Income/Expense Management
- **Front Desk**: Saung Management, Reservations, Check-in/out
- **Purchasing**: Supplier Management, Purchase Orders, Returns
- **Logistics**: Inventory Management, Warehouse Operations
- **Personnel**: Employee Management, Attendance, Payroll
- **Parking**: Parking Management, Rates, Gate Control
- **Setup**: System Configuration, User Management
- **Package Management**: Educational Packages, Guest Data, Invoicing

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Set up the database:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `frontend/index.html` in your browser

## Technology Stack

- Frontend: HTML5, CSS3 (with Tailwind CSS), JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Additional: Font Awesome for icons, Google Fonts for typography

## Project Structure

```
project/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── database/
└── frontend/
    ├── css/
    ├── js/
    └── modules/
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.