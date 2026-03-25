/**
 * Shared validation / sanitization for checkout (payment-form) and order creation.
 * Limits align with frontend TextField maxLength where applicable.
 *
 * The `errors` strings returned on failure are for server-side logging only (e.g. console.warn).
 * They must never be forwarded to HTTP clients — routes/controllers should use
 * `clientFacingMessages` for JSON responses.
 */

const LIMITS = {
    name: 120,
    email: 254,
    phone: 25,
    street: 200,
    houseNumber: 30,
    apartmentNumber: 30,
    floor: 15,
    city: 100,
    dedication: 500,
    formId: 128,
    currency: 8,
    country: 56,
    productName: 300,
    colorTag: 120,
    idString: 64
};

const MAX_LINE_ITEMS = 50;

// Pragmatic email check (RFC 5322 full validation is overkill here)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, common phone punctuation (incl. Hebrew/RTL paste artifacts)
const PHONE_RE = /^[\d+\-\s()./]+$/;

function stripControlChars(str) {
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function truncate(str, max) {
    return str.length <= max ? str : str.slice(0, max);
}

function sanitizeOptionalString(value, max) {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') return '';
    return truncate(stripControlChars(value.trim()), max);
}

function validateCustomerInfo(customerInfo) {
    if (!customerInfo || typeof customerInfo !== 'object') {
        return { ok: false, errors: ['customerInfo must be an object'], sanitized: null };
    }

    const name = sanitizeOptionalString(customerInfo.name, LIMITS.name);
    const email = sanitizeOptionalString(customerInfo.email, LIMITS.email).toLowerCase();
    const phone = sanitizeOptionalString(customerInfo.phone, LIMITS.phone);
    const street = sanitizeOptionalString(customerInfo.street, LIMITS.street);
    const houseNumber = sanitizeOptionalString(customerInfo.houseNumber, LIMITS.houseNumber);
    const apartmentNumber = sanitizeOptionalString(customerInfo.apartmentNumber, LIMITS.apartmentNumber);
    const floor = sanitizeOptionalString(customerInfo.floor, LIMITS.floor);
    const city = sanitizeOptionalString(customerInfo.city, LIMITS.city);
    const dedication = sanitizeOptionalString(customerInfo.dedication, LIMITS.dedication);
    let country = sanitizeOptionalString(customerInfo.country, LIMITS.country);
    if (!country) country = 'IL';

    const errors = [];
    if (!name) errors.push('Customer name is required');
    if (!email) errors.push('Customer email is required');
    else if (!EMAIL_RE.test(email)) errors.push('Customer email format is invalid');
    if (!phone) errors.push('Customer phone is required');
    else if (!PHONE_RE.test(phone)) errors.push('Customer phone contains invalid characters');
    else if (phone.replace(/\D/g, '').length < 5) errors.push('Customer phone is too short');

    if (errors.length) return { ok: false, errors, sanitized: null };

    return {
        ok: true,
        errors: [],
        sanitized: {
            name,
            email,
            phone,
            street,
            houseNumber,
            apartmentNumber,
            floor,
            city,
            dedication,
            country
        }
    };
}

function sanitizeOneLineItem(item, index) {
    const errors = [];
    if (!item || typeof item !== 'object') {
        return { errors: [`Item ${index}: must be an object`], item: null };
    }

    const id = item.id;
    if (id === undefined || id === null || String(id).trim() === '') {
        errors.push(`Item ${index}: id is required`);
        return { errors, item: null };
    }

    let quantity = parseInt(item.quantity, 10);
    if (Number.isNaN(quantity) || quantity < 1) {
        errors.push(`Item ${index}: quantity must be at least 1`);
        return { errors, item: null };
    }
    if (quantity > 999) {
        errors.push(`Item ${index}: quantity must be at most 999`);
        return { errors, item: null };
    }

    let price = parseFloat(item.price);
    if (Number.isNaN(price) || price < 0) {
        errors.push(`Item ${index}: price must be a valid non-negative number`);
        return { errors, item: null };
    }
    if (price > 1e7) {
        errors.push(`Item ${index}: price is too large`);
        return { errors, item: null };
    }

    return {
        errors: [],
        item: {
            id,
            quantity,
            price,
            name_he: sanitizeOptionalString(item.name_he, LIMITS.productName),
            name_en: sanitizeOptionalString(item.name_en, LIMITS.productName),
            name: sanitizeOptionalString(item.name, LIMITS.productName),
            color_name_he: sanitizeOptionalString(item.color_name_he, LIMITS.colorTag),
            color_name_en: sanitizeOptionalString(item.color_name_en, LIMITS.colorTag)
        }
    };
}

function validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return { ok: false, errors: ['Items array is required and must not be empty'], sanitized: null };
    }
    if (items.length > MAX_LINE_ITEMS) {
        return { ok: false, errors: [`Cart cannot contain more than ${MAX_LINE_ITEMS} line items`], sanitized: null };
    }

    const errors = [];
    const sanitized = [];
    for (let i = 0; i < items.length; i++) {
        const { errors: rowErrors, item } = sanitizeOneLineItem(items[i], i);
        if (rowErrors.length) errors.push(...rowErrors);
        else sanitized.push(item);
    }

    if (errors.length) return { ok: false, errors, sanitized: null };
    return { ok: true, errors: [], sanitized };
}

