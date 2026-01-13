# DATAPLUS

A comprehensive Learning Management System (LMS) built with React, TypeScript, and Supabase. TutorSpace provides a complete platform for online education with dedicated portals for students, teachers, and administrators.

## Features

### Student Portal
- Dashboard with enrolled courses and progress tracking
- Course browsing and enrollment
- Assignment submissions with file uploads
- Real-time chat with teachers
- Schedule management
- Certificates upon course completion
- Score tracking and grades view
- Subscription management
- Multi-language support (English/French)

### Teacher Portal
- Course creation and management
- Student management and cohort organization
- Assignment creation and grading
- Announcements to students
- Real-time chat with students
- Schedule management
- Grade management

### Admin Portal
- User management (students, teachers, admins)
- Teacher approval workflow
- Course moderation
- Certificate management
- Announcements system
- Exhibition project management
- Testimonials management
- Partner requests handling
- Email campaigns
- Activity logs and analytics

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack React Query
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **i18n**: i18next (English, French)
- **Charts**: Recharts

## Prerequisites

- Node.js 18+ 
- npm or bun
- Supabase account and project

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd tutor-space
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
tutor-space/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Internationalization config and locales
│   ├── integrations/   # External service integrations
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   └── App.tsx         # Main app component with routing
├── Database/
│   ├── functions/      # Edge functions (e.g., send-email)
│   └── migrations/     # Database migrations
├── public/             # Static assets
└── package.json
```

## Deployment

### Netlify

The project includes `netlify.toml` for Netlify deployment. Simply connect your repository to Netlify.

### Vercel

A `vercel.json` configuration is included for Vercel deployment.


## License

Private project - All rights reserved.

