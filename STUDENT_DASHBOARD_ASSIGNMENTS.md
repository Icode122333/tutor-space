# Student Dashboard - Assignments Section

## Overview
Added a comprehensive "My Assignments" section to the Student Dashboard that allows students to view, upload, and track their assignments and capstone projects directly from the dashboard.

## Features Added

### 1. **My Assignments Section on Dashboard**

Located between "My Courses" and "My Quiz Scores" sections.

#### **Statistics Cards**
Three cards showing:
- **Total Assignments**: Count of all assignments
- **Pending**: Assignments not yet submitted
- **Submitted**: Assignments already submitted

#### **Assignment Cards**
Each assignment displays:
- Assignment title
- Course name
- Due date (if set)
- Description preview
- Status badge (Submitted/Pending)

**For Pending Assignments:**
- Upload widget with file selection
- Description/remarks textarea
- Submit button

**For Submitted Assignments:**
- Submission date and time
- Grade (if graded by teacher)
- Teacher feedback (if provided)

### 2. **Enhanced Upload Widget**

#### **New Features:**
✅ **File Upload Section**
- File input with visual feedback
- Accepted formats: PDF, DOC, DOCX, PPT, PPTX
- Max size: 50MB
- File preview with name and size

✅ **Description/Remarks Section**
- Multi-line textarea (4 rows)
- Character counter (500 max)
- Required field
- Placeholder text guides students

✅ **Submit Button**
- Full-width, large size
- Disabled until both file and description are provided
- Loading state with spinner
- Success/error notifications

#### **Validation:**
- File must be selected
- Description must not be empty
- Shows appropriate error messages

#### **User Experience:**
- Clear labels with icons
- Visual feedback for file selection
- Character count for description
- Disabled states during upload
- Toast notifications for success/errors

### 3. **Empty States**

**No Assignments:**
- FileText icon
- "No Assignments Yet" message
- "Browse Courses" button to enroll

**No Enrolled Courses:**
- Assignments section doesn't show
- Students must enroll first

## Technical Implementation

### **Database Schema Used**

```typescript
capstone_submissions {
  id: UUID
  capstone_project_id: UUID
  student_id: UUID
  project_links: string[]  // File paths in storage
  description: string      // NEW: Student remarks
  submitted_at: timestamp
  grade: number | null
  feedback: string | null
  graded_at: timestamp | null
  graded_by: UUID | null
}
```

### **File Storage**
- Bucket: `lesson-files`
- Path: `capstone-submissions/{projectId}/{studentId}/{timestamp}.{ext}`
- Signed URLs for secure access

### **Data Flow**

1. **Fetch Assignments:**
   ```typescript
   - Get enrolled courses
   - Get capstone projects for those courses
   - Get submissions for those projects
   - Merge data with submission status
   ```

2. **Upload Assignment:**
   ```typescript
   - Validate file and description
   - Upload file to Supabase Storage
   - Create/update submission record with description
   - Show success notification
   - Refresh assignments list
   ```

3. **View Grades:**
   ```typescript
   - Display grade when teacher grades
   - Show feedback if provided
   - Visual green card for graded assignments
   ```

## UI Components Used

### **From shadcn/ui:**
- Card, CardContent, CardHeader, CardTitle
- Button
- Badge
- Input
- Textarea
- Label

### **Icons from lucide-react:**
- FileText (assignments)
- Upload (submit)
- Clock (pending)
- CheckCircle2 (success)
- MessageSquare (remarks)
- Award (grades)

## Color Scheme

