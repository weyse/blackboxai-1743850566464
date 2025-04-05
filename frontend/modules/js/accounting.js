// Accounting Module JavaScript

// State management
let state = {
    accounts: [],
    journalEntries: [],
    fixedAssets: [],
    selectedAccount: null,
    selectedJournalEntry: null
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    loadChartOfAccounts();
    loadJournalEntries();
    loadFixedAssets();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('account-form')?.addEventListener('submit', handleAccountSubmit);
    document.getElementById('journal-entry-form')?.addEventListener('submit', handleJournalEntrySubmit);

    // Amount input formatting
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('blur', formatAmount);
    });
}

// Tab Switching
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Show selected tab content
    document.getElementById(tabId).classList.remove('hidden');

    // Update tab button styles
    document.querySelectorAll('#tabs button').forEach(button => {
        button.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600');
        button.classList.add('text-gray-500');
    });

    // Highlight active tab
    const activeButton = Array.from(document.querySelectorAll('#tabs button'))
        .find(button => button.onclick.toString().includes(tabId));
    if (activeButton) {
        activeButton.classList.remove('text-gray-500');
        activeButton.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600');
    }
}

// Chart of Accounts Functions
async function loadChartOfAccounts() {
    try {
        const response = await api.get('/accounting/chart-of-accounts');
        if (response.success) {
            state.accounts = response.data;
            renderAccounts();
        }
    } catch (error) {
        utils.showNotification('Failed to load chart of accounts', 'error');
    }
}

