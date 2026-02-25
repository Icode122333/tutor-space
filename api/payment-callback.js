/**
 * Vercel Serverless Function: Payment Callback
 * POST /api/payment-callback
 * 
 * Receives callbacks from LMBTech after payment completes.
 * Handles both MoMo (JSON) and Card (form data) callbacks.
 * Updates Supabase payment record and auto-enrolls students.
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Accept both GET (card redirects) and POST (callbacks)
    const payload = req.method === 'GET' ? req.query : req.body;

    console.log('[payment-callback] Received:', req.method, JSON.stringify(payload));

    try {
        let referenceId, transactionId, status;

        // Card callback (Pesapal form data)
        if (payload.pesapal_merchant_reference) {
            referenceId = payload.pesapal_merchant_reference;
            transactionId = payload.pesapal_transaction_tracking_id || '';
            const responseData = payload.pesapal_response_data || '';
            status = responseData.toUpperCase() === 'COMPLETED' ? 'success' : 'failed';
            console.log('[payment-callback] Card callback:', { referenceId, transactionId, status });
        }
        // MoMo callback (JSON)
        else if (payload.reference_id && payload.transaction_id) {
            referenceId = payload.reference_id;
            transactionId = payload.transaction_id;
            status = normalizeStatus(payload.status);
            console.log('[payment-callback] MoMo callback:', { referenceId, transactionId, status });
        }
        else {
            console.error('[payment-callback] Unknown callback format:', payload);
            return res.status(400).json({ success: false, error: 'Invalid callback format' });
        }

        // Update Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            try {
                const { data: rpcResult, error: rpcError } = await supabase.rpc('update_payment_status', {
                    p_reference_id: referenceId,
                    p_status: status,
                    p_transaction_id: transactionId,
                    p_callback_data: payload
                });

                if (rpcError) {
                    console.error('[payment-callback] Supabase RPC error:', rpcError);
                } else {
                    console.log('[payment-callback] Supabase updated:', rpcResult);
                    if (status === 'success') {
                        console.log('[payment-callback] Student auto-enrolled!');
                    }
                }
            } catch (dbError) {
                console.error('[payment-callback] DB error:', dbError);
            }
        } else {
            console.warn('[payment-callback] Supabase not configured, skipping DB update');
        }

        // Return success acknowledgment to LMBTech
        return res.status(200).json({
            success: true,
            message: 'Callback processed',
            reference_id: referenceId
        });

    } catch (error) {
        console.error('[payment-callback] Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

function normalizeStatus(status) {
    if (typeof status === 'string') {
        const s = status.toLowerCase().trim();
        if (['success', 'completed', 'paid', 'ok'].includes(s)) return 'success';
        if (['failed', 'fail', 'cancelled', 'declined', 'error'].includes(s)) return 'failed';
    }
    if (status === true || status === 1) return 'success';
    if (status === false || status === 0) return 'failed';
    return 'pending';
}
