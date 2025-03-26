# OhYea

A social network application built with Next.js, Tailwind CSS, and Supabase.

## Features

- User authentication (email/password and Google OAuth)
- Create and view posts
- View and follow/unfollow other users
- Responsive design with dark mode support
- Real-time updates

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [TypeScript](https://www.typescriptlang.org/) - Static type checking

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd ohyea
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project in [Supabase](https://app.supabase.com/)
2. Get your Supabase URL and anon key from the project settings
3. Run the SQL migrations in the Supabase SQL editor:
   - Run `supabase_migration.sql` to create the posts table
   - Run `supabase_users_migration.sql` to create the profiles and follows tables

### 4. Configure environment variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. (Optional) Configure Google OAuth

1. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/)
2. Add authorized redirect URI: `https://your-supabase-project.supabase.co/auth/v1/callback`
3. Configure Google provider in Supabase Authentication settings with your Client ID and Client Secret

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses three main tables:

1. **posts** - Store user posts
   - id: UUID (primary key)
   - user_id: UUID (foreign key to profiles.id)
   - content: TEXT
   - username: TEXT
   - avatar_url: TEXT (optional)
   - created_at: TIMESTAMPTZ
   - updated_at: TIMESTAMPTZ (optional)

2. **profiles** - Store user profiles
   - id: UUID (primary key, references auth.users.id)
   - username: TEXT
   - email: TEXT
   - avatar_url: TEXT (optional)
   - created_at: TIMESTAMPTZ
   - updated_at: TIMESTAMPTZ (optional)

3. **follows** - Track user follows
   - id: UUID (primary key)
   - follower_id: UUID (foreign key to profiles.id)
   - following_id: UUID (foreign key to profiles.id)
   - created_at: TIMESTAMPTZ

## Features to Add

Some ideas for extending the application:

- Add like functionality to posts
- Implement comments on posts
- Add user profile pages
- Enable image uploads for posts and profiles
- Add notifications for follows, likes, and comments

## Deployment

The application can be deployed on [Vercel](https://vercel.com/) or any other platform that supports Next.js.

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy!

## License

MIT
