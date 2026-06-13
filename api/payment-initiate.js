/**
 * Vercel Serverless Function: Payment Initiate
 * POST /api/payment-initiate
 *
 * Requires: Authorization: Bearer <supabase_jwt>
 * Supports gateways: lmbtech (default) | xentripay
 */

import { verifyAuthUser } from './lib/auth.js';
import {
    getSupabaseAdmin,
    createPaymentRecord,
    generateReferenceId,
    formatLmbPhone,
    resolvePurchasePrice,
    updatePaymentProviderRef,
} from './lib/supabase-payments.js';
import {
    getXentriPayConfig,
    initiateXentriCollection,
    normalizeRwandaMomoPhones,
    resolveXentriPayCollectionAmount,
} from './lib/xentripay.js';
import { getLmbTechCredentials } from './lib/lmbtech.js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const userId = await verifyAuthUser(req);
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const {
            gateway = 'lmbtech',
            paymentMethod,
            email,
            name,
            phone,
            servicePaid,
            courseId,
            bundleId,
        } = req.body;

        if (!email || !name || !paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
        }

        if (!courseId && !bundleId) {
            return res.status(400).json({
                success: false,
                error: 'Missing course or bundle',
            });
        }

        const normalizedGateway = String(gateway).toLowerCase();
        if (!['lmbtech', 'xentripay'].includes(normalizedGateway)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment gateway',
            });
        }

        if (!['momo', 'card'].includes(paymentMethod)) {
            return res.status(400).json({ success: false, error: 'Invalid payment method' });
        }

        if (paymentMethod === 'momo' && !phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required for MoMo payments',
            });
        }

        if (normalizedGateway === 'xentripay' && paymentMethod === 'card' && !phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required for card payments',
            });
        }

        const supabase = getSupabaseAdmin();
        if (!supabase) {
            return res.status(500).json({ success: false, error: 'Payment system unavailable' });
        }

        let pricing;
        try {
            pricing = await resolvePurchasePrice(supabase, { courseId, bundleId });
        } catch (e) {
            return res.status(400).json({ success: false, error: e.message });
        }

        const siteUrl = process.env.SITE_URL || 'https://dataplusacademy.com';
        const referenceId = generateReferenceId();

        if (normalizedGateway === 'xentripay') {
            return handleXentriPayInitiate(res, {
                paymentMethod,
                email,
                name,
                phone,
                studentId: userId,
                courseId,
                bundleId,
                pricing,
                referenceId,
                siteUrl,
                supabase,
            });
        }

        return handleLmbTechInitiate(res, {
            paymentMethod,
            email,
            name,
            phone,
            servicePaid,
            studentId: userId,
            courseId,
            bundleId,
            pricing,
            referenceId,
            siteUrl,
            supabase,
        });
    } catch (error) {
        console.error('[payment-initiate] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Payment initiation failed',
        });
    }
}

async function handleLmbTechInitiate(res, ctx) {
    const credentials = getLmbTechCredentials();
    if (!credentials) {
        return res.status(500).json({ success: false, error: 'LMBTech payment system not configured' });
    }

    const callbackUrl = `${ctx.siteUrl}/api/payment-callback`;

    try {
        await createPaymentRecord(ctx.supabase, {
            p_student_id: ctx.studentId,
            p_course_id: ctx.courseId || null,
            p_bundle_id: ctx.bundleId || null,
            p_amount: ctx.pricing.amount,
            p_currency: ctx.pricing.currency,
            p_reference_id: ctx.referenceId,
            p_payment_method: ctx.paymentMethod === 'momo' ? 'MTN_MOMO_RWA' : 'card',
            p_payer_phone: ctx.phone || null,
            p_payer_email: ctx.email,
            p_payment_provider: 'lmbtech',
            p_provider_ref_id: null,
        });
    } catch {
        return res.status(500).json({ success: false, error: 'Failed to create payment record' });
    }

    const lmbBody = {
        action: 'pay',
        email: ctx.email,
        name: ctx.name,
        amount: ctx.pricing.amount,
        service_paid: ctx.servicePaid || `course_${ctx.courseId || ctx.bundleId}`,
        reference_id: ctx.referenceId,
        callback_url: callbackUrl,
    };

    if (ctx.paymentMethod === 'momo') {
        lmbBody.payment_method = 'MTN_MOMO_RWA';
        lmbBody.payer_phone = formatLmbPhone(ctx.phone);
    } else {
        lmbBody.payment_method = 'card';
        lmbBody.card_redirect_url = 'https://pay.lmbtech.rw/pay/pesapal/iframe.php';
    }

    const response = await fetch('https://pay.lmbtech.rw/pay/config/api.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(lmbBody),
    });

    const data = await response.json();

    const isSuccess = data.status === 'success' || data.status === 'pending';
    const redirectUrl = data.data?.redirect_url || data.redirect_url || null;

    return res.status(200).json({
        success: isSuccess,
        status: isSuccess ? 'awaiting_confirmation' : 'failed',
        gateway: 'lmbtech',
        referenceId: ctx.referenceId,
        redirectUrl,
        message: isSuccess ? 'Payment initiated' : 'Payment failed',
        confirmationMessage:
            ctx.paymentMethod === 'momo'
                ? 'A payment request was sent to your phone. Open MTN MoMo and approve the prompt to confirm your payment.'
                : 'Complete your card payment on the secure Pesapal checkout page.',
    });
}

