import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building2, BookOpen, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const StudentOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    telephone: "",
    organizationName: "",
    industry: "",
    role: "",
    interests: [] as string[],
  });

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "Manufacturing",
    "Retail",
    "Agriculture",
    "Government",
    "Non-profit",
    "Other",
  ];

  const interestOptions = [
    "Data Analyst",
    "AI",
    "Programming",
    "Marketing",
    "Accounting",
    "Startup Courses",
    "Tax",
    "Product Management",
    "Business Management",
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.telephone) {
        toast.error("Please fill in all fields");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.organizationName || !formData.industry || !formData.role) {
        toast.error("Please fill in all fields");
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (formData.interests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }
    
    // Save onboarding data (you can integrate with Supabase here)
    toast.success("Onboarding completed!");
    navigate("/student/dashboard");
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Sidebar - Green */}
      <div className="w-80 bg-gradient-to-br from-[#006d2c] to-[#006d2c] p-8 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <img
            src="/images/dataplus_logggg-removebg-preview.png"
            alt="DataPlus Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-bold text-white">DataPlus Labs</span>
        </div>

        {/* Steps */}
        <div className="flex-1 space-y-8">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 1 ? "bg-white text-[#006d2c]" : "bg-white/20 text-white"
              }`}
            >
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${currentStep >= 1 ? "text-white" : "text-white/60"}`}>
                Basic Info
              </h3>
              <p className={`text-sm ${currentStep >= 1 ? "text-white/90" : "text-white/50"}`}>
                Personal details of user
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 2 ? "bg-white text-[#006d2c]" : "bg-white/20 text-white"
              }`}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${currentStep >= 2 ? "text-white" : "text-white/60"}`}>
                Organization
              </h3>
              <p className={`text-sm ${currentStep >= 2 ? "text-white/90" : "text-white/50"}`}>
                Organization information
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                currentStep >= 3 ? "bg-white text-[#006d2c]" : "bg-white/20 text-white"
              }`}
            >
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className={`font-bold ${currentStep >= 3 ? "text-white" : "text-white/60"}`}>
                Your Interests
              </h3>
              <p className={`text-sm ${currentStep >= 3 ? "text-white/90" : "text-white/50"}`}>
                Select your learning interests
              </p>
            </div>
          </div>
        </div>

        <div className="text-white/60 text-sm">
          All rights reserved @DataPlus Labs
        </div>
      </div>

      {/* Right Content Area - White */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-2xl">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Step 1/3</p>
                <h1 className="text-4xl font-bold text-black mb-3">Basic Info</h1>
                <p className="text-gray-600">
                  Tell us a bit about yourself to get started with your learning journey.
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-12 border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-12 border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                    Telephone number
                  </Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+250 788 123 456"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="h-12 border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleNext}
                  className="bg-[#006d2c] hover:bg-[#006d2c] text-black font-medium h-12 px-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Organization */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Step 2/3</p>
                <h1 className="text-4xl font-bold text-black mb-3">Organization</h1>
                <p className="text-gray-600">
                  Tell us about your organization. It helps us tailor your learning experience.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                    Organization name
                  </Label>
                  <Input
                    id="organizationName"
                    placeholder="Enter organization name"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="h-12 border-gray-300 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                    Industry
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger className="h-12 border-gray-300 rounded-lg">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Your role
                  </Label>
                  <Input
                    id="role"
                    placeholder="e.g., Student, Professional, Manager"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="h-12 border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="h-12 px-6 border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#006d2c] hover:bg-[#006d2c] text-black font-medium h-12 px-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Step 3/3</p>
                <h1 className="text-4xl font-bold text-black mb-3">Your Interests</h1>
                <p className="text-gray-600">
                  Select the topics you're interested in learning. You can choose multiple options.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.interests.includes(interest)
                        ? "border-[#006d2c] bg-[#006d2c]/10"
                        : "border-gray-200 hover:border-[#006d2c]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.interests.includes(interest)
                            ? "border-[#006d2c] bg-[#006d2c]"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.interests.includes(interest) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{interest}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="h-12 px-6 border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  className="bg-[#006d2c] hover:bg-[#006d2c] text-black font-medium h-12 px-8"
                >
                  Complete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentOnboarding;
