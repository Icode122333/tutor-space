// Payment service utility for calling the LMBTech payment gateway
// The deployed gateway (server.js on Vercel) uses /api/payment/momo and /api/payment/card
const PAYMENT_GATEWAY_URL = (
    import.meta.env.VITE_PAYMENT_GATEWAY_URL || 'https://paymentgateway-sigma.vercel.app'
).replace(/\/$/, ''); // strip trailing slash

export interface PaymentInitiateRequest {
    type: 'course' | 'bundle';
    itemId: string;
    studentId: string;
    email: string;
    name: string;
    phone?: string;
    amount: number;
    currency: string;
    paymentMethod: 'momo' | 'card';
}

export interface PaymentResult {
    success: boolean;
    referenceId?: string;
    redirectUrl?: string;
    data?: any;
    error?: string;
}

export interface PaymentStatus {
    success: boolean;
    data?: {
        status: 'pending' | 'success' | 'failed';
        reference_id: string;
        transaction_id?: string;
        amount?: string;
    };
}

/**
 * Initiate a payment via the LMBTech payment gateway.
 * Routes to /api/payment/momo or /api/payment/card based on paymentMethod.
 */
export async function initiatePayment(request: PaymentInitiateRequest): Promise<PaymentResult> {
    try {
        const endpoint = request.paymentMethod === 'momo'
            ? '/api/payment/momo'
            : '/api/payment/card';

        // Build the request body matching server.js expected format
        const body: Record<string, any> = {
            email: request.email,
            name: request.name,
            amount: request.amount,
            servicePaid: `${request.type}_${request.itemId}`,
        };

        if (request.paymentMethod === 'momo') {
            body.payerPhone = request.phone;
        }

        console.log(`[Payment] Calling ${PAYMENT_GATEWAY_URL}${endpoint}`, body);

        const response = await fetch(`${PAYMENT_GATEWAY_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        console.log('[Payment] Response:', data);

        // server.js apiResponse format: { success, status, message, referenceId, redirectUrl, data }
        return {
            success: data.success,
            referenceId: data.referenceId || data.data?.reference_id,
            redirectUrl: data.redirectUrl || data.data?.redirect_url,
            data: data,
            error: data.success ? undefined : (data.message || 'Payment initiation failed'),
        };
    } catch (error: any) {
        console.error('[Payment] Fetch error:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch',
        };
    }
}

/**
 * Check the status of a payment by reference ID
 */
export async function checkPaymentStatus(referenceId: string): Promise<PaymentStatus> {
    try {
        const response = await fetch(
            `${PAYMENT_GATEWAY_URL}/api/payment/status/${referenceId}`
        );
        const data = await response.json();

        // server.js status response: { success, status, message, referenceId, data, paymentOutcome, isSuccessful }
        const paymentOutcome = data.paymentOutcome || data.data?.status || 'pending';

        return {
            success: data.success,
            data: {
                status: paymentOutcome === 'success' ? 'success'
                    : paymentOutcome === 'failed' ? 'failed'
                        : 'pending',
                reference_id: referenceId,
                transaction_id: data.data?.transaction_id,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            data: {
                status: 'pending',
                reference_id: referenceId,
            },
        };
    }
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currency: string = 'RWF'): string {
    if (amount === 0) return 'Free';

    if (currency === 'USD') {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    return `RWF ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