- **Blue**: Assignments section (#3b82f6)
- **Orange**: Pending status (#f97316)
- **Green**: Submitted/Graded (#22c55e)
- **Brand Green**: Buttons (#006d2c)

## User Flow

### **Student Workflow:**

1. **View Dashboard**
   - See "My Assignments" section
   - View statistics (Total, Pending, Submitted)

2. **Select Pending Assignment**
   - Read assignment details
   - See due date
   - View description

3. **Upload Submission**
   - Click file input
   - Select file (PDF, DOC, etc.)
   - See file preview
   - Write description/remarks
   - Click "Submit Assignment"

4. **Wait for Grading**
   - Assignment moves to "Submitted" status
   - Shows submission date

5. **View Grade**
   - Grade appears when teacher grades
   - Read teacher feedback
   - See score out of 100

### **Teacher Workflow:**

1. Teacher views submissions in `/teacher/assignments`
2. Teacher clicks "View" to open document
3. Teacher enters marks (0-100)
4. Teacher clicks "Save"
5. Grade automatically appears on student dashboard

## Responsive Design

- **Desktop**: 2-column grid for assignment cards
- **Tablet**: 2-column grid
- **Mobile**: Single column, full-width cards

## Accessibility

- ✅ Proper labels for all inputs
- ✅ ARIA attributes
- ✅ Keyboard navigation
- ✅ Screen reader friendly
- ✅ Color contrast compliant

## Error Handling

### **Upload Errors:**
- No file selected
- No description provided
- File too large
- Upload failed
- Network errors

### **Display Errors:**
- Failed to fetch assignments
- Failed to fetch submissions
- Database connection issues

All errors show user-friendly toast notifications.

## Performance Optimizations

- ✅ Fetch assignments only when profile loaded
- ✅ Conditional rendering (only show if enrolled)
- ✅ Efficient data merging
- ✅ Optimized re-renders
- ✅ Lazy loading of components

## Security

- ✅ Row Level Security (RLS) on database
- ✅ File upload validation
- ✅ User authentication required
- ✅ Signed URLs for file access
- ✅ Student can only see own submissions

## Testing Checklist

### **Student Side:**
- [ ] View assignments section
- [ ] See correct statistics
- [ ] Upload PDF file
- [ ] Upload DOC file
- [ ] Add description
- [ ] Submit assignment
- [ ] See success message
- [ ] View submitted assignment
- [ ] See grade when graded
- [ ] Read teacher feedback

### **Teacher Side:**
- [ ] View submissions
- [ ] Open document in viewer
- [ ] Enter marks
- [ ] Save grade
- [ ] Verify grade appears on student side

### **Edge Cases:**
- [ ] No enrolled courses
- [ ] No assignments
- [ ] File too large
- [ ] Empty description
- [ ] Network error during upload
- [ ] Already submitted assignment

## Future Enhancements

### **Potential Additions:**
- [ ] Multiple file uploads
- [ ] Drag and drop file upload
- [ ] File preview before submit
- [ ] Edit submission before deadline
- [ ] Resubmission feature
- [ ] Assignment notifications
- [ ] Due date reminders
- [ ] Progress tracking
- [ ] Assignment history
- [ ] Download submitted files
- [ ] Rich text editor for remarks
- [ ] Attachment links (URLs)
- [ ] Collaborative submissions
- [ ] Peer review system

## Code Examples

### **Upload Widget Usage:**
```typescript
<AssignmentUploadWidget
  studentId={studentId}
  capstoneProjectId={assignment.id}
  onUploaded={fetchAssignments}
/>
```

### **Assignment Card:**
```typescript
<Card className={`hover:shadow-lg ${
  assignment.submission ? 'border-green-200' : 'border-orange-200'
}`}>
  <CardContent className="p-6">
    {/* Assignment details */}
    {assignment.submission ? (
      // Show grade and feedback
    ) : (
      // Show upload widget
    )}
  </CardContent>
</Card>
```

## Files Modified

1. **`src/pages/StudentDashboard.tsx`**
   - Added assignments state
   - Added fetchAssignments function
   - Added My Assignments section
   - Added statistics cards
   - Added assignment cards grid

2. **`src/components/AssignmentUploadWidget.tsx`**
   - Added description/remarks textarea
   - Added Label component
   - Added MessageSquare icon
   - Added character counter
   - Updated validation logic
   - Enhanced UI/UX

## Dependencies

No new dependencies added. Uses existing:
- React
- Supabase
- shadcn/ui components
- lucide-react icons

---

**Status**: ✅ Complete and Ready for Testing  
**Last Updated**: February 2025  
**Version**: 1.0.0
