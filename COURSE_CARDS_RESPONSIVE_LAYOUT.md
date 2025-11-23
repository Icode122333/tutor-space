# Course Cards Responsive Layout with Hover Tooltips

## Overview
Updated Student and Teacher dashboards to display courses in a responsive card grid (4 columns on large screens) with hover tooltips showing course summaries.

## What Was Implemented

### 1. Database Migration (`20250205000005_add_course_summary.sql`)
Added fields to courses table:
- `summary` (TEXT) - Brief 2-3 sentence course overview
- `what_you_will_learn` (TEXT[]) - Array of learning outcomes

### 2. CourseCard Component (`src/components/CourseCard.tsx`)
Reusable course card component with:
- Responsive design
- Hover tooltip showing course summary
- Course thumbnail with gradient fallback
- Level badge
- Teacher name (optional)
- Smooth hover animations

### 3. Updated StudentDashboard
- Changed from 3-column to 4-column responsive grid
- Grid breakpoints:
  - Mobile (1 column): `grid-cols-1`
  - Small (2 columns): `sm:grid-cols-2`
  - Large (3 columns): `lg:grid-cols-3`
  - Extra Large (4 columns): `xl:grid-cols-4`
- Uses CourseCard component
- Shows teacher name on cards

### 4. Updated TeacherDashboard
- Changed from list view to card grid
- Grid breakpoints:
  - Mobile (1 column): `grid-cols-1`
  - Small (2 columns): `sm:grid-cols-2`
  - Extra Large (3 columns): `xl:grid-cols-3`
- Uses CourseCard component
- Cleaner, more visual layout

## Features

### Responsive Grid
```
Mobile (< 640px):     1 column
Small (640px+):       2 columns
Large (1024px+):      3 columns (Student), 2 columns (Teacher)
Extra Large (1280px+): 4 columns (Student), 3 columns (Teacher)
```

### Hover Tooltip
- Appears when hovering over a course card
- Shows course summary if available
- Styled with green border matching theme
- Max width for readability
- Only shows if summary exists

### Course Card Features
- Thumbnail image or gradient fallback
- Course title (2-line clamp)
- Course description (2-line clamp)
- Level badge (Beginner/Intermediate/Advanced)
- Teacher name (optional)
- Smooth hover effects:
  - Shadow increases
  - Border changes to green
  - Image scales up
  - Title changes color

## How Teachers Add Course Summary

When creating/editing a course, teachers can add:

1. **Summary Field:**
   - Brief 2-3 sentence overview
   - Shown in hover tooltip
   - Helps students understand course at a glance

2. **What You'll Learn:**
   - Array of key learning outcomes
   - Bullet points of skills/knowledge gained
   - Can be displayed in course details

## Database Setup

Run this migration in Supabase SQL Editor:

```sql
-- Copy content from: tutor-space/supabase/migrations/20250205000005_add_course_summary.sql
```

## Usage Example

### In CreateCourse Form (Future Enhancement):

```typescript
<div>
  <Label htmlFor="summary">Course Summary</Label>
  <Textarea
    id="summary"
    value={courseData.summary}
    onChange={(e) => setCourseData({...courseData, summary: e.target.value})}
    placeholder="Brief 2-3 sentence overview of what this course covers..."
    rows={3}
  />
  <p className="text-sm text-gray-500 mt-1">
    This summary appears when students hover over your course card
  </p>
</div>
```

## Component API

### CourseCard Props:

```typescript
interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string | null;
    summary?: string | null;  // For hover tooltip
    thumbnail_url?: string | null;
    level?: string;
    profiles?: {
      full_name: string;
    };
  };
  onClick: () => void;
  gradient?: string;  // Tailwind gradient classes
  showTeacher?: boolean;  // Show teacher name
}
```

## Styling

### Card Dimensions:
- Height: Auto (content-based)
- Image height: 160px (h-40)
- Padding: 16px (p-4)
- Border radius: 16px (rounded-2xl)

### Hover Effects:
- Shadow: `hover:shadow-2xl`
- Border: `hover:border-[#006d2c]`
- Image scale: `group-hover:scale-110`
- Title color: `group-hover:text-[#006d2c]`

### Gradients (6 variations):
1. Blue to Purple
2. Green to Teal
3. Orange to Red
4. Pink to Rose
5. Indigo to Blue
6. Yellow to Orange

## Benefits

✅ More courses visible at once (4 vs 3)
✅ Better use of screen space
✅ Responsive on all devices
✅ Quick course overview on hover
✅ Cleaner, more modern design
✅ Consistent across Student and Teacher dashboards
✅ Reusable component
✅ Smooth animations

## Testing

1. **Desktop (1920px):**
   - Student Dashboard: 4 cards per row
   - Teacher Dashboard: 3 cards per row

2. **Laptop (1280px):**
   - Student Dashboard: 4 cards per row
   - Teacher Dashboard: 3 cards per row

3. **Tablet (768px):**
   - Both: 2 cards per row

4. **Mobile (375px):**
   - Both: 1 card per row

5. **Hover Tooltip:**
   - Add summary to a course in database
   - Hover over card
   - Tooltip should appear with summary

## Future Enhancements

- Add "What You'll Learn" section to course details
- Show course progress on cards (for students)
- Add quick actions menu on cards
- Filter/sort courses
- Search functionality
- Course categories/tags