/**
 * Payment form: items + total + customerInfo
 */
function validateCheckoutRequest({ items, totalAmount, customerInfo }) {
    const itemResult = validateItems(items);
    if (!itemResult.ok) return { ok: false, errors: itemResult.errors, customerInfo: null, items: null };

    const cust = validateCustomerInfo(customerInfo);
    if (!cust.ok) return { ok: false, errors: cust.errors, customerInfo: null, items: null };

    const total = parseFloat(totalAmount);
    if (Number.isNaN(total) || total <= 0) {
        return { ok: false, errors: ['Total amount must be a positive number'], customerInfo: null, items: null };
    }
    if (total > 1e8) {
        return { ok: false, errors: ['Total amount is too large'], customerInfo: null, items: null };
    }

    return { ok: true, errors: [], customerInfo: cust.sanitized, items: itemResult.sanitized };
}

/**
 * POST /api/orders — same customer/items rules; dedication may be top-level on webhook payload
 */
function validateOrderCreatePayload(body) {
    if (!body || typeof body !== 'object') {
        return { ok: false, errors: ['Request body must be a JSON object'], orderData: null };
    }

    const cust = validateCustomerInfo(body.customerInfo);
    if (!cust.ok) return { ok: false, errors: cust.errors, orderData: null };

    const itemResult = validateItems(body.items);
    if (!itemResult.ok) return { ok: false, errors: itemResult.errors, orderData: null };

    const amount = parseFloat(body.amount);
    if (Number.isNaN(amount) || amount < 0) {
        return { ok: false, errors: ['amount must be a valid non-negative number'], orderData: null };
    }

    const dedicationTop = sanitizeOptionalString(body.dedication, LIMITS.dedication);
    const dedicationFromCustomer = cust.sanitized.dedication;
    const dedication = dedicationTop || dedicationFromCustomer || null;

    const formIdRaw = body.formId;
    if (formIdRaw !== undefined && formIdRaw !== null && String(formIdRaw).length > LIMITS.formId) {
        return { ok: false, errors: ['formId is too long'], orderData: null };
    }

    const statusRaw = body.status;
    const status = typeof statusRaw === 'string'
        ? (sanitizeOptionalString(statusRaw, 32) || 'pending')
        : 'pending';

    const orderData = {
        formId: body.formId,
        documentId: body.documentId != null ? sanitizeOptionalString(String(body.documentId), LIMITS.idString) : null,
        paymentId: body.paymentId != null ? sanitizeOptionalString(String(body.paymentId), LIMITS.idString) : null,
        status,
        amount,
        currency: sanitizeOptionalString(String(body.currency || 'ILS'), LIMITS.currency) || 'ILS',
        customerInfo: {
            ...cust.sanitized,
            dedication: dedicationFromCustomer
        },
        items: itemResult.sanitized,
        dedication,
        marketingConsent: !!body.marketingConsent,
        purchaseTimestamp: body.purchaseTimestamp
    };

    return { ok: true, errors: [], orderData };
}

module.exports = {
    LIMITS,
    validateCheckoutRequest,
    validateOrderCreatePayload,
    validateCustomerInfo,
    validateItems
};
