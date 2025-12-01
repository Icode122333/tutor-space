import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Users, Calendar, BookOpen, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Cohort {
  id: string;
  name: string;
  description?: string;
  course_id: string;
  teacher_id: string;
  start_date?: string;
  end_date?: string;
  max_students?: number;
  is_active?: boolean;
  isAlreadyIn?: boolean;
  courses?: {
    title: string;
  };
  profiles?: {
    full_name: string;
  };
  _count?: {
    enrollments: number;
  };
}

interface JoinCohortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinCohortDialog({ open, onOpenChange }: JoinCohortDialogProps) {
  const { t } = useTranslation();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCohorts();
    }
  }, [open]);

  const fetchCohorts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all unique cohort names from course_enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("course_enrollments")
        .select(`
          cohort_name,
          course_id,
          courses (
            id,
            title,
            teacher_id,
            profiles (
              full_name
            )
          )
        `)
        .not("cohort_name", "is", null);

      if (enrollError) throw enrollError;

      // Check which cohorts the student is already in
      const { data: myEnrollments } = await supabase
        .from("course_enrollments")
        .select("cohort_name, course_id")
        .eq("student_id", user.id);

      const myCohorts = new Set(
        (myEnrollments || [])
          .filter(e => e.cohort_name)
          .map(e => `${e.cohort_name}-${e.course_id}`)
      );

      // Group by cohort name and course
      const cohortMap = new Map();
      (enrollments || []).forEach((enrollment: any) => {
        if (!enrollment.cohort_name || !enrollment.courses) return;
        
        const key = `${enrollment.cohort_name}-${enrollment.course_id}`;
        
        if (!cohortMap.has(key)) {
          cohortMap.set(key, {
            id: key,
            name: enrollment.cohort_name,
            course_id: enrollment.course_id,
            courses: enrollment.courses,
            teacher_id: enrollment.courses.teacher_id,
            profiles: enrollment.courses.profiles,
            isAlreadyIn: myCohorts.has(key),
            _count: { enrollments: 0 }
          });
        }
        
        const cohort = cohortMap.get(key);
        cohort._count.enrollments += 1;
      });

      // Convert to array and filter out cohorts student is already in
      const cohortsArray = Array.from(cohortMap.values());
      
      setCohorts(cohortsArray);
    } catch (error: any) {
      console.error("Error fetching cohorts:", error);
      toast.error(t("common.error"), {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!selectedCohort) {
      toast.error(t("cohort.selectCohort"));
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("cohort_join_requests")
        .insert({
          cohort_id: selectedCohort,
          student_id: user.id,
          message: message.trim() || null,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error(t("cohort.alreadyRequested"));
        } else {
          throw error;
        }
        return;
      }

      toast.success(t("cohort.requestSent"));
      setMessage("");
      setSelectedCohort(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting join request:", error);
      toast.error(t("common.error"), {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("cohort.joinCohort")}</DialogTitle>
          <DialogDescription>
            {t("cohort.browseAndRequest")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#006D2C]" />
          </div>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">{t("cohort.noCohortsAvailable")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cohorts.map((cohort) => {
              const isSelected = selectedCohort === cohort.id;
              const isFull = cohort._count && cohort._count.enrollments >= cohort.max_students;
              const spotsLeft = cohort.max_students - (cohort._count?.enrollments || 0);

              return (
                <Card
                  key={cohort.id}
                  className={`transition-all ${
                    cohort.isAlreadyIn
                      ? "border-green-300 border-2 bg-green-50"
                      : isSelected
                      ? "border-[#006D2C] border-2 shadow-md cursor-pointer"
                      : "border-2 hover:border-gray-300 cursor-pointer"
                  } ${isFull ? "opacity-60" : ""}`}
                  onClick={() => !isFull && !cohort.isAlreadyIn && setSelectedCohort(cohort.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{cohort.name}</h3>
                        {cohort.description && (
                          <p className="text-sm text-gray-600 mb-2">{cohort.description}</p>
                        )}
                      </div>
                      {cohort.isAlreadyIn ? (
                        <Badge className="bg-green-500">{t("cohort.alreadyInCohort")}</Badge>
                      ) : isFull ? (
                        <Badge variant="destructive">{t("cohort.full")}</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {cohort._count?.enrollments || 0} {t("cohort.members")}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {cohort.courses && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="h-4 w-4" />
                          <span>{cohort.courses.title}</span>
                        </div>
                      )}
                      {cohort.profiles && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{cohort.profiles.full_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{cohort._count?.enrollments || 0} {t("cohort.studentsEnrolled")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {selectedCohort && !cohorts.find(c => c.id === selectedCohort)?.isAlreadyIn && (
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("cohort.messageOptional")}
                  </label>
                  <Textarea
                    placeholder={t("cohort.messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCohort(null);
                      setMessage("");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleJoinRequest}
                    disabled={submitting}
                    className="bg-[#006D2C] hover:bg-[#005523]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("common.sending")}
                      </>
                    ) : (
                      t("cohort.sendRequest")
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
