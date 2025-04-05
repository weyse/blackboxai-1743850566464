const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Chart of Accounts Controllers
 */
const getAllAccounts = async (req, res) => {
    try {
        const accounts = await sequelize.query(
            `SELECT 
                a.*,
                p.account_name as parent_account_name,
                (SELECT COUNT(*) FROM chart_of_accounts WHERE parent_id = a.id) as has_children
            FROM chart_of_accounts a
            LEFT JOIN chart_of_accounts p ON a.parent_id = p.id
            ORDER BY a.account_code`,
            { type: QueryTypes.SELECT }
        );

        res.json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('Error in getAllAccounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve chart of accounts'
        });
    }
};

const getAccountById = async (req, res) => {
    try {
        const [account] = await sequelize.query(
            `SELECT 
                a.*,
                p.account_name as parent_account_name
            FROM chart_of_accounts a
            LEFT JOIN chart_of_accounts p ON a.parent_id = p.id
            WHERE a.id = ?`,
            {
                replacements: [req.params.id],
                type: QueryTypes.SELECT
            }
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        res.json({
            success: true,
            data: account
        });
    } catch (error) {
        console.error('Error in getAccountById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve account'
        });
    }
};

const createAccount = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        // Check if account code already exists
        const [existingAccount] = await sequelize.query(
            'SELECT id FROM chart_of_accounts WHERE account_code = ?',
            {
                replacements: [req.body.account_code],
                type: QueryTypes.SELECT,
                transaction: t
            }
        );

        if (existingAccount) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Account code already exists'
            });
        }

        // Create new account
        const [accountId] = await sequelize.query(
            `INSERT INTO chart_of_accounts 
            (account_code, account_name, account_type, description, parent_id) 
            VALUES (?, ?, ?, ?, ?)`,
            {
                replacements: [
                    req.body.account_code,
                    req.body.account_name,
                    req.body.account_type,
                    req.body.description || null,
                    req.body.parent_id || null
                ],
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: { id: accountId }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error in createAccount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create account'
        });
    }
};

const updateAccount = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const [account] = await sequelize.query(
            'SELECT id FROM chart_of_accounts WHERE id = ?',
            {
                replacements: [req.params.id],
                type: QueryTypes.SELECT,
                transaction: t
            }
        );

        if (!account) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        await sequelize.query(
            `UPDATE chart_of_accounts 
            SET 
                account_name = COALESCE(?, account_name),
                account_type = COALESCE(?, account_type),
                description = COALESCE(?, description),
                parent_id = COALESCE(?, parent_id)
            WHERE id = ?`,
            {
                replacements: [
                    req.body.account_name || null,
                    req.body.account_type || null,
                    req.body.description || null,
                    req.body.parent_id || null,
                    req.params.id
                ],
                type: QueryTypes.UPDATE,
                transaction: t
            }
        );

        await t.commit();

        res.json({
            success: true,
            message: 'Account updated successfully'
        });
    } catch (error) {
        await t.rollback();
        console.error('Error in updateAccount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update account'
        });
    }
};

/**
 * Journal Entry Controllers
 */
const getJournalEntries = async (req, res) => {
    try {
        let query = `
            SELECT 
                j.*,
                u.username as created_by_user
            FROM journal_entries j
            LEFT JOIN users u ON j.created_by = u.id
            WHERE 1=1
        `;
        const replacements = [];

        if (req.query.start_date) {
            query += ' AND j.entry_date >= ?';
            replacements.push(req.query.start_date);
        }
        if (req.query.end_date) {
            query += ' AND j.entry_date <= ?';
            replacements.push(req.query.end_date);
        }
        if (req.query.status) {
            query += ' AND j.status = ?';
            replacements.push(req.query.status);
        }

        query += ' ORDER BY j.entry_date DESC, j.id DESC';

        const entries = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // Get details for each entry
        for (let entry of entries) {
            entry.details = await sequelize.query(
                `SELECT 
                    d.*,
                    a.account_code,
                    a.account_name
                FROM journal_details d
                JOIN chart_of_accounts a ON d.account_id = a.id
                WHERE d.journal_id = ?`,
                {
                    replacements: [entry.id],
                    type: QueryTypes.SELECT
                }
            );
        }

        res.json({
            success: true,
            data: entries
        });
    } catch (error) {
        console.error('Error in getJournalEntries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve journal entries'
        });
    }
};

