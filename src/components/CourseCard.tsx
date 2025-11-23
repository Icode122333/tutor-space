import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string | null;
    summary?: string | null;
    thumbnail_url?: string | null;
    level?: string;
    profiles?: {
      full_name: string;
    };
  };
  onClick: () => void;
  gradient?: string;
  showTeacher?: boolean;
}

export const CourseCard = ({ course, onClick, gradient = "from-blue-500 to-purple-600", showTeacher = false }: CourseCardProps) => {
  const summary = course.summary && course.summary.trim().length > 0 
    ? course.summary 
    : course.description || "No course summary available yet. Click to view full course details.";

  return (
    <TooltipProvider>
      <TooltipTrigger asChild>
        <Card
          className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#006d2c] cursor-pointer rounded-2xl overflow-hidden"
          onClick={onClick}
        >
          <CardContent className="p-0">
            {/* Course Image */}
            <div className={`relative h-40 bg-gradient-to-br ${gradient} overflow-hidden`}>
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white/30" />
                </div>
              )}
              {/* Level Badge */}
              {course.level && (
                <div className="absolute top-3 right-3">
                  <Badge
                    className={`${
                      course.level === "beginner"
                        ? "bg-green-500"
                        : course.level === "intermediate"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    } text-white`}
                  >
                    {course.level}
                  </Badge>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[#006d2c] transition-colors">
                {course.title}
              </h3>
              
              {course.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {course.description}
                </p>
              )}

              {showTeacher && course.profiles && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Users className="h-4 w-4" />
                  <span>{course.profiles.full_name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      
      <TooltipContent side="top" className="max-w-sm p-4 bg-white border-2 border-[#006d2c] shadow-xl z-50">
        <div className="space-y-2">
          <h4 className="font-bold text-[#006d2c]">Course Overview</h4>
          <p className="text-sm text-gray-700">{summary}</p>
        </div>
      </TooltipContent>
    </TooltipProvider>
  );
};
