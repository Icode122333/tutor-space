# Chat System Architecture

## 📊 Database Relationships

```
┌─────────────────┐
│    profiles     │
│  (from auth)    │
│                 │
│ • id (PK)       │
│ • email         │
│ • full_name     │
│ • role          │
└────────┬────────┘
         │
         │ teacher_id
         │
         ▼
┌─────────────────────────┐
│     group_chats         │
│                         │
│ • id (PK)               │
│ • group_name            │
│ • description           │
│ • teacher_id (FK) ──────┤
│ • whatsapp_link         │
│ • is_archived           │
│ • created_at            │
│ • updated_at            │
└────────┬────────────────┘
         │
         │ group_chat_id
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────────────────┐    ┌──────────────────────┐
│  group_members   │    │   chat_messages      │
│                  │    │                      │
│ • id (PK)        │    │ • id (PK)            │
│ • group_chat_id  │    │ • group_chat_id (FK) │
│ • user_id (FK)   │    │ • sender_id (FK)     │
│ • role           │    │ • message_text       │
│ • joined_at      │    │ • message_type       │
│ • last_read_at   │    │ • file_url           │
└──────────────────┘    │ • is_resolved        │
                        │ • reply_to_id (FK)   │
                        │ • is_edited          │
                        │ • created_at         │
                        └────────┬─────────────┘
                                 │
                            ┌────┴────┐
                            │         │
                            ▼         ▼
                ┌──────────────────┐  ┌─────────────────────┐
                │ message_reactions│  │ message_read_receipts│
                │                  │  │                      │
                │ • id (PK)        │  │ • id (PK)            │
                │ • message_id (FK)│  │ • message_id (FK)    │
                │ • user_id (FK)   │  │ • user_id (FK)       │
                │ • emoji          │  │ • read_at            │
                │ • created_at     │  │                      │
                └──────────────────┘  └─────────────────────┘
```

## 🔄 Data Flow

### Creating a Group (Teacher)
```
Teacher clicks "Create Group"
         ↓
   Fills form data
         ↓
   Submits to Supabase
         ↓
INSERT into group_chats
         ↓
Trigger: add_teacher_as_admin_trigger
         ↓
INSERT into group_members (teacher as admin)
         ↓
   Fetch updated groups
         ↓
Display new group in sidebar
```

### Sending a Message
```
User types message
         ↓
   Presses Enter
         ↓
Check if user is group member (RLS)
         ↓
INSERT into chat_messages
         ↓
Trigger: update_group_on_message_trigger
         ↓
UPDATE group_chats.updated_at
         ↓
   Fetch new messages
         ↓
Display message in chat
         ↓
   Auto-scroll to bottom
```

### Replying to a Message
```
User hovers over message
         ↓
Clicks reply icon (↩️)
         ↓
Set replyingTo state
         ↓
Show "Replying to" banner
         ↓
User types reply
         ↓
INSERT with reply_to_id set
         ↓
Display threaded message
```

## 🏗️ Component Architecture

### TeacherChat.tsx
```
TeacherChat
├── Header
│   ├── Title
│   └── Create Group Button
│       └── Dialog (Create/Edit Group)
├── Chat Interface
│   ├── Left Sidebar (Groups List)
│   │   └── Group Cards
│   │       ├── Avatar
│   │       ├── Group Name
│   │       ├── Last Message
│   │       └── Badges (Members, WhatsApp)
│   ├── Middle Section (Active Chat)
│   │   ├── Chat Header
│   │   │   ├── Group Info
│   │   │   ├── Members Button
│   │   │   ├── WhatsApp Button
│   │   │   └── Dropdown Menu
│   │   │       ├── Edit Group
│   │   │       └── Archive Group
│   │   ├── Messages Area
│   │   │   └── Message Bubbles
│   │   │       ├── Sender Info
│   │   │       ├── Message Text
│   │   │       ├── Timestamp
│   │   │       ├── Status Badges
│   │   │       └── Hover Actions
│   │   │           ├── Reply
│   │   │           ├── Edit (own)
│   │   │           └── Delete (own)
│   │   └── Input Area
│   │       ├── Reply Banner (conditional)
│   │       ├── Edit Banner (conditional)
│   │       ├── Textarea
│   │       └── Send Button
│   └── Dialogs
│       ├── Members Dialog
│       └── Edit Group Dialog
└── State Management
    ├── conversations
    ├── selectedGroup
    ├── messages
    ├── members
    ├── newMessage
    ├── editingMessage
    └── replyingTo
```

