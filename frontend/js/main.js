// Main JavaScript functionality

// Utility functions
const utils = {
    // Format currency in Indonesian Rupiah
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    },

    // Format date in Indonesian format
    formatDate: (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },

    // Show loading spinner
    showLoading: (element) => {
        element.innerHTML = '<div class="spinner"></div>';
    },

    // Hide loading spinner
    hideLoading: (element) => {
        element.innerHTML = '';
    },

    // Show notification
    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-md`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Form validation
    validateForm: (form) => {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                input.classList.add('border-red-500');
                isValid = false;
            } else {
                input.classList.remove('border-red-500');
            }
        });

        return isValid;
    },

    // Modal handling
    modal: {
        show: (content) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onclick="utils.modal.hide(this)">
                        <i class="fas fa-times"></i>
                    </button>
                    ${content}
                </div>
            `;
            document.body.appendChild(modal);
        },
        hide: (button) => {
            button.closest('.modal').remove();
        }
    }
};

// API calls
const api = {
    baseUrl: '/api',

    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            utils.showNotification(error.message, 'error');
            throw error;
        }
    },

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            utils.showNotification(error.message, 'error');
            throw error;
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuButton = document.querySelector('#menu-button');
    const sidebar = document.querySelector('aside');
    
    if (menuButton && sidebar) {
        menuButton.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuButton.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Notification badge updates
    const updateNotifications = async () => {
        try {
            const notifications = await api.get('/notifications/unread');
            const badge = document.querySelector('#notification-badge');
            if (badge && notifications.length > 0) {
                badge.textContent = notifications.length;
                badge.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Update notifications every minute
    setInterval(updateNotifications, 60000);

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!utils.validateForm(form)) {
                e.preventDefault();
                utils.showNotification('Please fill in all required fields', 'error');
            }
        });
    });

    // Dynamic table sorting
    const tables = document.querySelectorAll('.sortable-table');
    tables.forEach(table => {
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                const direction = header.classList.contains('sort-asc') ? 'desc' : 'asc';
                
                // Remove sort classes from all headers
                headers.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Add sort class to clicked header
                header.classList.add(`sort-${direction}`);
                
                // Sort the table
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                const sortedRows = rows.sort((a, b) => {
                    const aValue = a.querySelector(`td[data-${column}]`).dataset[column];
                    const bValue = b.querySelector(`td[data-${column}]`).dataset[column];
                    
                    if (direction === 'asc') {
                        return aValue.localeCompare(bValue);
                    } else {
                        return bValue.localeCompare(aValue);
                    }
                });
                
                // Update table body
                const tbody = table.querySelector('tbody');
                tbody.innerHTML = '';
                sortedRows.forEach(row => tbody.appendChild(row));
            });
        });
    });

    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-gray-800 text-white text-sm px-2 py-1 rounded z-50';
            tooltip.textContent = element.dataset.tooltip;
            
            const rect = element.getBoundingClientRect();
            tooltip.style.top = `${rect.bottom + 5}px`;
            tooltip.style.left = `${rect.left}px`;
            
            document.body.appendChild(tooltip);
            
            element.addEventListener('mouseleave', () => tooltip.remove());
        });
    });
});

// Export utilities for use in other modules
window.utils = utils;
window.api = api;