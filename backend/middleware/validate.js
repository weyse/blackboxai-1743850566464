const { validationResult } = require('express-validator');

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 * Returns detailed error messages if validation fails
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        // Format validation errors
        const formattedErrors = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
        });
    }

    next();
};

/**
 * Custom validation rules
 */
const rules = {
    // Validate Indonesian currency amount
    idrAmount: {
        options: {
            min: 0,
            max: 999999999999.99, // 1 trillion IDR - 1
            decimal_digits: '0,2'
        },
        errorMessage: 'Must be a valid IDR amount'
    },

    // Validate Indonesian phone number
    phoneNumber: {
        matches: {
            options: [/^(\+62|62|0)8[1-9][0-9]{6,9}$/],
            errorMessage: 'Must be a valid Indonesian phone number'
        }
    },

    // Validate Indonesian tax number (NPWP)
    taxNumber: {
        matches: {
            options: [/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/],
            errorMessage: 'Must be a valid NPWP number format (XX.XXX.XXX.X-XXX.XXX)'
        }
    },

    // Validate Indonesian postal code
    postalCode: {
        matches: {
            options: [/^\d{5}$/],
            errorMessage: 'Must be a valid 5-digit Indonesian postal code'
        }
    },

    // Validate Indonesian ID number (KTP)
    ktpNumber: {
        matches: {
            options: [/^\d{16}$/],
            errorMessage: 'Must be a valid 16-digit KTP number'
        }
    },

    // Validate date range
    dateRange: {
        custom: {
            options: (value, { req }) => {
                const startDate = new Date(req.body.start_date);
                const endDate = new Date(value);
                return endDate >= startDate;
            },
            errorMessage: 'End date must be greater than or equal to start date'
        }
    },

    // Validate file size (in bytes)
    fileSize: (maxSize) => ({
        custom: {
            options: (value, { req }) => {
                const file = req.file;
                if (!file) return true;
                return file.size <= maxSize;
            },
            errorMessage: `File size must not exceed ${maxSize / 1024 / 1024}MB`
        }
    }),

    // Validate file type
    fileType: (allowedTypes) => ({
        custom: {
            options: (value, { req }) => {
                const file = req.file;
                if (!file) return true;
                return allowedTypes.includes(file.mimetype);
            },
            errorMessage: `File type must be one of: ${allowedTypes.join(', ')}`
        }
    }),

    // Validate password strength
    password: {
        matches: {
            options: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/],
            errorMessage: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    },

    // Validate email domain
    emailDomain: (allowedDomains) => ({
        custom: {
            options: (value) => {
                const domain = value.split('@')[1];
                return allowedDomains.includes(domain);
            },
            errorMessage: `Email domain must be one of: ${allowedDomains.join(', ')}`
        }
    }),

    // Validate Indonesian bank account number
    bankAccount: {
        matches: {
            options: [/^\d{10,16}$/],
            errorMessage: 'Must be a valid bank account number (10-16 digits)'
        }
    }
};

/**
 * Sanitization middleware
 * Sanitizes request data before validation
 */
const sanitize = (req, res, next) => {
    // Trim whitespace from string values
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            return value.trim();
        }
        if (typeof value === 'object' && value !== null) {
            Object.keys(value).forEach(key => {
                value[key] = sanitizeValue(value[key]);
            });
        }
        return value;
    };

    req.body = sanitizeValue(req.body);
    req.query = sanitizeValue(req.query);
    req.params = sanitizeValue(req.params);

    next();
};

module.exports = {
    validate,
    rules,
    sanitize
};