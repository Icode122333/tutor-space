import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AssignmentUploadWidgetProps {
  studentId: string;
  capstoneProjectId: string;
  onUploaded?: () => void;
}

export default function AssignmentUploadWidget({ studentId, capstoneProjectId, onUploaded }: AssignmentUploadWidgetProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "dat";
      const path = `capstone-submissions/${capstoneProjectId}/${studentId}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("lesson-files")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;

      const insert = await supabase
        .from("capstone_submissions")
        .upsert({
          capstone_project_id: capstoneProjectId,
          student_id: studentId,
          project_links: [data.path],
          submitted_at: new Date().toISOString(),
        }, { onConflict: "capstone_project_id,student_id" });
      if (insert.error) throw insert.error;

      toast({ title: "Submitted", description: "Your assignment was uploaded." });
      setFile(null);
      onUploaded?.();
    } catch (e: any) {
      console.error("Assignment upload failed", e);
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Button onClick={handleUpload} disabled={uploading} className="bg-[#006d2c] hover:bg-[#005523]">
        {uploading ? "Uploading..." : "Submit"}
      </Button>
    </div>
  );
}
