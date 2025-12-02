import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useTranslation } from "react-i18next";

interface Certificate {
  id: string;
  course_id: string;
  course_title: string;
  completion_date: string;
  grade: string;
  instructor_name: string;
  certificate_url: string;
  status: string;
  approved_at: string;
}

const StudentCertificates = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchCertificates();
    }
  }, [profile]);

  const fetchCertificates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Fetch approved certificates for the student
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          id,
          course_id,
          certificate_url,
          status,
          completion_date,
          grade,
          approved_at,
          courses:course_id (
            title,
            profiles:teacher_id (
              full_name
            )
          )
        `)
        .eq("student_id", user.id)
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;

      // Transform data to match Certificate interface
      const transformedCertificates: Certificate[] = (data || []).map((cert: any) => ({
        id: cert.id,
        course_id: cert.course_id,
        course_title: cert.courses?.title || "Unknown Course",
        completion_date: cert.completion_date,
        grade: cert.grade || "N/A",
        instructor_name: cert.courses?.profiles?.full_name || "Unknown Instructor",
        certificate_url: cert.certificate_url,
        status: cert.status,
        approved_at: cert.approved_at
      }));

      setCertificates(transformedCertificates);
    } catch (error: any) {
      console.error("Error fetching certificates:", error);
      toast.error(t('certificates.failedToLoad'));
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (profileData.role !== "student") {
        navigate("/teacher/dashboard");
        return;
      }

      setProfile(profileData);
    } catch (error: any) {
      toast.error(error.message);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate: Certificate) => {
    if (certificate.certificate_url) {
      window.open(certificate.certificate_url, '_blank');
      toast.success(t('certificates.openingCertificate'));
    } else {
      toast.error(t('certificates.certificateUrlNotAvailable'));
    }
  };

  const handleShare = (certificate: Certificate) => {
    if (certificate.certificate_url) {
      navigator.clipboard.writeText(certificate.certificate_url);
      toast.success(t('certificates.certificateLinkCopied'));
    } else {
      toast.error(t('certificates.certificateUrlNotAvailable'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <StudentSidebar />

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-white px-6 py-4 rounded-2xl shadow-lg mx-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('certificates.myCertificates')}</h1>
                  <p className="text-sm text-gray-600">{t('certificates.viewDownload')}</p>
                </div>
              </div>
              <Avatar className="h-12 w-12 rounded-full shadow-lg border-2 border-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-[#006d2c] text-white">
                    {profile?.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="border-2 border-[#006d2c]/20 bg-gradient-to-br from-green-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('certificates.totalCertificates')}</p>
                        <p className="text-3xl font-bold text-[#006d2c]">{certificates.length}</p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-[#006d2c]/10 flex items-center justify-center">
                        <Award className="h-7 w-7 text-[#006d2c]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{t('certificates.coursesCompleted')}</p>
                        <p className="text-3xl font-bold text-blue-600">{certificates.length}</p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckCircle2 className="h-7 w-7 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Certificates Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{t('certificates.yourCertificates')}</h2>
                  {certificates.length > 0 && (
                    <Badge className="bg-[#006d2c] text-white">
                      {certificates.length} {certificates.length === 1 ? t('certificates.certificate') : t('certificates.certificatesPlural')}
                    </Badge>
                  )}
                </div>

                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {certificates.map((cert, index) => {
                      const completionDate = new Date(cert.completion_date);
                      const formattedDate = completionDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });

                      const gradients = [
                        'from-blue-500 to-purple-600',
                        'from-green-500 to-teal-600',
                        'from-orange-500 to-red-600',
                        'from-pink-500 to-rose-600',
                      ];
                      const gradient = gradients[index % gradients.length];

                      return (
                        <Card
                          key={cert.id}
                          className="group relative overflow-hidden border-2 border-gray-200 hover:border-[#006d2c] transition-all duration-300 hover:shadow-2xl"
                        >
                          {/* Certificate Header with Gradient */}
                          <div className={`relative h-32 bg-gradient-to-br ${gradient} p-6 flex items-center justify-center`}>
                            <div className="absolute inset-0 bg-black/10" />
                            <div className="relative text-center">
                              <Award className="h-16 w-16 text-white mx-auto mb-2 drop-shadow-lg" />
                              <Badge className="bg-white/20 text-white border-white/30">
                                {t('certificates.certificateOfCompletion')}
                              </Badge>
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30" />
                          </div>

                          {/* Certificate Content */}
                          <CardContent className="p-6">
                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                {cert.course_title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {t('certificates.instructor')}: {cert.instructor_name}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-[#006d2c]" />
                                <span>{formattedDate}</span>
                              </div>
                              <Badge variant="secondary" className="bg-[#006d2c]/10 text-[#006d2c]">
                                {t('certificates.grade')}: {cert.grade}
                              </Badge>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleDownload(cert)}
                                className="flex-1 bg-[#006d2c] hover:bg-[#005523] text-white"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {t('certificates.viewBtn')}
                              </Button>
                              <Button
                                onClick={() => handleShare(cert)}
                                variant="outline"
                                className="flex-1 border-[#006d2c] text-[#006d2c] hover:bg-[#006d2c]/10"
                                size="sm"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                {t('certificates.share')}
                              </Button>
                            </div>
                          </CardContent>

                          {/* Verified Badge */}
                          <div className="absolute top-36 right-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-[#006d2c] flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                              </div>
                              <div className="absolute inset-0 rounded-full bg-[#006d2c] animate-ping opacity-20" />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-gray-300 bg-white">
                    <CardContent className="py-16 text-center">
                      <div className="mb-6">
                        <img
                          src="/images/certificate.png"
                          alt="Certificate illustration"
                          className="w-64 h-64 mx-auto object-contain opacity-90"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('certificates.noCertificate')}</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {t('certificates.takeCourse')}
                      </p>
                      <Button
                        onClick={() => navigate("/student/dashboard")}
                        className="bg-[#006d2c] hover:bg-[#005523] text-white"
                      >
                        {t('slider.browseCourses')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Info Card */}
              <Card className="bg-gradient-to-r from-[#006d2c]/5 to-blue-50 border-[#006d2c]/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#006d2c]/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-6 w-6 text-[#006d2c]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{t('certificates.aboutCertificates')}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {t('certificates.aboutCertificatesDesc')}
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#006d2c]" />
                          {t('certificates.verifiedAuthenticated')}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#006d2c]" />
                          {t('certificates.shareableSocial')}
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#006d2c]" />
                          {t('certificates.downloadablePDF')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentCertificates;
