# VibeTrack

A high-performance Habit & Time Tracker built with React Native (Expo) and Supabase.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Supabase Setup**:
    - Create a new Supabase project.
    - Run the SQL from `supabase_schema.sql` in the Supabase SQL Editor.
    - Copy your Project URL and Anon Key.

3.  **Environment Variables**:
    - Rename `.env.example` to `.env`.
    - Paste your Supabase URL and Key.

4.  **Run the App**:
    ```bash
    npx expo start
    ```
    - Scan the QR code with Expo Go (Android/iOS).

## Features
- **Time Tracker**: Log tasks with categories and value scores.
- **Habit Tracker**: Track daily habits and streaks.
- **Dashboard**: View today's focus and active timer.
