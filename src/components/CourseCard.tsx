import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, CheckCircle, Star } from "lucide-react";

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
  columnIndex?: number; // To determine popup position
  isEnrolled?: boolean; // To show enrolled status
  showEnrollButton?: boolean; // To show enroll button
  onEnroll?: () => void; // Callback for enroll action
}

export const CourseCard = ({ course, onClick, gradient = "from-blue-500 to-purple-600", showTeacher = false, columnIndex = 0, isEnrolled = false, showEnrollButton = false, onEnroll }: CourseCardProps) => {
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const summary = course.summary && course.summary.trim().length > 0 
    ? course.summary 
    : course.description || "Explore this course to learn new skills and advance your knowledge.";

  // Show popup on left for columns 3 and 4 (index 2 and 3)
  const showPopupOnLeft = columnIndex >= 2;

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setShowHoverCard(true);
    }, 250); // Show after 250ms hover
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setShowHoverCard(false);
  };

  // Sample learning points - in production, these would come from the database
  const learningPoints = [
    "Master key concepts and fundamentals",
    "Build practical projects and applications",
    "Learn industry best practices",
  ];

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className="group hover:shadow-2xl transition-all duration-300 border border-black cursor-pointer rounded-2xl overflow-hidden h-full flex flex-col"
        onClick={onClick}
      >
        <CardContent className="p-0 flex flex-col h-full">
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
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-bold text-lg mb-2 line-clamp-2 transition-colors">
              {course.title}
            </h3>
            
            {course.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {course.description}
              </p>
            )}

            <div className="mt-auto space-y-2">
              {showTeacher && course.profiles && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{course.profiles.full_name}</span>
                </div>
              )}
              
              {isEnrolled ? (
                <Button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
                  size="sm"
                >
                  Enrolled
                </Button>
              ) : showEnrollButton && onEnroll ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnroll();
                  }}
                  className="w-full bg-[#006d2c] hover:bg-[#005523] text-white"
                  size="sm"
                >
                  Enroll Now
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Udemy-style Hover Popup */}
      {showHoverCard && (
        <div className={`absolute top-0 w-96 z-50 animate-in fade-in duration-200 ${
          showPopupOnLeft 
            ? 'right-full mr-2 slide-in-from-right-2' 
            : 'left-full ml-2 slide-in-from-left-2'
        }`}>
          <Card className="border border-black shadow-2xl">
            <CardContent className="p-6 space-y-4">
              {/* Title */}
              <h3 className="font-bold text-xl text-gray-900">
                {course.title}
              </h3>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-green-100 text-green-800">
                  Bestseller
                </Badge>
                {course.level && (
                  <Badge variant="outline">
                    {course.level}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.6</span>
                  <span className="text-gray-500">(1,234 ratings)</span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary}
              </p>

              {/* What you'll learn */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">
                  What you'll learn:
                </h4>
                <ul className="space-y-2">
                  {learningPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-[#006d2c] flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Course Details */}
              <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>12 hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>All Levels</span>
                </div>
              </div>

              {/* Teacher */}
              {showTeacher && course.profiles && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                  <Users className="h-4 w-4" />
                  <span>By {course.profiles.full_name}</span>
                </div>
              )}

              {/* CTA Button */}
              <Button 
                className="w-full bg-[#006d2c] hover:bg-[#005523] text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                View Course Details
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
