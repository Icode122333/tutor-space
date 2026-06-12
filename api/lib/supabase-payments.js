import { createClient } from '@supabase/supabase-js';

const REFERENCE_ID_PATTERN = /^[A-Za-z0-9_-]{4,128}$/;

export function sanitizeReferenceId(referenceId) {
    const ref = String(referenceId || '').trim();
    if (!REFERENCE_ID_PATTERN.test(ref)) {
        return null;
    }
    return ref;
}

export function getSupabaseAdmin() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) return null;
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function findPaymentByReference(supabase, referenceId) {
    const ref = sanitizeReferenceId(referenceId);
    if (!ref) return null;

    const { data: byReference, error: refError } = await supabase
        .from('payments')
        .select('id, reference_id, provider_ref_id, payment_provider, status, student_id')
        .eq('reference_id', ref)
        .maybeSingle();

    if (refError) {
        console.error('[payments] lookup error:', refError);
        return null;
    }
    if (byReference) return byReference;

    const { data: byProvider, error: provError } = await supabase
        .from('payments')
        .select('id, reference_id, provider_ref_id, payment_provider, status, student_id')
        .eq('provider_ref_id', ref)
        .maybeSingle();

    if (provError) {
        console.error('[payments] provider lookup error:', provError);
        return null;
    }
    return byProvider;
}

export async function resolvePurchasePrice(supabase, { courseId, bundleId }) {
    if (courseId) {
        const { data, error } = await supabase
            .from('courses')
            .select('price, currency, is_free, title')
            .eq('id', courseId)
            .maybeSingle();

        if (error || !data) {
            throw new Error('Course not found');
        }
        if (data.is_free) {
            throw new Error('This course is free — no payment required');
        }

        const amount = Number(data.price);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Course has no valid price');
        }

        return { amount, currency: data.currency || 'RWF', title: data.title };
    }

    if (bundleId) {
        const { data, error } = await supabase
            .from('course_bundles')
            .select('bundle_price, currency, is_active, title')
            .eq('id', bundleId)
            .maybeSingle();

        if (error || !data) {
            throw new Error('Bundle not found');
        }
        if (!data.is_active) {
            throw new Error('Bundle is not available');
        }

        const amount = Number(data.bundle_price);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Bundle has no valid price');
        }

        return { amount, currency: data.currency || 'RWF', title: data.title };
    }

    throw new Error('Missing courseId or bundleId');
}

export async function createPaymentRecord(supabase, params) {
    const { data, error } = await supabase.rpc('create_payment_record', params);
    if (error) throw new Error('Failed to create payment record');
    return data;
}

export async function updatePaymentStatus(supabase, referenceId, status, transactionId, callbackData) {
    const ref = sanitizeReferenceId(referenceId);
    if (!ref) return null;

    const { data, error } = await supabase.rpc('update_payment_status', {
        p_reference_id: ref,
        p_status: status,
        p_transaction_id: transactionId || null,
        p_callback_data: callbackData || null,
    });
    if (error) {
        console.error('[payments] update_payment_status error:', error);
        return null;
    }
    return data;
}

export function generateReferenceId() {
    const date = new Date();
    const dateStr =
        date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `COURSE-${dateStr}-${random}`;
}

export function formatLmbPhone(phone) {
    if (!phone) return phone;
    const clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('+250') && clean.length === 13) return clean;
    if (clean.startsWith('250') && clean.length === 12) return `+${clean}`;
    if (clean.startsWith('0') && clean.length === 10) return `+250${clean.slice(1)}`;
    if (/^\d{9}$/.test(clean) && clean.startsWith('7')) return `+250${clean}`;
    return clean;
}
