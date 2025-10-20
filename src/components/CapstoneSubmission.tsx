import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, Plus, Trash2, CheckCircle, Clock } from "lucide-react";

interface CapstoneProject {
  id: string;
  title: string;
  description: string;
  instructions: string;
  requirements: string[];
  due_date: string | null;
}

interface CapstoneSubmissionProps {
  capstoneProject: CapstoneProject;
  studentId: string;
}

export function CapstoneSubmission({ capstoneProject, studentId }: CapstoneSubmissionProps) {
  const [projectLinks, setProjectLinks] = useState<string[]>([""]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
  }, [capstoneProject.id, studentId]);

  const fetchSubmission = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("capstone_submissions")
        .select("*")
        .eq("capstone_project_id", capstoneProject.id)
        .eq("student_id", studentId)
        .single();

      if (data) {
        setSubmission(data);
        setProjectLinks(data.project_links || [""]);
        setDescription(data.description || "");
      }
    } catch (error) {
      // No submission yet
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    setProjectLinks([...projectLinks, ""]);
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...projectLinks];
    newLinks[index] = value;
    setProjectLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setProjectLinks(projectLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validLinks = projectLinks.filter(link => link.trim() !== "");
    
    if (validLinks.length === 0) {
      toast.error("Please add at least one project link");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("capstone_submissions")
        .upsert({
          capstone_project_id: capstoneProject.id,
          student_id: studentId,
          project_links: validLinks,
          description: description,
          submitted_at: new Date().toISOString(),
        }, {
          onConflict: "capstone_project_id,student_id",
        });

      if (error) throw error;

      toast.success("Capstone project submitted successfully!");
      fetchSubmission();
    } catch (error) {
      console.error("Error submitting capstone:", error);
      toast.error("Failed to submit project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-purple-600" />
            <div>
              <CardTitle className="text-2xl text-purple-900">{capstoneProject.title}</CardTitle>
              {capstoneProject.due_date && (
                <p className="text-sm text-purple-700 flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  Due: {new Date(capstoneProject.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-purple-900 mb-2">Description</h3>
            <p className="text-purple-800">{capstoneProject.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-purple-900 mb-2">Instructions</h3>
            <p className="text-purple-800 whitespace-pre-wrap">{capstoneProject.instructions}</p>
          </div>

          {capstoneProject.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1">
                {capstoneProject.requirements.map((req, i) => (
                  <li key={i} className="text-purple-800">{req}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Status */}
      {submission && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Project Submitted</h3>
                <p className="text-sm text-green-700">
                  Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                </p>
                {submission.grade !== null && (
                  <p className="text-sm text-green-700 font-semibold mt-1">
                    Grade: {submission.grade}/100
                  </p>
                )}
              </div>
            </div>
            {submission.feedback && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-green-900 mb-1">Teacher Feedback:</p>
                <p className="text-sm text-green-800">{submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>{submission ? "Update Your Submission" : "Submit Your Project"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Project Links *</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addLink}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Link
              </Button>
            </div>
            <div className="space-y-2">
              {projectLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => updateLink(index, e.target.value)}
                    placeholder="https://github.com/username/project or https://demo-site.com"
                  />
                  {projectLinks.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeLink(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Add links to your GitHub repository, live demo, documentation, etc.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, what you built, challenges faced, and what you learned..."
              rows={6}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "Submitting..." : submission ? "Update Submission" : "Submit Project"}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Submission Details */}
      {submission && (
        <Card>
          <CardHeader>
            <CardTitle>Your Submitted Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submission.project_links.map((link: string, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-purple-600">Link {index + 1}:</span>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
