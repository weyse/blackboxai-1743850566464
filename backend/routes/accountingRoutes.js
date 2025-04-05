const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const accountingController = require('../controllers/accountingController');

// Middleware to check if user has accounting access
const hasAccountingAccess = (req, res, next) => {
    if (['admin', 'manager'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
};

// Chart of Accounts Routes
router.get('/chart-of-accounts', 
    auth, 
    accountingController.getAllAccounts
);

router.get('/chart-of-accounts/:id',
    auth,
    param('id').isInt().withMessage('Invalid account ID'),
    validate,
    accountingController.getAccountById
);

router.post('/chart-of-accounts',
    auth,
    hasAccountingAccess,
    [
        body('account_code').notEmpty().withMessage('Account code is required')
            .matches(/^[0-9]{4,}$/).withMessage('Account code must be at least 4 digits'),
        body('account_name').notEmpty().withMessage('Account name is required')
            .isLength({ min: 3 }).withMessage('Account name must be at least 3 characters'),
        body('account_type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
            .withMessage('Invalid account type'),
        body('parent_id').optional().isInt().withMessage('Invalid parent account ID')
    ],
    validate,
    accountingController.createAccount
);

router.put('/chart-of-accounts/:id',
    auth,
    hasAccountingAccess,
    [
        param('id').isInt().withMessage('Invalid account ID'),
        body('account_name').optional().isLength({ min: 3 })
            .withMessage('Account name must be at least 3 characters'),
        body('account_type').optional().isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
            .withMessage('Invalid account type'),
        body('description').optional().isString(),
        body('parent_id').optional().isInt().withMessage('Invalid parent account ID')
    ],
    validate,
    accountingController.updateAccount
);

// Journal Entry Routes
router.get('/journal-entries',
    auth,
    [
        query('start_date').optional().isDate().withMessage('Invalid start date'),
        query('end_date').optional().isDate().withMessage('Invalid end date'),
        query('status').optional().isIn(['draft', 'posted', 'void']).withMessage('Invalid status')
    ],
    validate,
    accountingController.getJournalEntries
);

router.get('/journal-entries/:id',
    auth,
    param('id').isInt().withMessage('Invalid journal entry ID'),
    validate,
    accountingController.getJournalEntryById
);

router.post('/journal-entries',
    auth,
    hasAccountingAccess,
    [
        body('entry_date').isDate().withMessage('Valid entry date is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('details').isArray({ min: 1 }).withMessage('At least one journal detail is required'),
        body('details.*.account_id').isInt().withMessage('Valid account ID is required for each detail'),
        body('details.*.debit').isFloat({ min: 0 }).withMessage('Valid debit amount is required'),
        body('details.*.credit').isFloat({ min: 0 }).withMessage('Valid credit amount is required')
    ],
    validate,
    accountingController.createJournalEntry
);

router.put('/journal-entries/:id',
    auth,
    hasAccountingAccess,
    [
        param('id').isInt().withMessage('Invalid journal entry ID'),
        body('entry_date').optional().isDate().withMessage('Invalid entry date'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('status').optional().isIn(['draft', 'posted', 'void']).withMessage('Invalid status')
    ],
    validate,
    accountingController.updateJournalEntry
);

// Budget Routes
router.get('/budgets',
    auth,
    [
        query('fiscal_year').optional().isInt().withMessage('Invalid fiscal year'),
        query('account_id').optional().isInt().withMessage('Invalid account ID')
    ],
    validate,
    accountingController.getBudgets
);

router.post('/budgets',
    auth,
    hasAccountingAccess,
    [
        body('fiscal_year').isInt().withMessage('Fiscal year is required'),
        body('account_id').isInt().withMessage('Account ID is required'),
        body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
        body('description').optional().isString()
    ],
    validate,
    accountingController.createBudget
);

// Fixed Assets Routes
router.get('/fixed-assets',
    auth,
    accountingController.getFixedAssets
);

router.post('/fixed-assets',
    auth,
    hasAccountingAccess,
    [
        body('asset_code').notEmpty().withMessage('Asset code is required'),
        body('asset_name').notEmpty().withMessage('Asset name is required'),
        body('purchase_date').isDate().withMessage('Valid purchase date is required'),
        body('purchase_cost').isFloat({ min: 0 }).withMessage('Valid purchase cost is required'),
        body('useful_life_years').isInt({ min: 1 }).withMessage('Valid useful life in years is required'),
        body('depreciation_method').isIn(['straight_line', 'declining_balance'])
            .withMessage('Invalid depreciation method')
    ],
    validate,
    accountingController.createFixedAsset
);

// Asset Depreciation Routes
router.get('/asset-depreciation/:asset_id',
    auth,
    param('asset_id').isInt().withMessage('Invalid asset ID'),
    validate,
    accountingController.getAssetDepreciation
);

router.post('/asset-depreciation/calculate',
    auth,
    hasAccountingAccess,
    [
        body('asset_id').isInt().withMessage('Asset ID is required'),
        body('calculation_date').isDate().withMessage('Valid calculation date is required')
    ],
    validate,
    accountingController.calculateDepreciation
);

// Reports
router.get('/reports/balance-sheet',
    auth,
    [
        query('as_of_date').isDate().withMessage('Valid as of date is required')
    ],
    validate,
    accountingController.generateBalanceSheet
);

router.get('/reports/income-statement',
    auth,
    [
        query('start_date').isDate().withMessage('Valid start date is required'),
        query('end_date').isDate().withMessage('Valid end date is required')
    ],
    validate,
    accountingController.generateIncomeStatement
);

router.get('/reports/trial-balance',
    auth,
    [
        query('as_of_date').isDate().withMessage('Valid as of date is required')
    ],
    validate,
    accountingController.generateTrialBalance
);

module.exports = router;