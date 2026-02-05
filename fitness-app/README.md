# Glog

A sleek, dark-themed fitness tracking app built with React Native and Expo.

## Features

- **Workout Planning** - Create and manage custom workout plans with drag-and-drop exercise ordering
- **Exercise Library** - 80+ preset exercises across 12 muscle groups, plus custom exercise support
- **Performance Tracking** - Log sets, reps, weight, and half-reps for each exercise
- **Isolation Exercise Support** - Track left/right reps separately for unilateral exercises
- **Workout History** - View past workouts organized by month with full session details
- **Progress Persistence** - Auto-saves workout progress when navigating between tabs
- **Unit Toggle** - Switch between kg and lbs

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS) + StyleSheet
- **Database**: expo-sqlite (local SQLite)
- **State Management**: React useState hooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fitness-app.git
cd fitness-app

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## Project Structure

```
app/
├── _layout.tsx           # Root layout with SQLite provider
├── global.css            # Global styles
├── (tabs)/
│   ├── _layout.tsx       # Tab navigator configuration
│   ├── index.tsx         # Home - Start workout
│   ├── calendar.tsx      # Workout history
│   ├── profile.tsx       # User profile & workout plans
│   ├── edit-workout.tsx  # Create/edit workout plans
│   └── edit-record.tsx   # Edit past workout records
└── components/
    └── workout-input/
        ├── ExerciseCard.tsx
        ├── SetRow.tsx
        ├── NumberInput.tsx
        ├── UnitToggle.tsx
        └── types.ts
```

## Database Schema

| Table | Description |
|-------|-------------|
| `Exercises` | Master list of exercises (name, muscle group, equipment type, isolation flag) |
| `Workouts` | Named workout plans |
| `Workout_Exercises` | Junction table linking workouts to exercises with ordering |
| `Records` | Workout logs with date, sets, reps, weight tracking |
| `users` | User profile data and preferences |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server |
| `npm run ios` | Run on iOS Simulator |
| `npm run android` | Run on Android Emulator |
| `npm run web` | Run in web browser |
| `npm run lint` | Run ESLint |

## Design

The app features a modern dark theme with:
- Pure black backgrounds (`#000`)
- Dark grey cards (`#1C1C1E`)
- Silver/grey accents (`#A0A0A0`, `#6E6E73`)
- Off-white text (`#F5F5F5`)

## License

MIT License
