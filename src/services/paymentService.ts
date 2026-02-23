// Payment service utility for calling the LMBTech payment gateway
const PAYMENT_GATEWAY_URL = import.meta.env.VITE_PAYMENT_GATEWAY_URL || 'http://localhost:3000';

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
 * Initiate a payment via the LMBTech payment gateway
 */
export async function initiatePayment(request: PaymentInitiateRequest): Promise<PaymentResult> {
    try {
        const response = await fetch(`${PAYMENT_GATEWAY_URL}/api/payment/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        const data = await response.json();
        return data;
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Payment initiation failed',
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
        return data;
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
