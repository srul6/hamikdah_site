const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { groupOrderItemsForDisplay } = require('../utils/bundleCheckout');

class GoogleSheetsService {
    constructor() {
        this.spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').trim();
        this.sheetName = (process.env.GOOGLE_SHEETS_SHEET_NAME || 'Orders').trim();
        this.serviceAccountEmail = '';
        this.privateKeyRaw = '';

        this.sheetsClient = null;
        this.loadCredentials();
        this.initializeClient();
    }

    loadCredentials() {
        const keyFile = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || '').trim();
        if (keyFile) {
            try {
                const absPath = path.isAbsolute(keyFile)
                    ? keyFile
                    : path.resolve(process.cwd(), keyFile);
                const creds = JSON.parse(fs.readFileSync(absPath, 'utf8'));
                this.serviceAccountEmail = (creds.client_email || '').trim();
                this.privateKeyRaw = creds.private_key || '';
                return;
            } catch (error) {
                console.error('❌ Failed to read GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', error.message || error);
            }
        }

        this.serviceAccountEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
        this.privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
    }

    normalizePrivateKey(raw) {
        if (!raw || !String(raw).trim()) return null;

        const key = String(raw).replace(/\\n/g, '\n').trim();
        const beginCount = (key.match(/-----BEGIN PRIVATE KEY-----/g) || []).length;
        if (beginCount !== 1) {
            console.error(
                '❌ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is malformed (expected one "BEGIN PRIVATE KEY" block). ' +
                'Use GOOGLE_SERVICE_ACCOUNT_KEY_FILE pointing to your service-account JSON instead.'
            );
            return null;
        }
        return key;
    }

    initializeClient() {
        if (!this.spreadsheetId) {
            console.warn('⚠️  Google Sheets not configured - missing GOOGLE_SHEETS_SPREADSHEET_ID');
            return;
        }
        if (!this.serviceAccountEmail) {
            console.warn('⚠️  Google Sheets not configured - missing GOOGLE_SERVICE_ACCOUNT_EMAIL (or KEY_FILE)');
            return;
        }

        const privateKey = this.normalizePrivateKey(this.privateKeyRaw);
        if (!privateKey) {
            console.warn('⚠️  Google Sheets not configured - missing or invalid GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
            return;
        }

        try {
            const auth = new google.auth.JWT({
                email: this.serviceAccountEmail,
                key: privateKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheetsClient = google.sheets({ version: 'v4', auth });
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets client:', error.message || error);
            this.sheetsClient = null;
        }
    }

    isConfigured() {
        return !!(this.spreadsheetId && this.serviceAccountEmail && this.privateKeyRaw.trim() && this.sheetsClient);
    }

    formatSheetRange(columnRange = 'A:Q') {
        const escaped = String(this.sheetName).replace(/'/g, "''");
        return `'${escaped}'!${columnRange}`;
    }

    async resolveSheetTabName() {
        const meta = await this.sheetsClient.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: 'sheets.properties.title'
        });

        const titles = (meta.data.sheets || [])
            .map((s) => s.properties?.title)
            .filter(Boolean);

        if (titles.length === 0) {
            throw new Error('Spreadsheet has no tabs');
        }

        const exact = titles.find((t) => t === this.sheetName);
        if (exact) return exact;

        const caseInsensitive = titles.find(
            (t) => t.toLowerCase() === this.sheetName.toLowerCase()
        );
        if (caseInsensitive) {
            console.warn(`⚠️  Sheet tab "${this.sheetName}" not found; using "${caseInsensitive}"`);
            this.sheetName = caseInsensitive;
            return caseInsensitive;
        }

        console.error(
            `❌ Sheet tab "${this.sheetName}" not found. Available tabs: ${titles.join(', ')}. ` +
            'Update GOOGLE_SHEETS_SHEET_NAME in .env to match your tab name exactly.'
        );
        return null;
    }

    serializeItems(items) {
        const safeItems = Array.isArray(items) ? items : [];
        if (safeItems.length === 0) {
            return 'לא זמין מידע על הפריטים';
        }

        return groupOrderItemsForDisplay(safeItems)
            .map((row) => {
                if (row.kind === 'bundle') {
                    const qty = row.quantity || 1;
                    const price = parseFloat(row.unitPrice) || 0;
                    const comps = (row.components || [])
                        .map((c) => {
                            const base = c.name_he || c.name_en || 'פריט';
                            // Prefer bare product name + color; names may already include (color)
                            const color = c.color_name_he || c.color_name_en || '';
                            if (color && !String(base).includes('(')) {
                                return `${base} [${color}]`;
                            }
                            // Extract trailing (color) for sheet format
                            const m = String(base).match(/^(.*?)\s*\(([^)]+)\)\s*$/);
                            if (m) return `${m[1].trim()} [${m[2].trim()}]`;
                            return base;
                        })
                        .join(', ');
                    return `[באנדל] ${row.name_he || row.name_en || 'באנדל'} x${qty} (₪${price.toFixed(2)} each: ${comps})`;
                }
                const item = row.item;
                const name = item.name_he || item.name_en || item.name || 'פריט';
                const quantity = item.quantity || 1;
                const price = parseFloat(item.price) || 0;
                return `${name} x${quantity} (₪${price.toFixed(2)} each)`;
            })
            .join('; ');
    }

    /** Column R: whether the order contains any bundle lines. */
    orderHasBundles(items) {
        return groupOrderItemsForDisplay(items || []).some((r) => r.kind === 'bundle');
    }

    buildOrderRow(orderData) {
        const {
            formId,
            status,
            documentId,
            paymentId,
            amount,
            currency,
            customerInfo,
            items,
            purchaseTimestamp,
            dedication
        } = orderData || {};

        const timestamp = purchaseTimestamp || new Date().toLocaleString('he-IL', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const numericAmount = parseFloat(amount);
        const amountDisplay = Number.isNaN(numericAmount) ? (amount ?? 'לא זמין') : numericAmount;

        // Columns A–Q unchanged; column R = באנדל? (כן/לא). Add header "באנדל?" in R1 manually once.
        return [
            formId || 'לא זמין',
            status || 'לא זמין',
            documentId || 'לא זמין',
            paymentId || 'לא זמין',
            amountDisplay,
            currency || 'ILS',
            timestamp,
            customerInfo?.name || 'לא זמין',
            customerInfo?.email || 'לא זמין',
            customerInfo?.phone || 'לא זמין',
            customerInfo?.street || 'לא זמין',
            customerInfo?.houseNumber || '',
            customerInfo?.apartmentNumber || 'לא צוין',
            customerInfo?.floor || 'לא צוין',
            customerInfo?.city || 'לא זמין',
            dedication || 'לא צוין',
            this.serializeItems(items),
            this.orderHasBundles(items) ? 'כן' : 'לא'
        ];
    }

    async sendOrderToGoogleSheet(orderData) {
        if (!this.isConfigured()) {
            console.error('❌ Google Sheets not configured - check GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
            return false;
        }

        try {
            const tabName = await this.resolveSheetTabName();
            if (!tabName) return false;

            const row = this.buildOrderRow(orderData);
            const range = this.formatSheetRange('A:R');

            await this.sheetsClient.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [row]
                }
            });

            console.log(`✅ Order appended to Google Sheets tab "${tabName}" successfully`);
            return true;
        } catch (error) {
            console.error('❌ Failed to append order to Google Sheets:', error.message || error);
            if (error.response?.data) {
                console.error('   Google Sheets API error details:', error.response.data);
            }
            return false;
        }
    }
}

module.exports = GoogleSheetsService;
