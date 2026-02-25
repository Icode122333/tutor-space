/**
 * Vercel Serverless Function: Payment Status
 * GET /api/payment-status?ref=REFERENCE_ID
 * 
 * Checks payment status from LMBTech API.
 */

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const referenceId = req.query.ref;

    if (!referenceId) {
        return res.status(400).json({
            success: false,
            error: 'Missing reference ID (ref query parameter)'
        });
    }

    try {
        const appKey = process.env.LMBTECH_APP_KEY;
        const secretKey = process.env.LMBTECH_SECRET_KEY;

        if (!appKey || !secretKey) {
            return res.status(500).json({
                success: false,
                error: 'Payment system not configured'
            });
        }

        const credentials = Buffer.from(`${appKey}:${secretKey}`).toString('base64');

        // LMBTech status check: GET with reference_id as query param
        const url = `https://pay.lmbtech.rw/pay/config/api.php?reference_id=${encodeURIComponent(referenceId)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('[payment-status] LMBTech response:', JSON.stringify(data));

        // Normalize status
        const paymentStatus = data.data?.status || data.status || 'pending';
        const normalizedStatus = normalizeStatus(paymentStatus);

        return res.status(200).json({
            success: data.status === 'success',
            status: normalizedStatus,
            referenceId,
            data: data.data || data
        });

    } catch (error) {
        console.error('[payment-status] Error:', error);
        return res.status(500).json({
            success: false,
            status: 'pending',
            referenceId,
            error: error.message
        });
    }
};

function normalizeStatus(status) {
    if (typeof status === 'string') {
        const s = status.toLowerCase().trim();
        if (['success', 'completed', 'paid'].includes(s)) return 'success';
        if (['failed', 'fail', 'cancelled', 'declined'].includes(s)) return 'failed';
    }
    return 'pending';
}
