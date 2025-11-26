import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Award, CheckCircle, Search, FileSpreadsheet, ExternalLink } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from "xlsx";

interface CourseCompletion {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  teacher_name: string;
  completed: boolean;
  completion_date: string;
  final_grade: string | null;
  progress_percentage: number;
  certificate_id: string | null;
  certificate_status: string | null;
  certificate_url: string | null;
  certificate_approved_at: string | null;
}

interface Course { id: string; title: string; }

export default function AdminCertificates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<CourseCompletion[]>([]);
  const [filteredCompletions, setFilteredCompletions] = useState<CourseCompletion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processing, setProcessing] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState<CourseCompletion | null>(null);
  const [certificateUrl, setCertificateUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { checkAdminAccess(); }, []);
  useEffect(() => { filterCompletions(); }, [completions, searchQuery, selectedCourse, statusFilter]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") { toast.error("Access denied"); navigate("/"); return; }
      await fetchData();
    } catch (error) { console.error("Error:", error); navigate("/"); }
  };

  const fetchData = async () => {
    try {
      const { data: completionsData, error: completionsError } = await supabase.rpc("get_course_completions");
      if (completionsError) throw completionsError;
      setCompletions(completionsData || []);
      const { data: coursesData } = await supabase.from("courses").select("id, title").order("title");
      setCourses(coursesData || []);
    } catch (error) { console.error("Error:", error); toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  const filterCompletions = () => {
    let filtered = completions;
    if (searchQuery) filtered = filtered.filter((c) => c.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) || c.course_title?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCourse !== "all") filtered = filtered.filter((c) => c.course_id === selectedCourse);
    if (statusFilter === "pending") filtered = filtered.filter((c) => !c.certificate_status || c.certificate_status === "pending");
    else if (statusFilter === "approved") filtered = filtered.filter((c) => c.certificate_status === "approved");
    setFilteredCompletions(filtered);
  };

  const handleApproveClick = (completion: CourseCompletion) => { setSelectedCompletion(completion); setCertificateUrl(completion.certificate_url || ""); setNotes(""); setShowApproveDialog(true); };

  const handleApproveCertificate = async () => {
    if (!selectedCompletion || !certificateUrl.trim()) { toast.error("Please provide a certificate URL"); return; }
    setProcessing(true);
    try {
      const { error } = await supabase.rpc("approve_certificate", { p_student_id: selectedCompletion.student_id, p_course_id: selectedCompletion.course_id, p_certificate_url: certificateUrl.trim(), p_notes: notes.trim() || null });
      if (error) throw error;
      toast.success("Certificate approved!"); setShowApproveDialog(false); setSelectedCompletion(null); setCertificateUrl(""); setNotes(""); fetchData();
    } catch (error: any) { toast.error(error.message || "Failed"); } finally { setProcessing(false); }
  };

  const exportToExcel = () => {
    const data = filteredCompletions.map((c) => ({ "Student": c.student_name, "Email": c.student_email, "Course": c.course_title, "Date": c.completion_date ? new Date(c.completion_date).toLocaleDateString() : "", "Status": c.certificate_status || "Pending" }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data"); XLSX.writeFile(wb, "completions.xlsx"); toast.success("Exported!");
  };

  if (loading) return <LoadingSpinner />;
  const pendingCount = completions.filter((c) => !c.certificate_status || c.certificate_status === "pending").length;
  const approvedCount = completions.filter((c) => c.certificate_status === "approved").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col p-4">
          <header className="bg-white rounded-2xl shadow mb-6">
            <div className="bg-gradient-to-r from-[#006d2c] to-[#008000] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-white" />
                  <div className="text-white"><h1 className="text-2xl font-bold">Certificate Management</h1><p className="text-sm opacity-90">Approve student certificates</p></div>
                </div>
                <Button onClick={exportToExcel} className="bg-white text-[#006d2c]" disabled={!filteredCompletions.length}><FileSpreadsheet className="h-4 w-4 mr-2" />Export</Button>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-gray-600">Total</p><p className="text-3xl font-bold text-blue-600">{completions.length}</p></div><Award className="h-10 w-10 text-blue-500" /></CardContent></Card>
                <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-gray-600">Pending</p><p className="text-3xl font-bold text-orange-600">{pendingCount}</p></div><Award className="h-10 w-10 text-orange-500" /></CardContent></Card>
                <Card><CardContent className="p-6 flex justify-between items-center"><div><p className="text-sm text-gray-600">Approved</p><p className="text-3xl font-bold text-green-600">{approvedCount}</p></div><CheckCircle className="h-10 w-10 text-green-500" /></CardContent></Card>
              </div>
              <Card><CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}><SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem></SelectContent></Select>
                </div>
              </CardContent></Card>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Link</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {!filteredCompletions.length ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No completions</TableCell></TableRow> : filteredCompletions.map((c) => (
                      <TableRow key={c.enrollment_id}>
                        <TableCell><p className="font-medium">{c.student_name}</p><p className="text-sm text-gray-500">{c.student_email}</p></TableCell>
                        <TableCell><p className="font-medium">{c.course_title}</p></TableCell>
                        <TableCell>{c.completion_date ? new Date(c.completion_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell><Badge className={c.certificate_status === "approved" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>{c.certificate_status || "Pending"}</Badge></TableCell>
                        <TableCell>{c.certificate_url ? <a href={c.certificate_url} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1"><ExternalLink className="h-3 w-3" />View</a> : "-"}</TableCell>
                        <TableCell><Button size="sm" onClick={() => handleApproveClick(c)} className="bg-[#006d2c]"><CheckCircle className="h-4 w-4 mr-1" />{c.certificate_status === "approved" ? "Update" : "Approve"}</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </div>
          </main>
        </div>
      </div>
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Certificate</DialogTitle><DialogDescription>For {selectedCompletion?.student_name}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Course</Label><Input value={selectedCompletion?.course_title || ""} disabled /></div>
            <div><Label>Certificate URL *</Label><Input placeholder="https://..." value={certificateUrl} onChange={(e) => setCertificateUrl(e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button><Button onClick={handleApproveCertificate} disabled={processing || !certificateUrl.trim()} className="bg-[#006d2c]">{processing ? "..." : "Approve"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
