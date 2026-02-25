// Payment service - calls local Vercel serverless functions (same domain, no CORS issues)

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
 * Initiate a payment via the local Vercel serverless function.
 * The function calls LMBTech API with server-side credentials.
 */
export async function initiatePayment(request: PaymentInitiateRequest): Promise<PaymentResult> {
    try {
        console.log('[Payment] Initiating payment:', request.paymentMethod, request.amount);

        const response = await fetch('/api/payment-initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentMethod: request.paymentMethod,
                email: request.email,
                name: request.name,
                amount: request.amount,
                phone: request.phone,
                servicePaid: `${request.type}_${request.itemId}`,
                // These are critical for Supabase payment record + auto-enrollment
                studentId: request.studentId,
                courseId: request.type === 'course' ? request.itemId : undefined,
                bundleId: request.type === 'bundle' ? request.itemId : undefined,
                currency: request.currency,
            }),
        });

        const data = await response.json();
        console.log('[Payment] Response:', data);

        return {
            success: data.success,
            referenceId: data.referenceId,
            redirectUrl: data.redirectUrl,
            data: data,
            error: data.success ? undefined : (data.error || data.message || 'Payment initiation failed'),
        };
    } catch (error: any) {
        console.error('[Payment] Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to connect to payment service',
        };
    }
}

/**
 * Check the status of a payment by reference ID
 */
export async function checkPaymentStatus(referenceId: string): Promise<PaymentStatus> {
    try {
        const response = await fetch(`/api/payment-status?ref=${encodeURIComponent(referenceId)}`);
        const data = await response.json();

        return {
            success: data.success,
            data: {
                status: data.status || 'pending',
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
