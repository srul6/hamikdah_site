const axios = require('axios');

/** Verbose logs (PII, tokens, full API payloads) — off in production only */
const logDetails = process.env.NODE_ENV === 'production' ? false : true;

const PRODUCTION_BASE_URL = 'https://api.greeninvoice.co.il/api/v1';
const SANDBOX_BASE_URL = 'https://sandbox.d.greeninvoice.co.il/api/v1';
const PRODUCTION_IDP_URL = 'https://api.morning.co';
const SANDBOX_IDP_URL = 'https://api.sandbox.morning.dev';

/**
 * Log a failed token request. Status and OAuth error code/description are logged in all
 * environments; full response bodies only outside production. Never logs credentials or tokens.
 */
function logTokenError(method, error) {
    console.error(`Failed to get GreenInvoice token (${method}):`, error?.message || error);
    const res = error?.response;
    if (!res) return;
    const data = res.data && typeof res.data === 'object' ? res.data : {};
    console.error(`GreenInvoice ${method} token error:`, {
        status: res.status,
        ...(data.error ? { error: data.error } : {}),
        ...(data.error_description ? { error_description: data.error_description } : {})
    });
    if (logDetails) {
        console.error(`GreenInvoice ${method} token error response body:`, res.data);
    }
}

/** OAuth errors the legacy endpoint cannot fix (RFC 6749 error codes from the morning IDP). */
const OAUTH_NO_FALLBACK_HINTS = {
    invalid_grant: 'API key expired, revoked or pending (invalid_grant)',
    unauthorized_client: 'no active subscription or no API access for this account (unauthorized_client)'
};

/** Fall back to legacy only for network errors, timeouts, 5xx, and 401/403/404 from the IDP. */
function shouldFallBackToLegacy(error) {
    const status = error?.response?.status;
    if (!status) return true;
    if (status >= 500) return true;
    return [401, 403, 404].includes(status);
}

function describeTokenError(error) {
    const res = error?.response;
    if (!res) return error?.code || error?.message || 'network error';
    const code = res.data && typeof res.data === 'object' && res.data.error;
    return code ? `HTTP ${res.status} ${code}` : `HTTP ${res.status}`;
}

/**
 * Production deployments (NODE_ENV === 'production') use the existing
 * GREENINVOICE_* credentials, base URL, and CARDCOM_PLUGIN_ID.
 * Local / non-production use GREENINVOICE_SANDBOX_* credentials, the sandbox API,
 * and CARDCOM_SANDBOX_PLUGIN_ID.
 */
function resolveGreenInvoiceConfig() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        return {
            environment: 'production',
            apiKeyId: process.env.GREENINVOICE_API_KEY_ID,
            apiKeySecret: process.env.GREENINVOICE_API_KEY_SECRET,
            // Existing production behavior — unchanged
            baseUrl: process.env.GREENINVOICE_BASE_URL || PRODUCTION_BASE_URL,
            idpUrl: process.env.GREENINVOICE_IDP_URL || PRODUCTION_IDP_URL,
            pluginId: process.env.CARDCOM_PLUGIN_ID
        };
    }

    return {
        environment: 'sandbox',
        apiKeyId: process.env.GREENINVOICE_SANDBOX_API_KEY_ID,
        apiKeySecret: process.env.GREENINVOICE_SANDBOX_API_KEY_SECRET,
        baseUrl: process.env.GREENINVOICE_SANDBOX_BASE_URL || SANDBOX_BASE_URL,
        idpUrl: process.env.GREENINVOICE_SANDBOX_IDP_URL || SANDBOX_IDP_URL,
        pluginId: process.env.CARDCOM_SANDBOX_PLUGIN_ID
    };
}

class GreenInvoiceService {
    constructor() {
        const config = resolveGreenInvoiceConfig();
        this.environment = config.environment;
        this.apiKeyId = config.apiKeyId;
        this.apiKeySecret = config.apiKeySecret;
        this.baseUrl = config.baseUrl;
        this.idpUrl = config.idpUrl;
        this.pluginId = config.pluginId;
        this.token = null;
        this.tokenExpiry = null;
        /** Last successful login method: 'oauth' | 'legacy' */
        this.authMethod = 'oauth';

        console.log(`GreenInvoice: environment=${this.environment}`);
        if (logDetails) {
            console.log(
                `GreenInvoice: using ${this.environment} API at ${this.baseUrl}` +
                (this.pluginId ? ` (pluginId=${this.pluginId})` : ' (pluginId missing)')
            );
        }
    }

