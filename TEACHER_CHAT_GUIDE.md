# Teacher Chat System Guide

## Overview
The Teacher Chat page allows teachers to view and respond to messages from their students in a modern, WhatsApp-inspired interface.

## Features

### 1. Course Group Management Widget
- **Carousel Display**: Teachers can navigate through all their courses using left/right arrows
- **WhatsApp Integration**: Direct access to course group chats via WhatsApp links
- **Visual Design**: Green gradient card with WhatsApp illustration

### 2. Student Conversations List
- **Left Sidebar**: Green-themed sidebar showing all students who have messaged the teacher
- **Search Functionality**: Quick search to find specific students
- **Unread Indicators**: Badge showing number of unread messages per conversation
- **Student Avatars**: Visual identification with avatar images or initials
- **Last Message Preview**: Shows the most recent message and timestamp
- **Active Status**: Green dot indicator for online students

### 3. Chat Interface
- **Message History**: Full conversation history with date separators
- **Real-time Messaging**: Send and receive messages instantly
- **Message Bubbles**: 
  - Teacher messages: Green bubbles (right-aligned)
  - Student messages: Blue bubbles (left-aligned)
- **Timestamps**: Each message shows the time it was sent
- **Read Receipts**: Automatic marking of messages as read when viewed

### 4. User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Press Enter to send messages
- **Auto-scroll**: Automatically scrolls to newest messages
- **Empty States**: Helpful messages when no conversations exist

## Database Integration

### Tables Used
1. **courses**: Fetches teacher's courses with WhatsApp group links
2. **conversations**: Stores conversation metadata between teachers and students
3. **direct_messages**: Stores individual messages with read status
4. **profiles**: Retrieves student information (name, avatar)

### Key Queries
- Fetch all conversations where `teacher_id` matches current user
- Count unread messages per conversation
- Mark messages as read when conversation is opened
- Real-time message insertion and retrieval

## Navigation
- Access via sidebar: "Chat Group" menu item
- Route: `/teacher/chat`
- Requires teacher authentication

## Design Consistency
- Matches StudentChat design with role-appropriate modifications
- Uses DataPlus Labs green branding (#006d2c)
- Floating card design with shadows and rounded corners
- Modern, professional interface

## Technical Implementation
- Built with React and TypeScript
- Uses Supabase for real-time database operations
- Implements proper error handling and loading states
- Optimized for performance with efficient queries

## Future Enhancements
- Real-time message notifications
- File/image sharing capabilities
- Voice message support
- Message search within conversations
- Bulk message operations
- Student grouping by course