### StudentChat.tsx
```
StudentChat
├── Header
│   └── Title
├── Chat Interface
│   ├── Left Sidebar (Groups List)
│   │   └── Group Cards (same as teacher)
│   ├── Middle Section (Active Chat)
│   │   ├── Chat Header (simplified)
│   │   │   ├── Group Info
│   │   │   ├── Members Button
│   │   │   └── WhatsApp Button
│   │   ├── Messages Area (same as teacher)
│   │   └── Input Area (same as teacher)
│   └── Dialogs
│       └── Members Dialog
└── State Management (same as teacher)
```

## 🔐 Security Architecture

### Row Level Security (RLS) Flow
```
User makes request
         ↓
Supabase checks auth.uid()
         ↓
   RLS Policy evaluated
         ↓
    ┌────┴────┐
    │         │
  ALLOW     DENY
    │         │
    ▼         ▼
Return data  Return error
```

### Policy Examples

#### Teachers can view their groups
```sql
auth.uid() = teacher_id
```

#### Members can view their groups
```sql
EXISTS (
  SELECT 1 FROM group_members
  WHERE group_chat_id = group_chats.id
  AND user_id = auth.uid()
)
```

#### Members can send messages
```sql
auth.uid() = sender_id AND
EXISTS (
  SELECT 1 FROM group_members
  WHERE group_chat_id = chat_messages.group_chat_id
  AND user_id = auth.uid()
)
```

## 🎨 UI/UX Flow

### Teacher Journey
```
Login as Teacher
       ↓
Navigate to /teacher/chat
       ↓
See "Create Group" button
       ↓
Click → Fill form → Create
       ↓
Group appears in sidebar
       ↓
Click group to open
       ↓
Send welcome message
       ↓
Add students (manual for now)
       ↓
Students join and send messages
       ↓
Teacher replies and marks resolved
```

### Student Journey
```
Login as Student
       ↓
Navigate to /student/chat
       ↓
See groups they're in
       ↓
Click group to open
       ↓
Read messages
       ↓
Send question
       ↓
Teacher replies
       ↓
See "Resolved" badge
```

## 📦 State Management

### Local State (useState)
- `conversations` - List of groups with previews
- `selectedGroup` - Currently active group
- `messages` - Messages in selected group
- `members` - Members of selected group
- `newMessage` - Text being typed
- `editingMessage` - ID of message being edited
- `replyingTo` - Message being replied to
- `showDialogs` - Dialog visibility states

### Server State (Supabase)
- Fetched on mount and after mutations
- No caching layer (could add React Query)
- Manual refetch after changes

### Future: Real-time State
```typescript
// Subscribe to new messages
supabase
  .channel(`group:${groupId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages'
  }, handleNewMessage)
  .subscribe()
```

## 🚀 Performance Optimizations

### Current
- ✅ Database indexes on foreign keys
- ✅ Indexes on created_at for sorting
- ✅ Fetch only needed data with select()
- ✅ Auto-scroll with useRef (no re-renders)

### Planned
- ⬜ Message pagination (load 50 at a time)
- ⬜ Virtual scrolling for large message lists
- ⬜ Debounced typing indicators
- ⬜ Optimistic UI updates
- ⬜ Image lazy loading
- ⬜ React Query for caching

## 🔄 Real-time Architecture (Future)

```
User A sends message
         ↓
INSERT into chat_messages
         ↓
Postgres triggers change event
         ↓
Supabase Realtime broadcasts
         ↓
    ┌────┴────┐
    │         │
User B    User C
    │         │
    ▼         ▼
Receive event
    │
    ▼
Update local state
    │
    ▼
Re-render with new message
```

## 📱 Mobile Responsiveness (Future)

```
Desktop (>1024px)
├── Sidebar (320px fixed)
└── Chat (flexible)

Tablet (768px-1024px)
├── Sidebar (280px fixed)
└── Chat (flexible)

Mobile (<768px)
├── Groups List (full width)
│   └── Click → Navigate to Chat
└── Chat (full width)
    └── Back button → Groups List
```

## 🧪 Testing Strategy

### Unit Tests
- Message formatting functions
- Time ago calculations
- Permission checks

### Integration Tests
- Create group flow
- Send message flow
- Edit/delete message flow
- Reply to message flow

### E2E Tests
- Teacher creates group
- Teacher adds student
- Student sends message
- Teacher marks resolved
- Student sees resolved badge

## 📊 Monitoring & Analytics

### Metrics to Track
- Messages sent per day
- Active groups
- Average response time
- Resolution rate
- User engagement

### Error Tracking
- Failed message sends
- Permission errors
- Network errors
- Database errors

## 🔮 Future Enhancements

### Phase 1: Core Features
```
File Upload → Emoji Reactions → Real-time → Notifications
```

### Phase 2: Advanced Features
```
Search → Pagination → Voice Messages → Video Messages
```

### Phase 3: Analytics
```
Chat Analytics → User Insights → Performance Metrics
```

---

**Last Updated**: October 13, 2025
**Version**: 1.0.0