    async getToken() {
        if (!this.apiKeyId || !this.apiKeySecret) {
            const missing = [
                !this.apiKeyId && 'API key ID',
                !this.apiKeySecret && 'API key secret'
            ].filter(Boolean).join(' and ');
            throw new Error(`GreenInvoice ${this.environment} credentials missing: ${missing} not set`);
        }

        // Check if we have a valid token
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        // A legacy token has expired: go back to OAuth-first so we leave legacy as soon as OAuth works
        if (this.authMethod === 'legacy') {
            this.authMethod = 'oauth';
        }

        let oauthError;
        try {
            const token = await this.getOAuthToken();
            this.authMethod = 'oauth';
            return token;
        } catch (err) {
            oauthError = err;
        }

        if (!shouldFallBackToLegacy(oauthError)) {
            logTokenError('OAuth', oauthError);
            const hint = OAUTH_NO_FALLBACK_HINTS[oauthError.response?.data?.error];
            if (hint) {
                console.error(`GreenInvoice ${this.environment}: ${hint}`);
            }
            throw new Error('Failed to authenticate with GreenInvoice');
        }

        try {
            const token = await this.getLegacyToken();
            this.authMethod = 'legacy';
            console.log(
                `GreenInvoice: OAuth token request failed (${describeTokenError(oauthError)}); authenticated via legacy /account/token`
            );
            return token;
        } catch (legacyError) {
            logTokenError('OAuth', oauthError);
            logTokenError('legacy', legacyError);
            throw new Error('Failed to authenticate with GreenInvoice');
        }
    }

    cacheToken(token, expiresInSeconds) {
        const lifetimeMs = (Number(expiresInSeconds) > 0 ? Number(expiresInSeconds) : 3600) * 1000;
        this.token = token;
        this.tokenExpiry = Date.now() + lifetimeMs - 5 * 60 * 1000;
        if (logDetails) {
            console.log('GreenInvoice token obtained, expires:', new Date(this.tokenExpiry));
        } else {
            console.log('GreenInvoice: access token obtained');
        }
        return token;
    }

    async getLegacyToken() {
        const response = await axios.post(`${this.baseUrl}/account/token`, {
            id: this.apiKeyId,
            secret: this.apiKeySecret
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (logDetails) {
            console.log(
                '[GreenInvoice] POST /account/token response headers:',
                JSON.stringify(response.headers, null, 2)
            );
        }

        // Extract token from response headers (GreenInvoice specific)
        const token = response.headers['x-authorization-bearer'] || response.data.token;
        if (!token) {
            throw new Error('No token received from GreenInvoice');
        }
        return this.cacheToken(token, 3600);
    }

    async getOAuthToken() {
        const response = await axios.post(
            `${this.idpUrl}/idp/v1/oauth/token`,
            {
                grant_type: 'client_credentials',
                client_id: this.apiKeyId,
                client_secret: this.apiKeySecret
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );
        const token = response.data?.accessToken || response.data?.access_token;
        if (!token) {
            throw new Error('No OAuth token received from GreenInvoice');
        }
        // expiresAt is an absolute Unix timestamp in seconds
        const expiresAt = Number(response.data?.expiresAt);
        const lifetimeSeconds = Number.isFinite(expiresAt) && expiresAt > 0
            ? expiresAt - Math.floor(Date.now() / 1000)
            : 3600;
        return this.cacheToken(token, lifetimeSeconds);
    }

    async createInvoice(invoiceData) {
        try {
            const token = await this.getToken();
            if (logDetails) {
                console.log('Creating invoice with data:', invoiceData);
            }

            const response = await axios.post(
                `${this.baseUrl}/documents`,
                invoiceData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000
                }
            );

            if (logDetails) {
                console.log('GreenInvoice invoice creation response:', response.data);
            }
            return response.data;
        } catch (error) {
            console.error('GreenInvoice invoice creation failed:', error.message || error);

            // Enhanced error handling to capture full GreenInvoice error details
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                };

                if (logDetails) {
                    console.error('GreenInvoice API error response:', errorDetails);
                } else {
                    console.error('GreenInvoice API error HTTP status:', error.response.status);
                }

                // Create a custom error with full details
                const customError = new Error('GreenInvoice API Error');
                customError.isAxiosError = true;
                customError.response = errorDetails;
                customError.greenInvoiceError = error.response.data;

                throw customError;
            } else if (error.request) {
                // The request was made but no response was received
                if (logDetails) {
                    console.error('GreenInvoice API request error:', error.request);
                } else {
                    console.error('GreenInvoice API: no response received');
                }
                const customError = new Error('No response received from GreenInvoice API');
                customError.isAxiosError = true;
                customError.request = error.request;
                throw customError;
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('GreenInvoice API error:', error.message);
                const customError = new Error(`GreenInvoice API Error: ${error.message}`);
                customError.isAxiosError = true;
                customError.originalError = error;
                throw customError;
            }
        }
    }