const createJournalEntry = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        // Validate debits and credits balance
        const totalDebit = req.body.details.reduce((sum, detail) => sum + parseFloat(detail.debit), 0);
        const totalCredit = req.body.details.reduce((sum, detail) => sum + parseFloat(detail.credit), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) { // Allow for small floating point differences
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Debits and credits must be equal'
            });
        }

        // Create journal entry
        const [journalId] = await sequelize.query(
            `INSERT INTO journal_entries 
            (entry_date, reference_no, description, created_by) 
            VALUES (?, ?, ?, ?)`,
            {
                replacements: [
                    req.body.entry_date,
                    req.body.reference_no,
                    req.body.description,
                    req.user.id
                ],
                type: QueryTypes.INSERT,
                transaction: t
            }
        );

        // Create journal details
        for (const detail of req.body.details) {
            await sequelize.query(
                `INSERT INTO journal_details 
                (journal_id, account_id, debit, credit, description) 
                VALUES (?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        journalId,
                        detail.account_id,
                        detail.debit,
                        detail.credit,
                        detail.description || null
                    ],
                    type: QueryTypes.INSERT,
                    transaction: t
                }
            );
        }

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Journal entry created successfully',
            data: { id: journalId }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error in createJournalEntry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create journal entry'
        });
    }
};

/**
 * Report Generation Controllers
 */
const generateBalanceSheet = async (req, res) => {
    try {
        const asOfDate = req.query.as_of_date;

        // Get all accounts with their balances
        const accounts = await sequelize.query(
            `WITH RECURSIVE AccountHierarchy AS (
                SELECT 
                    id, 
                    account_code,
                    account_name,
                    account_type,
                    parent_id,
                    0 as level
                FROM chart_of_accounts
                WHERE parent_id IS NULL
                
                UNION ALL
                
                SELECT 
                    c.id,
                    c.account_code,
                    c.account_name,
                    c.account_type,
                    c.parent_id,
                    ah.level + 1
                FROM chart_of_accounts c
                INNER JOIN AccountHierarchy ah ON c.parent_id = ah.id
            )
            SELECT 
                ah.*,
                COALESCE(
                    (SELECT SUM(debit) - SUM(credit)
                    FROM journal_details jd
                    JOIN journal_entries je ON jd.journal_id = je.id
                    WHERE jd.account_id = ah.id
                    AND je.entry_date <= ?
                    AND je.status = 'posted'), 0
                ) as balance
            FROM AccountHierarchy ah
            WHERE ah.account_type IN ('asset', 'liability', 'equity')
            ORDER BY ah.account_code`,
            {
                replacements: [asOfDate],
                type: QueryTypes.SELECT
            }
        );

        // Organize data for balance sheet
        const balanceSheet = {
            asOfDate,
            assets: accounts.filter(a => a.account_type === 'asset'),
            liabilities: accounts.filter(a => a.account_type === 'liability'),
            equity: accounts.filter(a => a.account_type === 'equity'),
            totalAssets: accounts
                .filter(a => a.account_type === 'asset')
                .reduce((sum, account) => sum + parseFloat(account.balance), 0),
            totalLiabilities: accounts
                .filter(a => a.account_type === 'liability')
                .reduce((sum, account) => sum + parseFloat(account.balance), 0),
            totalEquity: accounts
                .filter(a => a.account_type === 'equity')
                .reduce((sum, account) => sum + parseFloat(account.balance), 0)
        };

        res.json({
            success: true,
            data: balanceSheet
        });
    } catch (error) {
        console.error('Error in generateBalanceSheet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate balance sheet'
        });
    }
};

module.exports = {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    getJournalEntries,
    createJournalEntry,
    generateBalanceSheet
};