function renderAccounts() {
    const tbody = document.getElementById('accounts-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    state.accounts.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${account.account_code}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${account.account_name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${capitalizeFirstLetter(account.account_type)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${utils.formatCurrency(account.balance || 0)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editAccount(${account.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="viewAccountDetails(${account.id})" class="text-gray-600 hover:text-gray-900">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Journal Entries Functions
async function loadJournalEntries() {
    try {
        const response = await api.get('/accounting/journal-entries');
        if (response.success) {
            state.journalEntries = response.data;
            renderJournalEntries();
        }
    } catch (error) {
        utils.showNotification('Failed to load journal entries', 'error');
    }
}

function renderJournalEntries() {
    const tbody = document.getElementById('journal-entries-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    state.journalEntries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${utils.formatDate(entry.entry_date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${entry.reference_no}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${entry.description}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${getStatusColor(entry.status)}">
                    ${capitalizeFirstLetter(entry.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                ${utils.formatCurrency(entry.total_amount)}
            </td>
        `;
        row.addEventListener('click', () => viewJournalEntryDetails(entry.id));
        tbody.appendChild(row);
    });
}

// Journal Entry Modal Functions
function showJournalEntryModal() {
    const modal = document.getElementById('journal-entry-modal');
    modal.classList.remove('hidden');
    addJournalDetailRow(); // Add first detail row
}

function hideJournalEntryModal() {
    const modal = document.getElementById('journal-entry-modal');
    modal.classList.add('hidden');
    document.getElementById('journal-entry-form').reset();
    document.getElementById('journal-details-body').innerHTML = '';
}

function addJournalDetailRow() {
    const tbody = document.getElementById('journal-details-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="px-4 py-2">
            <select class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onchange="updateJournalTotals()">
                ${generateAccountOptions()}
            </select>
        </td>
        <td class="px-4 py-2">
            <input type="text" class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
        </td>
        <td class="px-4 py-2">
            <input type="number" step="0.01" class="w-full text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                   onchange="updateJournalTotals()" value="0.00">
        </td>
        <td class="px-4 py-2">
            <input type="number" step="0.01" class="w-full text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                   onchange="updateJournalTotals()" value="0.00">
        </td>
        <td class="px-4 py-2">
            <button type="button" onclick="removeJournalDetailRow(this)" class="text-red-600 hover:text-red-800">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

function removeJournalDetailRow(button) {
    const row = button.closest('tr');
    row.remove();
    updateJournalTotals();
}

function updateJournalTotals() {
    let totalDebit = 0;
    let totalCredit = 0;

    document.querySelectorAll('#journal-details-body tr').forEach(row => {
        totalDebit += parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
        totalCredit += parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0;
    });

    document.getElementById('total-debit').textContent = totalDebit.toFixed(2);
    document.getElementById('total-credit').textContent = totalCredit.toFixed(2);

    // Highlight totals if they don't match
    const totalsMatch = Math.abs(totalDebit - totalCredit) < 0.01;
    document.getElementById('total-debit').style.color = totalsMatch ? '' : 'red';
    document.getElementById('total-credit').style.color = totalsMatch ? '' : 'red';
}

// Form Handlers
async function handleAccountSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await api.post('/accounting/chart-of-accounts', Object.fromEntries(formData));
        if (response.success) {
            utils.showNotification('Account created successfully', 'success');
            hideAccountModal();
            loadChartOfAccounts();
        }
    } catch (error) {
        utils.showNotification('Failed to create account', 'error');
    }
}

async function handleJournalEntrySubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    // Validate debits and credits match
    const totalDebit = parseFloat(document.getElementById('total-debit').textContent);
    const totalCredit = parseFloat(document.getElementById('total-credit').textContent);
    
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
        utils.showNotification('Debits and credits must be equal', 'error');
        return;
    }

    // Gather journal details
    const details = [];
    document.querySelectorAll('#journal-details-body tr').forEach(row => {
        details.push({
            account_id: row.querySelector('select').value,
            description: row.querySelector('input[type="text"]').value,
            debit: parseFloat(row.querySelector('input[type="number"]:nth-of-type(1)').value) || 0,
            credit: parseFloat(row.querySelector('input[type="number"]:nth-of-type(2)').value) || 0
        });
    });

    const data = {
        entry_date: form.entry_date.value,
        reference_no: form.reference_no.value,
        description: form.description.value,
        details: details
    };

    try {
        const response = await api.post('/accounting/journal-entries', data);
        if (response.success) {
            utils.showNotification('Journal entry created successfully', 'success');
            hideJournalEntryModal();
            loadJournalEntries();
        }
    } catch (error) {
        utils.showNotification('Failed to create journal entry', 'error');
    }
}

// Report Generation
async function generateReport(reportType) {
    let endpoint;
    let params = new URLSearchParams();
    
    switch (reportType) {
        case 'balance-sheet':
            endpoint = '/accounting/reports/balance-sheet';
            params.append('as_of_date', new Date().toISOString().split('T')[0]);
            break;
        case 'income-statement':
            endpoint = '/accounting/reports/income-statement';
            const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            params.append('start_date', firstDay);
            params.append('end_date', today);
            break;
        case 'trial-balance':
            endpoint = '/accounting/reports/trial-balance';
            params.append('as_of_date', new Date().toISOString().split('T')[0]);
            break;
    }

    try {
        const response = await api.get(`${endpoint}?${params.toString()}`);
        if (response.success) {
            // Open report in new window/tab
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(generateReportHTML(reportType, response.data));
            reportWindow.document.close();
        }
    } catch (error) {
        utils.showNotification('Failed to generate report', 'error');
    }
}

// Utility Functions
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getStatusColor(status) {
    const colors = {
        draft: 'bg-gray-100 text-gray-800',
        posted: 'bg-green-100 text-green-800',
        void: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function generateAccountOptions() {
    return state.accounts.map(account => 
        `<option value="${account.id}">${account.account_code} - ${account.account_name}</option>`
    ).join('');
}

function formatAmount(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
        input.value = value.toFixed(2);
    }
}

function generateReportHTML(reportType, data) {
    // Implementation will vary based on report type and data structure
    // This is a basic example
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${capitalizeFirstLetter(reportType)}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 2em; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; }
                .amount { text-align: right; }
                .total { font-weight: bold; }
                @media print {
                    body { margin: 1cm; }
                }
            </style>
        </head>
        <body>
            <h1>${capitalizeFirstLetter(reportType)}</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
            ${generateReportContent(reportType, data)}
            <script>
                window.onload = () => window.print();
            </script>
        </body>
        </html>
    `;
}

function generateReportContent(reportType, data) {
    // Implementation will vary based on report type
    // This is a placeholder
    return '<div>Report content will be generated here</div>';
}