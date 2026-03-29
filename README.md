# BarMatch 🍸

A group social discovery app for nightlife. Go out to a bar, create a group session with your friends, and match with other groups at nearby venues.

## Tech Stack

- **React Native** with **Expo SDK 55** (iOS + Android)
- **Supabase** (Auth, PostgreSQL, Realtime, Storage)
- **TypeScript** throughout
- **Expo Router** (file-based navigation)
- **React Native Reanimated** (60fps swipe animations)
- **React Native Gesture Handler** (native gesture handling)

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a `.env` file in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

Run the SQL migration files in order in the Supabase SQL Editor:

```
supabase/migrations/001_users.sql
supabase/migrations/002_group_sessions.sql
supabase/migrations/003_group_members.sql
supabase/migrations/004_swipes.sql
supabase/migrations/005_matches.sql
supabase/migrations/006_messages.sql
supabase/migrations/007_rpc_functions.sql
supabase/migrations/008_storage.sql
supabase/migrations/009_realtime.sql
```

### 4. Create Storage Buckets

The `008_storage.sql` migration creates the buckets, but you can also create them manually:

- `avatars` (public)
- `group-photos` (public)

### 5. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## Project Structure

```
app/
  (auth)/           Auth screens (welcome, login, signup)
  (tabs)/           Main app tabs
    discover.tsx    Swipe card stack to discover groups
    group.tsx       Create/manage your group session
    matches/        Match list + chat
    profile.tsx     User profile + settings
  match-modal.tsx   "IT'S A MATCH" celebration
components/         Reusable UI components
hooks/              Custom React hooks
lib/                Supabase client, auth context, types, constants
supabase/
  migrations/       SQL schema + RPC functions + RLS policies
```

## Core Features

### Group Sessions
- Create a group with photo, name, bio, venue, and member count
- Sessions expire automatically after 5 hours
- Live countdown timer

### Discover & Swipe
- Card stack showing nearby active groups
- Swipe right to like, left to pass (or use buttons)
- Filter by distance (0.5-10 km) and age range
- Haversine formula for distance calculation

### Majority Vote Matching
- Individual swipes are recorded per user
- A "group like" requires majority vote (ceil(n/2) members)
- Mutual majority = match with celebration animation

### Real-Time Chat
- Supabase Realtime subscriptions
- Optimistic message sending
- Persistent chat per match

## Database RPC Functions

- `cast_vote_and_check_match()` - Atomic vote + match detection
- `get_nearby_sessions()` - Haversine distance-filtered discovery
- `expire_stale_sessions()` - Cleanup expired sessions (call via cron)

## Design

- Dark theme with deep purple + electric pink accents
- Nightlife aesthetic with bold typography
- Smooth 60fps card swipe animations
- Confetti celebration on match
