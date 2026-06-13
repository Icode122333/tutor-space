// Payment service - calls Vercel serverless functions (same domain, no CORS issues)

import { supabase } from '@/integrations/supabase/client';

export type PaymentGateway = 'lmbtech' | 'xentripay';
export type PaymentMethod = 'momo' | 'card';

export interface PaymentInitiateRequest {
    type: 'course' | 'bundle';
    itemId: string;
    email: string;
    name: string;
    phone?: string;
    paymentMethod: PaymentMethod;
    gateway: PaymentGateway;
    couponCode?: string;
}

export interface CouponValidationResult {
    success: boolean;
    valid?: boolean;
    code?: string;
    discountType?: 'percent' | 'fixed';
    discountValue?: number;
    originalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    currency?: string;
    error?: string;
}

export interface PaymentResult {
    success: boolean;
    status?: 'awaiting_confirmation' | 'failed';
    gateway?: PaymentGateway;
    referenceId?: string;
    redirectUrl?: string;
    message?: string;
    confirmationMessage?: string;
    error?: string;
}

export interface PaymentStatus {
    success: boolean;
    data?: {
        status: 'pending' | 'success' | 'failed';
        reference_id: string;
        transaction_id?: string;
    };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
}

/**
 * Initiate a payment via serverless function (LMBTech or XentriPay).
 * Price is resolved server-side from the database — not from the client.
 */
export async function initiatePayment(request: PaymentInitiateRequest): Promise<PaymentResult> {
    try {
        const headers = await getAuthHeaders();
        if (!headers['Authorization']) {
            return { success: false, error: 'You must be logged in to pay' };
        }

        const response = await fetch('/api/payment-initiate', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                gateway: request.gateway,
                paymentMethod: request.paymentMethod,
                email: request.email,
                name: request.name,
                phone: request.phone,
                servicePaid: `${request.type}_${request.itemId}`,
                courseId: request.type === 'course' ? request.itemId : undefined,
                bundleId: request.type === 'bundle' ? request.itemId : undefined,
                couponCode: request.couponCode?.trim() || undefined,
            }),
        });

        const data = await response.json();

        if (response.status === 401) {
            return { success: false, error: 'Session expired — please sign in again' };
        }

        return {
            success: data.success,
            status: data.status,
            gateway: data.gateway,
            referenceId: data.referenceId,
            redirectUrl: data.redirectUrl,
            message: data.message,
            confirmationMessage: data.confirmationMessage || data.message,
            error: data.success ? undefined : (data.error || 'Payment initiation failed'),
        };
    } catch (error: any) {
        console.error('[Payment] Error:', error);
        return {
            success: false,
            error: 'Failed to connect to payment service',
        };
    }
}

/**
 * Preview a coupon discount before checkout.
 */
export async function validateCoupon(params: {
    code: string;
    type: 'course' | 'bundle';
    itemId: string;
}): Promise<CouponValidationResult> {
    try {
        const headers = await getAuthHeaders();
        if (!headers['Authorization']) {
            return { success: false, error: 'You must be logged in' };
        }

        const response = await fetch('/api/coupon-validate', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                code: params.code.trim(),
                courseId: params.type === 'course' ? params.itemId : undefined,
                bundleId: params.type === 'bundle' ? params.itemId : undefined,
            }),
        });

        const data = await response.json();

        if (response.status === 401) {
            return { success: false, error: 'Session expired — please sign in again' };
        }

        if (!data.success) {
            return { success: false, error: data.error || 'Invalid coupon' };
        }

        return {
            success: true,
            valid: true,
            code: data.code,
            discountType: data.discountType,
            discountValue: data.discountValue,
            originalAmount: data.originalAmount,
            discountAmount: data.discountAmount,
            finalAmount: data.finalAmount,
            currency: data.currency,
        };
    } catch (error) {
        console.error('[Coupon] Error:', error);
        return { success: false, error: 'Failed to validate coupon' };
    }
}

/**
 * Check the status of a payment by reference ID.
 */
export async function checkPaymentStatus(
    referenceId: string,
    gateway?: PaymentGateway,
): Promise<PaymentStatus> {
    try {
        const params = new URLSearchParams({ ref: referenceId });
        if (gateway) params.set('gateway', gateway);

        const response = await fetch(`/api/payment-status?${params.toString()}`);
        const data = await response.json();

        return {
            success: data.success,
            data: {
                status: data.status || 'pending',
                reference_id: referenceId,
            },
        };
    } catch {
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
