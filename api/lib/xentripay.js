/**
 * XentriPay Collections API v2 helpers (ported from Zoea)
 * Docs: https://test.xentripay.com / https://xentripay.com
 */

import { timingSafeEqual } from 'crypto';

export const XENTRIPAY_V2_PATHS = {
    initiateCollection: '/api/collections/initiate',
    collectionStatus: (refid) => `/api/collections/status/${encodeURIComponent(refid)}`,
};

export const XENTRIPAY_V2_BASE_URLS = {
    sandbox: 'https://test.xentripay.com',
    production: 'https://xentripay.com',
};

export function getXentriPayConfig() {
    const apiKey = process.env.XENTRIPAY_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('XentriPay is not configured. Set XENTRIPAY_API_KEY.');
    }

    const sandbox = process.env.XENTRIPAY_SANDBOX !== 'false';
    let baseUrl =
        process.env.XENTRIPAY_BASE_URL?.trim() ||
        (sandbox ? XENTRIPAY_V2_BASE_URLS.sandbox : XENTRIPAY_V2_BASE_URLS.production);

    baseUrl = baseUrl.replace(/\/$/, '');

    if (/\/v1\b|api\.xentripay\.com/i.test(baseUrl)) {
        throw new Error(
            'XENTRIPAY_BASE_URL must be v2 (https://test.xentripay.com or https://xentripay.com)',
        );
    }

    return {
        apiKey,
        baseUrl,
        sandbox,
        chargesIncluded: process.env.XENTRIPAY_CHARGES_INCLUDED !== 'false',
        webhookSecret: process.env.XENTRIPAY_WEBHOOK_SECRET?.trim() || null,
    };
}

/** Rwanda MoMo: cnumber = 10 digits (078…); msisdn = 25078… */
export function normalizeRwandaMomoPhones(input) {
    const digits = input.replace(/\D/g, '');

    let local = digits;
    if (local.startsWith('250') && local.length >= 12) {
        local = '0' + local.slice(3);
    }
    if (local.length === 9 && (local.startsWith('7') || local.startsWith('8'))) {
        local = '0' + local;
    }

    if (!/^0\d{9}$/.test(local)) {
        throw new Error('Phone must be a valid Rwanda number (10 digits, e.g. 0781234567)');
    }

    return {
        cnumber: local,
        msisdn: `250${local.slice(1)}`,
    };
}

export const XENTRIPAY_MIN_AMOUNT_RWF = 100;

/**
 * XentriPay only collects in RWF. Convert USD (and other) prices before initiating.
 */
export function resolveXentriPayCollectionAmount(pricing) {
    const currency = (pricing.currency || 'RWF').toUpperCase();
    let amountRwf;

    if (currency === 'RWF') {
        amountRwf = Math.round(Number(pricing.amount));
    } else if (currency === 'USD') {
        const rate = Number(process.env.USD_TO_RWF_RATE || 1463.5);
        if (!Number.isFinite(rate) || rate <= 0) {
            throw new Error('USD conversion rate is not configured');
        }
        amountRwf = Math.round(Number(pricing.amount) * rate);
    } else {
        throw new Error(`XentriPay does not support ${currency}. Use LMBTech or set price in RWF.`);
    }

    if (!Number.isFinite(amountRwf) || amountRwf < XENTRIPAY_MIN_AMOUNT_RWF) {
        throw new Error(
            `Minimum XentriPay amount is ${XENTRIPAY_MIN_AMOUNT_RWF} RWF` +
                (currency !== 'RWF'
                    ? ` (≈ ${currency} ${pricing.amount} is too low after conversion)`
                    : ''),
        );
    }

    return amountRwf;
}

export function amountToXentriInteger(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Amount must be positive');
    }
    const whole = Math.round(amount);
    if (whole < XENTRIPAY_MIN_AMOUNT_RWF) {
        throw new Error(`Amount must be at least ${XENTRIPAY_MIN_AMOUNT_RWF} RWF`);
    }
    return whole;
}

export function mapXentriCollectionStatus(status) {
    const s = String(status || '').trim().toUpperCase();
    if (['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'COMPLETE', 'PAID'].includes(s)) {
        return 'success';
    }
    if (['FAILED', 'FAILURE', 'CANCELLED', 'CANCELED', 'REVERSED'].includes(s)) {
        return 'failed';
    }
    return 'pending';
}

async function xentriRequest(cfg, method, path, body) {
    const url = `${cfg.baseUrl}${path}`;
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-XENTRIPAY-KEY': cfg.apiKey,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error('Invalid response from XentriPay');
    }

    if (!res.ok) {
        throw new Error(data.message || `XentriPay error (${res.status})`);
    }

    if (data.success === 0) {
        throw new Error(data.reply || 'Payment initiation failed');
    }

    return data;
}

export async function initiateXentriCollection(body) {
    const cfg = getXentriPayConfig();
    return xentriRequest(cfg, 'POST', XENTRIPAY_V2_PATHS.initiateCollection, body);
}

export async function getXentriCollectionStatus(refid) {
    const cfg = getXentriPayConfig();
    return xentriRequest(cfg, 'GET', XENTRIPAY_V2_PATHS.collectionStatus(refid));
}

export function verifyXentriWebhookSecret(provided) {
    const secret = process.env.XENTRIPAY_WEBHOOK_SECRET?.trim();

    // Fail closed in production if webhook secret is not configured
    if (!secret) {
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
            console.error('[xentripay] XENTRIPAY_WEBHOOK_SECRET required in production');
            return false;
        }
        return true;
    }

    if (!provided?.trim()) return false;

    const a = Buffer.from(provided.trim());
    const b = Buffer.from(secret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

const COLLECTION_SUCCESS_EVENTS = new Set([
    'COLLECTION_SUCCESSFUL',
    'PAYMENT_REQUEST_COMPLETED',
    'CHECKOUT_SUCCESSFUL',
    'PAYMENT_LINK_CONTRIBUTION_SUCCESSFUL',
]);

const COLLECTION_FAIL_EVENTS = new Set([
    'COLLECTION_FAILED',
    'PAYMENT_REQUEST_FAILED',
    'PAYMENT_REQUEST_REVERSED',
    'PAYMENT_LINK_CONTRIBUTION_FAILED',
    'PAYMENT_LINK_EXPIRED',
]);

function pickString(...values) {
    for (const v of values) {
        if (v == null) continue;
        const s = String(v).trim();
        if (s) return s;
    }
    return undefined;
}

function eventToStatus(event) {
    const e = event.toUpperCase();
    if (COLLECTION_SUCCESS_EVENTS.has(e)) return 'SUCCESS';
    if (COLLECTION_FAIL_EVENTS.has(e)) return 'FAILED';
    return undefined;
}

export function normalizeXentriWebhookPayload(body) {
    const event = pickString(body.event, body.type, body.eventType, body.event_type);
    const data =
        body.data && typeof body.data === 'object' && !Array.isArray(body.data)
            ? body.data
            : body.payload && typeof body.payload === 'object'
              ? body.payload
              : {};

    const refid = pickString(
        data.refid,
        data.refId,
        data.internalRef,
        data.internal_ref,
        body.refid,
        body.refId,
    );

    const status =
        pickString(data.status, body.status) ||
        (event ? eventToStatus(event) : undefined);

    return { event, refid, status };
}