    async getPaymentForm(paymentData) {
        try {
            const token = await this.getToken();
            if (logDetails) {
                console.log('Getting payment form with data:', paymentData);
            } else {
                console.log('GreenInvoice: requesting payment form');
            }

            const response = await axios.post(
                `${this.baseUrl}/payments/form`,
                paymentData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000
                }
            );

            if (logDetails) {
                console.log(
                    '[GreenInvoice] POST /payments/form response headers:',
                    JSON.stringify(response.headers, null, 2)
                );
                console.log('GreenInvoice payment form response:', response.data);
            } else {
                const d = response.data;
                console.log(
                    'GreenInvoice payment form:',
                    d?.success ? 'success' : 'failed',
                    'errorCode:',
                    d?.errorCode
                );
            }
            return response.data;
        } catch (error) {
            console.error('GreenInvoice payment form creation failed:', error.message || error);

            // Enhanced error handling to capture full GreenInvoice error details
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                };

                if (logDetails) {
                    console.error('GreenInvoice API error response:', errorDetails);
                } else {
                    console.error('GreenInvoice API error HTTP status:', error.response.status);
                }

                // Create a custom error with full details
                const customError = new Error('GreenInvoice API Error');
                customError.isAxiosError = true;
                customError.response = errorDetails;
                customError.greenInvoiceError = error.response.data;

                throw customError;
            } else if (error.request) {
                // The request was made but no response was received
                if (logDetails) {
                    console.error('GreenInvoice API request error:', error.request);
                } else {
                    console.error('GreenInvoice API: no response received');
                }
                const customError = new Error('No response received from GreenInvoice API');
                customError.isAxiosError = true;
                customError.request = error.request;
                throw customError;
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('GreenInvoice API error:', error.message);
                const customError = new Error(`GreenInvoice API Error: ${error.message}`);
                customError.isAxiosError = true;
                customError.originalError = error;
                throw customError;
            }
        }
    }

    async getDocument(documentId) {
        try {
            const token = await this.getToken();
            if (logDetails) {
                console.log('Getting document:', documentId);
            } else {
                console.log('GreenInvoice: fetching document');
            }

            const response = await axios.get(
                `${this.baseUrl}/documents/${documentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000
                }
            );

            if (logDetails) {
                console.log('GreenInvoice document response:', response.data);
            }
            return response.data;
        } catch (error) {
            console.error('GreenInvoice document retrieval failed:', error.message || error);

            // Enhanced error handling to capture full GreenInvoice error details
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const errorDetails = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                };

                if (logDetails) {
                    console.error('GreenInvoice API error response:', errorDetails);
                } else {
                    console.error('GreenInvoice API error HTTP status:', error.response.status);
                }

                // Create a custom error with full details
                const customError = new Error('GreenInvoice API Error');
                customError.isAxiosError = true;
                customError.response = errorDetails;
                customError.greenInvoiceError = error.response.data;

                throw customError;
            } else if (error.request) {
                // The request was made but no response was received
                if (logDetails) {
                    console.error('GreenInvoice API request error:', error.request);
                } else {
                    console.error('GreenInvoice API: no response received');
                }
                const customError = new Error('No response received from GreenInvoice API');
                customError.isAxiosError = true;
                customError.request = error.request;
                throw customError;
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('GreenInvoice API error:', error.message);
                const customError = new Error(`GreenInvoice API Error: ${error.message}`);
                customError.isAxiosError = true;
                customError.originalError = error;
                throw customError;
            }
        }
    }
}

module.exports = GreenInvoiceService;
