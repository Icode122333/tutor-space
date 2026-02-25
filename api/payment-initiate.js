/**
 * Vercel Serverless Function: Payment Initiate
 * POST /api/payment-initiate
 * 
 * 1. Creates a payment record in Supabase (with student_id, course_id)
 * 2. Calls LMBTech API with server-side credentials
 * 3. Returns reference ID and redirect URL
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const {
            paymentMethod,
            email,
            name,
            amount,
            phone,
            servicePaid,
            studentId,
            courseId,
            bundleId,
            currency,
        } = req.body;

        // Validate required fields
        if (!email || !name || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: email, name, amount, paymentMethod'
            });
        }

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Missing studentId - user must be logged in'
            });
        }

        if (!courseId && !bundleId) {
            return res.status(400).json({
                success: false,
                error: 'Missing courseId or bundleId'
            });
        }

        if (paymentMethod === 'momo' && !phone) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required for MoMo payments'
            });
        }

        // Get credentials from environment
        const appKey = process.env.LMBTECH_APP_KEY;
        const secretKey = process.env.LMBTECH_SECRET_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!appKey || !secretKey) {
            console.error('[payment-initiate] LMBTECH credentials not configured');
            return res.status(500).json({ success: false, error: 'Payment system not configured' });
        }

        // Build auth header (Base64 of appKey:secretKey)
        const credentials = Buffer.from(`${appKey}:${secretKey}`).toString('base64');

        // Generate unique reference ID
        const date = new Date();
        const dateStr = date.getFullYear()
            + String(date.getMonth() + 1).padStart(2, '0')
            + String(date.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const referenceId = `COURSE-${dateStr}-${random}`;

        // Callback URL
        const siteUrl = process.env.SITE_URL || 'https://dataplusacademy.com';
        const callbackUrl = `${siteUrl}/api/payment-callback`;

        // ============================================================
        // STEP 1: Create payment record in Supabase FIRST
        // The callback handler looks up by reference_id to auto-enroll
        // ============================================================
        if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            const { data: paymentId, error: createError } = await supabase.rpc('create_payment_record', {
                p_student_id: studentId,
                p_course_id: courseId || null,
                p_bundle_id: bundleId || null,
                p_amount: Number(amount),
                p_currency: currency || 'RWF',
                p_reference_id: referenceId,
                p_payment_method: paymentMethod === 'momo' ? 'MTN_MOMO_RWA' : 'card',
                p_payer_phone: phone || null,
                p_payer_email: email
            });

            if (createError) {
                console.error('[payment-initiate] Failed to create payment record:', createError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create payment record: ' + createError.message
                });
            }
            console.log('[payment-initiate] Payment record created:', paymentId, 'ref:', referenceId);
        } else {
            console.warn('[payment-initiate] Supabase not configured, skipping payment record');
        }

        // ============================================================
        // STEP 2: Call LMBTech API
        // ============================================================
        const lmbBody = {
            action: 'pay',
            email,
            name,
            amount: Number(amount),
            service_paid: servicePaid || `course_${courseId || bundleId}`,
            reference_id: referenceId,
            callback_url: callbackUrl,
        };

        if (paymentMethod === 'momo') {
            lmbBody.payment_method = 'MTN_MOMO_RWA';
            lmbBody.payer_phone = formatPhone(phone);
        } else if (paymentMethod === 'card') {
            lmbBody.payment_method = 'card';
            lmbBody.card_redirect_url = `${siteUrl}/api/payment-callback`;
        }

        console.log('[payment-initiate] Calling LMBTech API:', JSON.stringify(lmbBody));

        const response = await fetch('https://pay.lmbtech.rw/pay/config/api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify(lmbBody)
        });

        const data = await response.json();
        console.log('[payment-initiate] LMBTech response:', JSON.stringify(data));

        // Parse response
        const isSuccess = data.status === 'success' || data.status === 'pending';
        const redirectUrl = data.data?.redirect_url || data.redirect_url || null;

        return res.status(200).json({
            success: isSuccess,
            referenceId,
            redirectUrl,
            message: data.message || (isSuccess ? 'Payment initiated' : 'Payment failed'),
            data: data.data || data
        });

    } catch (error) {
        console.error('[payment-initiate] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

function formatPhone(phone) {
    if (!phone) return phone;
    const clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('+250') && clean.length === 13) return clean;
    if (clean.startsWith('250') && clean.length === 12) return `+${clean}`;
    if (clean.startsWith('0') && clean.length === 10) return `+250${clean.slice(1)}`;
    if (/^\d{9}$/.test(clean) && clean.startsWith('7')) return `+250${clean}`;
    return clean;
}
