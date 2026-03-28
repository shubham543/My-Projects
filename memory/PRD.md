# Daily Progress Tracker - PRD

## Overview
A personal daily progress tracking mobile app that lets users log activities with timings, learnings, and sources. AI-powered daily reviews via Claude Sonnet 4.5 provide personalized improvement suggestions.

## Core Features
- **Daily Activity Logging**: 14 predefined activities (Work, Gym, Chess, Guitar, TV/Movies, Reading, Journalling, Shopping, Startup, Articles, AI Knowledge, Job Prep, Family Time, Rest) + custom activities
- **Activity Details**: Start/end time, quality rating (1-5 stars), notes, learnings, sources, and activity-specific extra fields
- **Mood Tracking**: 7 moods (Productive, Focused, Happy, Relaxed, Tired, Stressed, Neutral)
- **AI Daily Review**: Claude Sonnet 4.5 generates comprehensive daily reviews with score, wins, improvements, learning highlights, tomorrow's focus, balance check, and pro tips
- **Weekly Stats**: Activity breakdown, quality averages, daily heatmap, time tracking
- **Content Library**: Aggregated books, articles, TV shows, and movies from logs with search and filter
- **Log History**: Browse past daily logs with expandable detail view and review snippets
- **Theme**: Dark / Light / Auto mode support
- **Custom Activities**: Add/delete custom activities with icon and color selection

## Tech Stack
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: Expo React Native (SDK 54) with expo-router tab navigation
- **AI**: Claude Sonnet 4.5 via Emergent LLM Key (emergentintegrations library)
- **Storage**: MongoDB (progress_tracker database)
- **Theme**: React Context + AsyncStorage

## API Endpoints
- `GET/POST /api/logs/{date}` - Daily log CRUD
- `POST /api/review/generate` - Generate AI review
- `GET /api/reviews/{date}` - Get saved review
- `GET /api/stats/weekly?date=` - Weekly statistics
- `GET /api/library?filter_type=` - Content library
- `GET /api/history` - Log history
- `GET/POST/DELETE /api/custom-activities` - Custom activities CRUD
- `GET/PUT /api/settings/{key}` - Settings (theme)

## Schedule Context
- Work: 8 AM - 7 PM (weekdays), half day Saturday, off Sunday
- Balance: Gym, Hobbies, Job Prep, Family Time alongside work
