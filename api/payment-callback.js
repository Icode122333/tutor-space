/**
 * Vercel Serverless Function: Payment Callback
 * 
 * Receives callbacks from LMBTech after payment completes.
 * 
 * For MoMo: POST with JSON body (server-to-server) → returns JSON
 * For Card: GET with query params (user browser redirect from Pesapal) → redirects to /payment/success
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    // For GET: data in query params (card redirect from Pesapal)
    // For POST: data in body (MoMo server callback)
    const payload = req.method === 'GET' ? req.query : req.body;
    const isCardRedirect = req.method === 'GET' && payload.pesapal_merchant_reference;

    console.log('[payment-callback] Received:', req.method, JSON.stringify(payload));

    try {
        let referenceId, transactionId, status;

        // Card callback (Pesapal query/form data)
        if (payload.pesapal_merchant_reference) {
            referenceId = payload.pesapal_merchant_reference;
            transactionId = payload.pesapal_transaction_tracking_id || '';
            const responseData = payload.pesapal_response_data || '';
            status = responseData.toUpperCase() === 'COMPLETED' ? 'success' : 'failed';
            console.log('[payment-callback] Card callback:', { referenceId, transactionId, status });
        }
        // MoMo callback (JSON body)
        else if (payload.reference_id) {
            referenceId = payload.reference_id;
            transactionId = payload.transaction_id || '';
            status = normalizeStatus(payload.status);
            console.log('[payment-callback] MoMo callback:', { referenceId, transactionId, status });
        }
        else {
            console.error('[payment-callback] Unknown callback format:', payload);
            if (req.method === 'GET') {
                return res.redirect(302, '/payment/success?error=invalid_callback');
            }
            return res.status(400).json({ success: false, error: 'Invalid callback format' });
        }

        // Update Supabase payment record + auto-enroll student
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
                    console.log('[payment-callback] Supabase updated:', JSON.stringify(rpcResult));
                }
            } catch (dbError) {
                console.error('[payment-callback] DB error:', dbError);
            }
        }

        // For card payments: redirect user's browser to the success page
        if (isCardRedirect) {
            return res.redirect(302, `/payment/success?ref=${encodeURIComponent(referenceId)}`);
        }

        // For MoMo: return JSON acknowledgment to LMBTech
        return res.status(200).json({
            success: true,
            message: 'Callback processed',
            reference_id: referenceId
        });

    } catch (error) {
        console.error('[payment-callback] Error:', error);
        if (req.method === 'GET') {
            return res.redirect(302, '/payment/success?error=processing_error');
        }
        return res.status(500).json({ success: false, error: error.message });
    }
};

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
