# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (interactive CLI)
npm start

# Run on specific platforms
npm run android      # Android emulator
npm run ios          # iOS simulator
npm run web          # Web browser

# Linting
npm run lint         # Run ESLint with Expo config
```

## Tech Stack

- **Framework**: React Native with Expo (~54.0) and Expo Router for file-based routing
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Database**: expo-sqlite with local SQLite database
- **State**: React useState hooks (no external state management library)

## Architecture

### Navigation Structure
The app uses Expo Router with a tab-based layout:
- `app/_layout.tsx` - Root Stack navigator with SQLite provider wrapper
- `app/(tabs)/_layout.tsx` - Bottom tab navigator (Calendar, Home, Profile)
- `app/(tabs)/index.tsx` - Workout planning (main feature)
- `app/(tabs)/profile.tsx` - User profile management
- `app/(tabs)/calendar.tsx` - Calendar (placeholder)

### Database Schema
SQLite database (`userDatabase2.db`) with these tables:
- **Exercises** - Master list of exercises with muscle_group and equipment_type
- **Workouts** - Named workout plans
- **Workout_Exercises** - Junction table linking workouts to exercises (many-to-many)
- **Records** - Workout logs with date, sets, reps, weight tracking
- **users** - User profile data

Database is initialized in `app/_layout.tsx` with foreign keys and WAL mode enabled. Exercise data (80+ exercises across 12 muscle groups) is bulk imported on first load.

### Component Patterns
Components use inline sub-components for logical separation (e.g., SavedPlanCard, Workout, DropdownComponent within index.tsx). Database access is via `useSQLiteContext()` hook from the provider.

## Key Files

- `app/_layout.tsx` - Database initialization, schema creation, exercise bulk import
- `app/(tabs)/index.tsx` - Main workout plan creation UI with CRUD operations
- `app/(tabs)/profile.tsx` - User profile with edit mode
- `tailwind.config.js` - NativeWind/Tailwind configuration
