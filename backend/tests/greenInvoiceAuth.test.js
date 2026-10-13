const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const GreenInvoiceService = require('../src/services/greenInvoiceService');

const realPost = axios.post;

function httpError(status, data) {
    return Object.assign(new Error(`Request failed with status code ${status}`), {
        response: { status, data }
    });
}

function timeoutError() {
    return Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED' });
}

/** Mock axios.post: `oauth` / `legacy` are either a response object or an Error to throw. */
function mockEndpoints({ oauth, legacy }) {
    const calls = [];
    axios.post = async (url) => {
        const which = url.includes('/idp/v1/oauth/token') ? 'oauth' : 'legacy';
        calls.push(which);
        const outcome = which === 'oauth' ? oauth : legacy;
        if (outcome instanceof Error) throw outcome;
        return outcome;
    };
    return calls;
}

const OAUTH_OK = () => ({
    data: { accessToken: 'oauth-token', tokenType: 'Bearer', expiresAt: Math.floor(Date.now() / 1000) + 3600 }
});
const LEGACY_OK = { headers: { 'x-authorization-bearer': 'legacy-token' }, data: {} };

function makeService() {
    const s = new GreenInvoiceService();
    s.apiKeyId = 'test-id';
    s.apiKeySecret = 'test-secret';
    return s;
}

describe('GreenInvoiceService.getToken (OAuth primary, legacy fallback)', () => {
    let errors;
    let infos;
    const realError = console.error;
    const realLog = console.log;

    beforeEach(() => {
        errors = [];
        infos = [];
        console.error = (...args) => errors.push(args.map(String).join(' '));
        console.log = (...args) => infos.push(args.map(String).join(' '));
    });

    afterEach(() => {
        axios.post = realPost;
        console.error = realError;
        console.log = realLog;
    });

    it('uses OAuth and never calls legacy when OAuth succeeds', async () => {
        const calls = mockEndpoints({ oauth: OAUTH_OK(), legacy: LEGACY_OK });
        const s = makeService();
        assert.equal(await s.getToken(), 'oauth-token');
        assert.deepEqual(calls, ['oauth']);
        assert.equal(s.authMethod, 'oauth');
    });

    for (const [label, err] of [
        ['timeout', timeoutError()],
        ['500', httpError(500, {})],
        ['404', httpError(404, {})],
        ['401 invalid_client', httpError(401, { error: 'invalid_client' })]
    ]) {
        it(`falls back to legacy on OAuth ${label} and logs one info line`, async () => {
            const calls = mockEndpoints({ oauth: err, legacy: LEGACY_OK });
            const s = makeService();
            assert.equal(await s.getToken(), 'legacy-token');
            assert.deepEqual(calls, ['oauth', 'legacy']);
            assert.equal(s.authMethod, 'legacy');
            assert.equal(infos.filter((l) => l.includes('authenticated via legacy')).length, 1);
            assert.equal(errors.length, 0);
        });
    }

    for (const code of ['invalid_grant', 'unauthorized_client']) {
        it(`throws immediately on OAuth 400 ${code} without calling legacy`, async () => {
            const calls = mockEndpoints({ oauth: httpError(400, { error: code, error_description: 'x' }), legacy: LEGACY_OK });
            const s = makeService();
            await assert.rejects(s.getToken(), /Failed to authenticate with GreenInvoice/);
            assert.deepEqual(calls, ['oauth']);
            assert.ok(errors.some((l) => l.includes(code)));
        });
    }

    it('throws one clear error and logs both failures when both methods fail', async () => {
        const calls = mockEndpoints({ oauth: httpError(503, {}), legacy: httpError(404, { errorCode: 404 }) });
        const s = makeService();
        await assert.rejects(s.getToken(), { message: 'Failed to authenticate with GreenInvoice' });
        assert.deepEqual(calls, ['oauth', 'legacy']);
        assert.ok(errors.some((l) => l.includes('(OAuth)')));
        assert.ok(errors.some((l) => l.includes('(legacy)')));
    });

    it('fails on missing credentials before any network request', async () => {
        const calls = mockEndpoints({ oauth: OAUTH_OK(), legacy: LEGACY_OK });
        const s = makeService();
        s.apiKeySecret = '';
        await assert.rejects(s.getToken(), /credentials missing: API key secret not set/);
        assert.deepEqual(calls, []);
    });

    it('reuses the cached token without network requests', async () => {
        const calls = mockEndpoints({ oauth: OAUTH_OK(), legacy: LEGACY_OK });
        const s = makeService();
        await s.getToken();
        await s.getToken();
        assert.deepEqual(calls, ['oauth']);
    });

    it('returns to OAuth-first after a legacy token expires', async () => {
        let calls = mockEndpoints({ oauth: httpError(502, {}), legacy: LEGACY_OK });
        const s = makeService();
        assert.equal(await s.getToken(), 'legacy-token');
        assert.equal(s.authMethod, 'legacy');

        s.tokenExpiry = Date.now() - 1;
        calls = mockEndpoints({ oauth: OAUTH_OK(), legacy: LEGACY_OK });
        assert.equal(await s.getToken(), 'oauth-token');
        assert.deepEqual(calls, ['oauth']);
        assert.equal(s.authMethod, 'oauth');
    });

    it('caches OAuth tokens using the absolute expiresAt (seconds)', async () => {
        mockEndpoints({ oauth: OAUTH_OK(), legacy: LEGACY_OK });
        const s = makeService();
        await s.getToken();
        const minutes = (s.tokenExpiry - Date.now()) / 60000;
        assert.ok(minutes > 54 && minutes <= 55, `expected ~55 min, got ${minutes}`);
    });
});