async function handleXentriPayInitiate(res, ctx) {
    try {
        getXentriPayConfig();
    } catch {
        return res.status(500).json({ success: false, error: 'XentriPay not configured' });
    }

    let phones;
    try {
        phones = normalizeRwandaMomoPhones(ctx.phone);
    } catch (e) {
        return res.status(400).json({ success: false, error: e.message });
    }

    let xentriAmount;
    try {
        xentriAmount = resolveXentriPayCollectionAmount(ctx.pricing);
    } catch (e) {
        return res.status(400).json({ success: false, error: e.message });
    }

    const pmethod = ctx.paymentMethod === 'card' ? 'card' : 'momo';

    // Create pending payment record before calling gateway
    try {
        await createPaymentRecord(ctx.supabase, {
            p_student_id: ctx.studentId,
            p_course_id: ctx.courseId || null,
            p_bundle_id: ctx.bundleId || null,
            p_amount: ctx.pricing.amount,
            p_currency: ctx.pricing.currency,
            p_reference_id: ctx.referenceId,
            p_payment_method: pmethod === 'momo' ? 'MTN_MOMO_RWA' : 'card',
            p_payer_phone: ctx.phone || null,
            p_payer_email: ctx.email,
            p_payment_provider: 'xentripay',
            p_provider_ref_id: null,
        });
    } catch (e) {
        console.error('[payment-initiate] create record failed:', e);
        return res.status(500).json({ success: false, error: 'Could not start payment' });
    }

    const cfg = getXentriPayConfig();
    const returnUrl =
        pmethod === 'card'
            ? `${ctx.siteUrl}/payment/success?ref=${encodeURIComponent(ctx.referenceId)}`
            : undefined;

    const collectionBody = {
        email: ctx.email,
        cname: ctx.name,
        amount: xentriAmount,
        cnumber: phones.cnumber,
        msisdn: phones.msisdn,
        currency: 'RWF',
        pmethod,
        chargesIncluded: cfg.chargesIncluded ? 'true' : 'false',
        ...(returnUrl && { returnUrl, redirectUrl: returnUrl }),
    };

    let response;
    try {
        response = await initiateXentriCollection(collectionBody);
    } catch (e) {
        return res.status(400).json({ success: false, error: e.message });
    }

    const providerRefId = response.refid;
    if (!providerRefId) {
        return res.status(500).json({ success: false, error: 'Payment gateway error' });
    }

    const redirectUrl = response.url?.trim() || null;
    if (pmethod === 'card' && !redirectUrl) {
        return res.status(400).json({
            success: false,
            error: 'Card checkout is not available',
        });
    }

    await updatePaymentProviderRef(ctx.supabase, ctx.referenceId, {
        providerRefId,
        paymentProvider: 'xentripay',
    });

    const confirmationMessage =
        pmethod === 'momo'
            ? 'A payment request was sent to your phone. Open MTN MoMo and approve the prompt to confirm your payment.'
            : 'You will be redirected to complete your card payment. Enter your card details on the secure checkout page.';

    return res.status(200).json({
        success: true,
        status: 'awaiting_confirmation',
        gateway: 'xentripay',
        referenceId: ctx.referenceId,
        redirectUrl,
        message: response.reply || confirmationMessage,
        confirmationMessage,
    });
}
