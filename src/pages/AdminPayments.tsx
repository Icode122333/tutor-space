import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DollarSign, Search, Filter, CheckCircle, XCircle, Clock, CreditCard, Smartphone } from "lucide-react";
import { formatPrice } from "@/services/paymentService";

interface Payment {
    id: string;
    student_id: string;
    course_id: string | null;
    bundle_id: string | null;
    amount: number;
    currency: string;
    payment_method: string | null;
    reference_id: string;
    transaction_id: string | null;
    status: string;
    payer_phone: string | null;
    payer_email: string | null;
    created_at: string;
    student_name?: string;
    course_title?: string;
    bundle_title?: string;
}

export default function AdminPayments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [stats, setStats] = useState({ total: 0, success: 0, pending: 0, failed: 0, revenue: 0 });

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("payments")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Enrich with student names, course titles
            const enriched: Payment[] = [];
            for (const payment of data || []) {
                let student_name = payment.payer_email || "Unknown";
                let course_title = null;
                let bundle_title = null;

                // Get student name
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name")
                    .eq("id", payment.student_id)
                    .single();
                if (profile) student_name = profile.full_name || student_name;

                // Get course/bundle title
                if (payment.course_id) {
                    const { data: course } = await supabase
                        .from("courses")
                        .select("title")
                        .eq("id", payment.course_id)
                        .single();
                    if (course) course_title = course.title;
                }
                if (payment.bundle_id) {
                    const { data: bundle } = await supabase
                        .from("course_bundles")
                        .select("title")
                        .eq("id", payment.bundle_id)
                        .single();
                    if (bundle) bundle_title = bundle.title;
                }

                enriched.push({ ...payment, student_name, course_title, bundle_title });
            }

            setPayments(enriched);

            // Calculate stats
            const successPayments = enriched.filter((p) => p.status === "success");
            setStats({
                total: enriched.length,
                success: successPayments.length,
                pending: enriched.filter((p) => p.status === "pending").length,
                failed: enriched.filter((p) => p.status === "failed").length,
                revenue: successPayments.reduce((sum, p) => sum + p.amount, 0),
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter((p) => {
        const matchesFilter = filter === "all" || p.status === filter;
        const matchesSearch =
            search === "" ||
            p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.course_title?.toLowerCase().includes(search.toLowerCase()) ||
            p.bundle_title?.toLowerCase().includes(search.toLowerCase()) ||
            p.reference_id.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "success":
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
            case "failed":
                return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getMethodIcon = (method: string | null) => {
        if (method === "MTN_MOMO_RWA") return <Smartphone className="h-4 w-4 text-yellow-600" />;
        if (method === "card") return <CreditCard className="h-4 w-4 text-blue-600" />;
        return null;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Payments</h1>
                    <p className="text-gray-500">Track all course and bundle purchases</p>
                </div>
                <Button onClick={fetchPayments} variant="outline" size="sm">
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-700">{formatPrice(stats.revenue, "RWF")}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Successful</p>
                                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-400 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Failed</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-400 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by student, course, or reference ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Course / Bundle</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        Loading payments...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        No payments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{payment.student_name}</p>
                                                <p className="text-xs text-gray-400">{payment.payer_email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {payment.bundle_id ? (
                                                    <Badge variant="outline" className="text-xs">Bundle</Badge>
                                                ) : null}
                                                <span className="text-sm truncate max-w-[200px]">
                                                    {payment.course_title || payment.bundle_title || "—"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold text-sm">
                                            {formatPrice(payment.amount, payment.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                {getMethodIcon(payment.payment_method)}
                                                <span className="text-xs text-gray-500">
                                                    {payment.payment_method === "MTN_MOMO_RWA" ? "MoMo" : payment.payment_method || "—"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                {payment.reference_id}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">
                                            {new Date(payment.created_at).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
