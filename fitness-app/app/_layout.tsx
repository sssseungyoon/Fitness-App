import { Stack } from "expo-router";
import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import "./global.css";

const USER_DB = "userDatabase8.db";

// Preset exercises with isolation flags
const exerciseList = [
  // --- CHEST ---
  { name: "Bench Press", muscle_group: "chest", equipment_type: "free-weight" },
  { name: "Incline Bench Press", muscle_group: "chest", equipment_type: "free-weight" },
  { name: "Decline Bench Press", muscle_group: "chest", equipment_type: "free-weight" },
  { name: "Dumbbell Chest Press", muscle_group: "chest", equipment_type: "free-weight" },
  { name: "Incline Dumbbell Press", muscle_group: "chest", equipment_type: "free-weight" },
  { name: "Dumbbell Chest Fly", muscle_group: "chest", equipment_type: "free-weight" },
  { name: "Machine Chest Press", muscle_group: "chest", equipment_type: "machine" },
  { name: "Machine Chest Fly", muscle_group: "chest", equipment_type: "machine" },
  { name: "Pec Deck", muscle_group: "chest", equipment_type: "machine" },
  { name: "Cable Chest Press", muscle_group: "chest", equipment_type: "machine" },
  { name: "Push-Up", muscle_group: "chest", equipment_type: "bodyweight" },
  { name: "Dips", muscle_group: "chest", equipment_type: "bodyweight" },

  // --- BACK ---
  { name: "Deadlift", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Pull-Up", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Chin-Up", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Lat Pulldown", muscle_group: "back", equipment_type: "machine" },
  { name: "Close-Grip Lat Pulldown", muscle_group: "back", equipment_type: "machine" },
  { name: "Single-Arm Lat Pulldown", muscle_group: "back", equipment_type: "machine", is_isolation: 1 },
  { name: "Straight Arm Pulldown", muscle_group: "back", equipment_type: "machine" },
  { name: "Barbell Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Dumbbell Row", muscle_group: "back", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Seated Cable Row", muscle_group: "back", equipment_type: "machine" },
  { name: "T-Bar Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Bent Over Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Meadows Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Chest-Supported Row", muscle_group: "back", equipment_type: "machine" },
  { name: "Inverted Row", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Back Extension", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Dumbbell Shrugs", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Barbell Shrugs", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Rack Pulls", muscle_group: "back", equipment_type: "free-weight" },

  // --- SHOULDERS ---
  { name: "Overhead Press", muscle_group: "shoulders", equipment_type: "free-weight" },
  { name: "Dumbbell Shoulder Press", muscle_group: "shoulders", equipment_type: "free-weight" },
  { name: "Arnold Press", muscle_group: "shoulders", equipment_type: "free-weight" },
  { name: "Dumbbell Lateral Raise", muscle_group: "shoulders", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Dumbbell Front Raise", muscle_group: "shoulders", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Dumbbell Rear Delt Row", muscle_group: "shoulders", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Face Pull", muscle_group: "shoulders", equipment_type: "machine" },
  { name: "Reverse Pec Deck", muscle_group: "shoulders", equipment_type: "machine" },
  { name: "Cable Lateral Raise", muscle_group: "shoulders", equipment_type: "machine" },
  { name: "Machine Shoulder Press", muscle_group: "shoulders", equipment_type: "machine" },
  { name: "Push Press", muscle_group: "shoulders", equipment_type: "free-weight" },
  { name: "Upright Row", muscle_group: "shoulders", equipment_type: "free-weight" },

  // --- ARMS ---
  { name: "Barbell Curl", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Dumbbell Curl", muscle_group: "arms", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Hammer Curl", muscle_group: "arms", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Incline Dumbbell Curl", muscle_group: "arms", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Preacher Curl", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Spider Curl", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Concentration Curl", muscle_group: "arms", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Cable Curl", muscle_group: "arms", equipment_type: "machine" },
  { name: "Machine Bicep Curl", muscle_group: "arms", equipment_type: "machine" },
  { name: "Tricep Pushdown (Bar)", muscle_group: "arms", equipment_type: "machine" },
  { name: "Tricep Pushdown (Rope)", muscle_group: "arms", equipment_type: "machine" },
  { name: "Skull Crushers", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Overhead Cable Extension", muscle_group: "arms", equipment_type: "machine" },
  { name: "Dumbbell Overhead Extension", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Close-Grip Bench Press", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "JM Press", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Bench Dip", muscle_group: "arms", equipment_type: "bodyweight" },
  { name: "Diamond Push-Up", muscle_group: "arms", equipment_type: "bodyweight" },

  // --- LEGS ---
  { name: "Squat", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Front Squat", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Leg Press", muscle_group: "legs", equipment_type: "machine" },
  { name: "Leg Extension", muscle_group: "legs", equipment_type: "machine" },
  { name: "Lying Leg Curl", muscle_group: "legs", equipment_type: "machine" },
  { name: "Seated Leg Curl", muscle_group: "legs", equipment_type: "machine" },
  { name: "Romanian Deadlift", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Bulgarian Split Squat", muscle_group: "legs", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Goblet Squat", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Lunges", muscle_group: "legs", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Hack Squat", muscle_group: "legs", equipment_type: "machine" },
  { name: "Step-Ups", muscle_group: "legs", equipment_type: "free-weight", is_isolation: 1 },
  { name: "Sissy Squat", muscle_group: "legs", equipment_type: "bodyweight" },
  { name: "Sumo Squat", muscle_group: "legs", equipment_type: "free-weight" },

  // --- GLUTES ---
  { name: "Hip Thrust", muscle_group: "glutes", equipment_type: "free-weight" },
  { name: "Glute Bridge", muscle_group: "glutes", equipment_type: "free-weight" },
  { name: "Cable Glute Kickback", muscle_group: "glutes", equipment_type: "machine", is_isolation: 1 },
  { name: "Hip Abduction Machine", muscle_group: "glutes", equipment_type: "machine" },

  // --- ABS ---
  { name: "Plank", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Crunch", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Leg Raise", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Hanging Leg Raise", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Cable Crunch", muscle_group: "abs", equipment_type: "machine" },
  { name: "Russian Twist", muscle_group: "abs", equipment_type: "free-weight" },
  { name: "Bicycle Crunch", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Dead Bug", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Ab Wheel Rollout", muscle_group: "abs", equipment_type: "free-weight" },
  { name: "Pallof Press", muscle_group: "abs", equipment_type: "machine" },
  { name: "Woodchoppers", muscle_group: "abs", equipment_type: "machine" },

  // --- CALVES ---
  { name: "Standing Calf Raise", muscle_group: "calves", equipment_type: "machine" },
  { name: "Seated Calf Raise", muscle_group: "calves", equipment_type: "machine" },
  { name: "Calf Raise in Leg Press", muscle_group: "calves", equipment_type: "machine" },

  // --- FOREARMS ---
  { name: "Barbell Wrist Curl", muscle_group: "forearms", equipment_type: "free-weight" },
  { name: "Farmers Walk", muscle_group: "forearms", equipment_type: "free-weight" },
];

const bulkImportExercises = async (db: SQLiteDatabase) => {
  try {
    // Check if exercises already exist
    const count = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM Exercises"
    );
    if (count && count.count > 0) {
      console.log("Exercises already imported, skipping bulk import");
      return;
    }

    await db.withTransactionAsync(async () => {
      for (const ex of exerciseList) {
        await db.runAsync(
          "INSERT OR IGNORE INTO Exercises (name, muscle_group, equipment_type, is_isolation) VALUES (?, ?, ?, ?)",
          [
            ex.name,
            ex.muscle_group,
            ex.equipment_type,
            (ex as any).is_isolation ?? 0,
          ]
        );
      }
    });
    console.log(`${exerciseList.length} exercises imported!`);
  } catch (error) {
    console.error("Bulk import failed:", error);
  }
};

const initializeDatabase = async (db: SQLiteDatabase) => {
  try {
    console.log("Initializing database...");

    await db.execAsync(`PRAGMA foreign_keys = ON;`);
    await db.execAsync(`PRAGMA journal_mode = WAL;`);

    // Create Exercises table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        muscle_group TEXT,
        equipment_type TEXT,
        is_custom INTEGER DEFAULT 0,
        is_isolation INTEGER DEFAULT 0
      );
    `);

    // Create Workouts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
    `);

    // Create Workout_Exercises junction table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Workout_Exercises (
        workout_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        PRIMARY KEY (workout_id, exercise_id),
        FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
      );
    `);

    // Create Records table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        workout_id INTEGER NOT NULL,
        exercise_id INTEGER,
        weight REAL,
        set_number INTEGER NOT NULL,
        reps INTEGER,
        half_reps INTEGER,
        left_reps INTEGER,
        right_reps INTEGER,
        FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE SET NULL
      );
    `);

    // Create users table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        weight_unit TEXT DEFAULT 'kg'
      );
    `);

    // Migration: Add columns for existing databases
    const migrations = [
      "ALTER TABLE Exercises ADD COLUMN is_custom INTEGER DEFAULT 0",
      "ALTER TABLE Exercises ADD COLUMN is_isolation INTEGER DEFAULT 0",
      "ALTER TABLE Records ADD COLUMN left_reps INTEGER",
      "ALTER TABLE Records ADD COLUMN right_reps INTEGER",
    ];

    for (const migration of migrations) {
      try {
        await db.execAsync(migration);
      } catch {
        // Column already exists, ignore
      }
    }

    // Import preset exercises
    await bulkImportExercises(db);

    console.log("Database initialization complete");
  } catch (error) {
    console.error("Database init failed:", error);
  }
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={USER_DB} onInit={initializeDatabase}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
