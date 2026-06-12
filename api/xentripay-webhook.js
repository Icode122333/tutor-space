/**
 * Vercel Serverless Function: XentriPay Webhook
 * POST /api/xentripay-webhook
 */

import {
    getSupabaseAdmin,
    updatePaymentStatus,
} from './lib/supabase-payments.js';
import {
    verifyXentriWebhookSecret,
    normalizeXentriWebhookPayload,
    mapXentriCollectionStatus,
    getXentriCollectionStatus,
} from './lib/xentripay.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const headerSecret = req.headers['x-xentripay-webhook-secret'];
    const authHeader = req.headers['authorization'];
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const secret = headerSecret || bearer;

    if (!verifyXentriWebhookSecret(secret)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = req.body || {};
    const normalized = normalizeXentriWebhookPayload(payload);

    if (!normalized.refid || !normalized.status) {
        return res.status(200).json({ ok: true, handled: 'skipped' });
    }

    const mapped = mapXentriCollectionStatus(normalized.status);
    if (mapped === 'pending') {
        return res.status(200).json({ ok: true, handled: 'pending' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
        return res.status(500).json({ success: false, error: 'Database unavailable' });
    }

    const { data: payment, error } = await supabase
        .from('payments')
        .select('reference_id, status, payment_provider')
        .eq('provider_ref_id', normalized.refid)
        .maybeSingle();

    let targetPayment = payment;

    if (!targetPayment && !error) {
        const { data: byRef } = await supabase
            .from('payments')
            .select('reference_id, status, payment_provider')
            .eq('reference_id', normalized.refid)
            .maybeSingle();
        targetPayment = byRef;
    }

    if (error || !targetPayment) {
        return res.status(200).json({ ok: true, handled: 'no_payment' });
    }

    if (targetPayment.status === 'success') {
        return res.status(200).json({ ok: true, handled: 'already_processed' });
    }

    // Double-check with XentriPay API before enrolling (defense in depth)
    let verifiedStatus = mapped;
    try {
        const statusRes = await getXentriCollectionStatus(normalized.refid);
        verifiedStatus = mapXentriCollectionStatus(statusRes.status);
    } catch (e) {
        console.error('[xentripay-webhook] status verification failed:', e.message);
        return res.status(200).json({ ok: true, handled: 'verification_failed' });
    }

    if (verifiedStatus === 'pending') {
        return res.status(200).json({ ok: true, handled: 'pending' });
    }

    const dbStatus = verifiedStatus === 'success' ? 'success' : 'failed';
    await updatePaymentStatus(supabase, targetPayment.reference_id, dbStatus, normalized.refid, payload);

    return res.status(200).json({ ok: true, handled: 'updated' });
}
