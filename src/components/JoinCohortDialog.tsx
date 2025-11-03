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
  description: string;
  course_id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  max_students: number;
  is_active: boolean;
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

      const { data, error } = await supabase
        .from("cohorts")
        .select(`
          *,
          courses (title),
          profiles (full_name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter out cohorts the student is already in or has requested
      const { data: existingRequests } = await supabase
        .from("cohort_join_requests")
        .select("cohort_id")
        .eq("student_id", user.id)
        .in("status", ["pending", "approved"]);

      const requestedCohortIds = new Set(existingRequests?.map(r => r.cohort_id) || []);

      // Get enrollment counts for each cohort
      const cohortsWithCounts = await Promise.all(
        (data || [])
          .filter(cohort => !requestedCohortIds.has(cohort.id))
          .map(async (cohort) => {
            const { count } = await supabase
              .from("course_enrollments")
              .select("*", { count: "exact", head: true })
              .eq("cohort_name", cohort.name);

            return {
              ...cohort,
              _count: { enrollments: count || 0 },
            };
          })
      );

      setCohorts(cohortsWithCounts);
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
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#006D2C] border-2 shadow-md"
                      : "border-2 hover:border-gray-300"
                  } ${isFull ? "opacity-60" : ""}`}
                  onClick={() => !isFull && setSelectedCohort(cohort.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{cohort.name}</h3>
                        {cohort.description && (
                          <p className="text-sm text-gray-600 mb-2">{cohort.description}</p>
                        )}
                      </div>
                      {isFull ? (
                        <Badge variant="destructive">{t("cohort.full")}</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {spotsLeft} {t("cohort.spotsLeft")}
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
                      {cohort.start_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(cohort.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {selectedCohort && (
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
