import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CreditCard, Loader2, CheckCircle, XCircle, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initiatePayment, checkPaymentStatus, formatPrice } from "@/services/paymentService";

interface PurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "course" | "bundle";
    item: {
        id: string;
        title: string;
        price: number;
        currency: string;
        thumbnail_url?: string;
    };
    onSuccess?: () => void;
}

type PaymentStep = "method" | "details" | "processing" | "success" | "failed";

export function PurchaseDialog({ open, onOpenChange, type, item, onSuccess }: PurchaseDialogProps) {
    const { user, profile } = useAuth();
    const [step, setStep] = useState<PaymentStep>("method");
    const [paymentMethod, setPaymentMethod] = useState<"momo" | "card">("momo");
    const [phone, setPhone] = useState("");
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setStep("method");
            setPaymentMethod("momo");
            setPhone("");
            setReferenceId(null);
            setError(null);
            setPollCount(0);
        }
    }, [open]);

    // Poll payment status when processing
    useEffect(() => {
        if (step !== "processing" || !referenceId) return;

        const interval = setInterval(async () => {
            const status = await checkPaymentStatus(referenceId);

            if (status.data?.status === "success") {
                setStep("success");
                clearInterval(interval);
            } else if (status.data?.status === "failed") {
                setStep("failed");
                setError("Payment was not completed. Please try again.");
                clearInterval(interval);
            }

            setPollCount((prev) => {
                if (prev >= 60) { // Stop polling after 5 minutes (60 × 5s)
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [step, referenceId]);

    const handleInitiatePayment = async () => {
        if (!user) return;

        if (paymentMethod === "momo" && !phone) {
            setError("Please enter your phone number");
            return;
        }

        setError(null);
        setStep("processing");

        const result = await initiatePayment({
            type,
            itemId: item.id,
            studentId: user.id,
            email: user.email || "",
            name: profile?.full_name || user.email || "Student",
            phone: paymentMethod === "momo" ? phone : undefined,
            amount: item.price,
            currency: item.currency,
            paymentMethod,
        });

        if (result.success && result.referenceId) {
            setReferenceId(result.referenceId);

            // For card payments, redirect to the Pesapal checkout page
            if (paymentMethod === "card") {
                const redirectUrl = result.redirectUrl || result.data?.redirectUrl || result.data?.data?.redirect_url;
                if (redirectUrl) {
                    // Use location.href (not window.open) to avoid popup blockers
                    window.location.href = redirectUrl;
                    return; // page is navigating away
                }
            }
        } else {
            setStep("failed");
            setError(result.error || "Failed to initiate payment");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {step === "success" ? "Payment Successful!" : step === "failed" ? "Payment Failed" : `Purchase ${type === "bundle" ? "Bundle" : "Course"}`}
                    </DialogTitle>
                    <DialogDescription>
                        {item.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Price display */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <span className="text-xl font-bold text-green-700">
                            {formatPrice(item.price, item.currency)}
                        </span>
                    </div>

                    {/* Step 1: Choose payment method */}
                    {step === "method" && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Select Payment Method</Label>

                            <button
                                onClick={() => setPaymentMethod("momo")}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${paymentMethod === "momo"
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "momo" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold">MTN Mobile Money</p>
                                    <p className="text-xs text-gray-500">Pay with your MoMo account</p>
                                </div>
                                {paymentMethod === "momo" && (
                                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                                )}
                            </button>

                            <button
                                onClick={() => setPaymentMethod("card")}
                                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${paymentMethod === "card"
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === "card" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold">Card Payment</p>
                                    <p className="text-xs text-gray-500">Visa, Mastercard via Pesapal</p>
                                </div>
                                {paymentMethod === "card" && (
                                    <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                                )}
                            </button>

                            {paymentMethod === "momo" && (
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="0788123456"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Any format works: 0788..., +250788..., etc.</p>
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <XCircle className="h-4 w-4" /> {error}
                                </p>
                            )}

                            <Button
                                className="w-full bg-[#006d2c] hover:bg-[#005523] text-white h-12 text-base"
                                onClick={handleInitiatePayment}
                            >
                                Pay {formatPrice(item.price, item.currency)}
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Processing */}
                    {step === "processing" && (
                        <div className="text-center py-6 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
                            {paymentMethod === "momo" ? (
                                <>
                                    <p className="font-semibold text-lg">Check your phone!</p>
                                    <p className="text-gray-500 text-sm">
                                        A payment prompt has been sent to your phone.<br />
                                        Enter your MoMo PIN to complete the payment.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-lg">Complete payment in the new tab</p>
                                    <p className="text-gray-500 text-sm">
                                        Enter your card details on the secure Pesapal page.<br />
                                        This dialog will update automatically.
                                    </p>
                                </>
                            )}
                            {referenceId && (
                                <Badge variant="outline" className="text-xs">
                                    Ref: {referenceId}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === "success" && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <p className="font-semibold text-lg">Payment Complete!</p>
                            <p className="text-gray-500 text-sm">
                                You have been enrolled in the {type}. You can now access all course content.
                            </p>
                            <Button
                                className="w-full bg-[#006d2c] hover:bg-[#005523] text-white"
                                onClick={() => {
                                    onOpenChange(false);
                                    onSuccess?.();
                                }}
                            >
                                Start Learning
                            </Button>
                        </div>
                    )}

                    {/* Step 4: Failed */}
                    {step === "failed" && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                                <XCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <p className="font-semibold text-lg">Payment Failed</p>
                            <p className="text-gray-500 text-sm">{error || "Something went wrong. Please try again."}</p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-[#006d2c] hover:bg-[#005523] text-white"
                                    onClick={() => {
                                        setStep("method");
                                        setError(null);
                                    }}
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
