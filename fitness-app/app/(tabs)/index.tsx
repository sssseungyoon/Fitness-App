import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import { useEffect, useState } from "react";

const bulkImportExercises = async (db: SQLiteDatabase, exerciseList: any[]) => {
  try {
    await db.withTransactionAsync(async () => {
      for (const ex of exerciseList) {
        await db.runAsync(
          "INSERT OR IGNORE INTO Exercises (name, muscle_group, equipment_type) VALUES (?, ?, ?)",
          [
            ex.name || "", // Fallback to empty string
            ex.muscle_group ?? null, // Use null instead of undefined
            ex.equipment_type ?? null, // Use null instead of undefined
          ]
        );
      }
    });
    console.log(`${exerciseList.length} exercises checked/imported!`);
  } catch (error) {
    console.error("Bulk import failed:", error);
  }
};

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment_type: string;
}
const exerciseList: any = [
  // --- CHEST ---
  { name: "Bench Press", muscle_group: "chest", equipment_type: "free-weight" },
  {
    name: "Incline Bench Press",
    muscle_group: "chest",
    equipment_type: "free-weight",
  },
  {
    name: "Decline Bench Press",
    muscle_group: "chest",
    equipment_type: "free-weight",
  },
  {
    name: "Dumbbell Chest Press",
    muscle_group: "chest",
    equipment_type: "free-weight",
  },
  {
    name: "Incline Dumbbell Press",
    muscle_group: "chest",
    equipment_type: "free-weight",
  },
  {
    name: "Dumbbell Chest Fly",
    muscle_group: "chest",
    equipment_type: "free-weight",
  },
  {
    name: "Machine Chest Press",
    muscle_group: "chest",
    equipment_type: "machine",
  },
  {
    name: "Machine Chest Fly",
    muscle_group: "chest",
    equipment_type: "machine",
  },
  { name: "Pec Deck", muscle_group: "chest", equipment_type: "machine" },
  {
    name: "Cable Chest Press",
    muscle_group: "chest",
    equipment_type: "machine",
  },
  { name: "Push-Up", muscle_group: "chest", equipment_type: "bodyweight" },
  { name: "Dips", muscle_group: "chest", equipment_type: "bodyweight" },

  // --- SHOULDERS ---
  {
    name: "Overhead Press",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },
  {
    name: "Dumbbell Shoulder Press",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },
  {
    name: "Arnold Press",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },
  {
    name: "Dumbbell Lateral Raise",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },
  {
    name: "Dumbbell Front Raise",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },
  {
    name: "Dumbbell Rear Delt Row",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },
  { name: "Face Pull", muscle_group: "shoulders", equipment_type: "machine" },
  {
    name: "Cable Lateral Raise",
    muscle_group: "shoulders",
    equipment_type: "machine",
  },
  {
    name: "Machine Shoulder Press",
    muscle_group: "shoulders",
    equipment_type: "machine",
  },
  {
    name: "Push Press",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },

  // --- BICEPS ---
  { name: "Barbell Curl", muscle_group: "arms", equipment_type: "free-weight" },
  {
    name: "Dumbbell Curl",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  { name: "Hammer Curl", muscle_group: "arms", equipment_type: "free-weight" },
  {
    name: "Incline Dumbbell Curl",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  {
    name: "Preacher Curl",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  { name: "Cable Curl", muscle_group: "arms", equipment_type: "machine" },
  {
    name: "Machine Bicep Curl",
    muscle_group: "arms",
    equipment_type: "machine",
  },

  // --- TRICEPS ---
  {
    name: "Tricep Pushdown (Bar)",
    muscle_group: "arms",
    equipment_type: "machine",
  },
  {
    name: "Tricep Pushdown (Rope)",
    muscle_group: "arms",
    equipment_type: "machine",
  },
  {
    name: "Skull Crushers",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  {
    name: "Overhead Cable Extension",
    muscle_group: "arms",
    equipment_type: "machine",
  },
  {
    name: "Dumbbell Overhead Extension",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  {
    name: "Close-Grip Bench Press",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  { name: "Bench Dip", muscle_group: "arms", equipment_type: "bodyweight" },

  // --- LEGS ---
  { name: "Squat", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Front Squat", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Leg Press", muscle_group: "legs", equipment_type: "machine" },
  { name: "Leg Extension", muscle_group: "legs", equipment_type: "machine" },
  { name: "Lying Leg Curl", muscle_group: "legs", equipment_type: "machine" },
  { name: "Seated Leg Curl", muscle_group: "legs", equipment_type: "machine" },
  {
    name: "Romanian Deadlift",
    muscle_group: "legs",
    equipment_type: "free-weight",
  },
  {
    name: "Bulgarian Split Squat",
    muscle_group: "legs",
    equipment_type: "free-weight",
  },
  { name: "Goblet Squat", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Lunges", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Hack Squat", muscle_group: "legs", equipment_type: "machine" },

  // --- BACK ---
  { name: "Deadlift", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Pull-Up", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Chin-Up", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Lat Pulldown", muscle_group: "back", equipment_type: "machine" },
  { name: "Barbell Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Dumbbell Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Seated Cable Row", muscle_group: "back", equipment_type: "machine" },
  { name: "T-Bar Row", muscle_group: "back", equipment_type: "free-weight" },
  {
    name: "Bent Over Row",
    muscle_group: "back",
    equipment_type: "free-weight",
  },
  {
    name: "Back Extension",
    muscle_group: "back",
    equipment_type: "bodyweight",
  },

  // --- GLUTES ---
  { name: "Hip Thrust", muscle_group: "glutes", equipment_type: "free-weight" },
  {
    name: "Glute Bridge",
    muscle_group: "glutes",
    equipment_type: "free-weight",
  },
  {
    name: "Cable Glute Kickback",
    muscle_group: "glutes",
    equipment_type: "machine",
  },
  {
    name: "Hip Abduction Machine",
    muscle_group: "glutes",
    equipment_type: "machine",
  },

  // --- ABS ---
  { name: "Plank", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Crunch", muscle_group: "abs", equipment_type: "bodyweight" },
  { name: "Leg Raise", muscle_group: "abs", equipment_type: "bodyweight" },
  {
    name: "Hanging Leg Raise",
    muscle_group: "abs",
    equipment_type: "bodyweight",
  },
  { name: "Cable Crunch", muscle_group: "abs", equipment_type: "machine" },
  { name: "Russian Twist", muscle_group: "abs", equipment_type: "free-weight" },
  { name: "Bicycle Crunch", muscle_group: "abs", equipment_type: "bodyweight" },

  // --- CALVES ---
  {
    name: "Standing Calf Raise",
    muscle_group: "calves",
    equipment_type: "machine",
  },
  {
    name: "Seated Calf Raise",
    muscle_group: "calves",
    equipment_type: "machine",
  },
  {
    name: "Calf Raise in Leg Press",
    muscle_group: "calves",
    equipment_type: "machine",
  },

  // --- FOREARMS ---
  {
    name: "Barbell Wrist Curl",
    muscle_group: "forearms",
    equipment_type: "free-weight",
  },
  {
    name: "Farmers Walk",
    muscle_group: "forearms",
    equipment_type: "free-weight",
  },
];

interface WorkoutRow {
  rowId: number;
  exerciseId: number | null;
}

const MainView = () => {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  interface workoutPlanRow {
    rowId: number;
    workoutRow: WorkoutRow | null;
  }

  const [workoutPlanRow, setWorkoutPlanRow] = useState<workoutPlanRow[]>([
    {
      rowId: Date.now(),
      workoutRow: null,
    },
  ]);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        // 2. Only import if the table is empty
        await bulkImportExercises(db, exerciseList);
        const freshData = await db.getAllAsync<Exercise>(
          "SELECT * FROM Exercises"
        );
        setExercises(freshData);
      } catch (e) {
        console.error("Setup failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    setupDatabase();
  }, [db]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center ">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const removeWorkoutRow = (rowId: number) => {
    if (workoutPlanRow.length <= 1) {
      Alert.alert(
        "Error",
        "You need at least one workout for your workout plan"
      );
    } else {
      setWorkoutPlanRow((prev) => prev.filter((row) => row.rowId !== rowId));
    }
  };

  const addWorkoutRow = () => {
    setWorkoutPlanRow([
      ...workoutPlanRow,
      { rowId: Date.now(), workoutRow: null },
    ]);
  };

  return (
    <View>
      <ScrollView>
        {workoutPlanRow.map((workout) => (
          <View key={workout.rowId}>
            <Workout exercises={exercises} />
            <TouchableOpacity
              onPress={() => {
                removeWorkoutRow(workout.rowId);
              }}
            >
              <Text>Delete a Workout</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <View>
        <TouchableOpacity onPress={addWorkoutRow}>
          <Text>Add Another Workout</Text>
        </TouchableOpacity>
      </View>
      <View>
        <TouchableOpacity>
          <Text>Save the Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DropdownComponent = ({
  labelField,
  valueField,
  placeholder,
  data,
  onValueChange,
}: {
  labelField: string;
  valueField: string;
  placeholder: string;
  data: any;
  onValueChange: (val: any) => void;
}) => {
  const [value, setValue] = useState(null);

  return (
    <View style={styles.container}>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        data={data}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        value={value}
        onChange={(item) => {
          const val = item[valueField];
          setValue(val);
          onValueChange(val);
        }}
      />
    </View>
  );
};

const NameField = () => {
  const [value, setValue] = useState("");
  return (
    <View className="flex-1">
      <Text>Name of the Workout: </Text>
      <TextInput
        value={value}
        placeholder="Enter here..."
        onChangeText={(text) => {
          setValue(text);
        }}
      />
    </View>
  );
};

const Workout = ({ exercises }: any) => {
  interface WorkoutRow {
    rowId: number;
    exerciseId: number | null;
  }
  const [workoutRows, setWorkoutRows] = useState<WorkoutRow[]>([
    {
      rowId: Date.now(),
      exerciseId: null,
    },
  ]);

  // This function is the "bridge"
  const handleSelectExercise = (rowId: number, selectedId: number) => {
    setWorkoutRows((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, exerciseId: selectedId } : row
      )
    );
  };

  const addRow = () => {
    setWorkoutRows([...workoutRows, { rowId: Date.now(), exerciseId: null }]);
  };

  const removeRow = (rowId: number) => {
    if (workoutRows.length <= 1) {
      Alert.alert("Error", "You need at least one exercise in your workout");
    } else {
      setWorkoutRows((prev) => prev.filter((row) => row.rowId !== rowId));
    }
  };

  return (
    <View className="flex-1">
      <NameField />
      <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
        {workoutRows.map((row) => (
          <View key={row.rowId}>
            <DropdownComponent
              labelField="name"
              valueField="id" // Better to use ID for values
              placeholder="Select an Exercise"
              data={exercises}
              onValueChange={(exerciseId: number) =>
                handleSelectExercise(row.rowId, exerciseId)
              }
            />
            <TouchableOpacity
              onPress={() => {
                removeRow(row.rowId);
              }}
            >
              <Text>Delete an Exercise</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={addRow}>
        <Text>Add Another Exercise</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Index() {
  const userDB = "userDatabase.db";

  const handleOnInit = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(`PRAGMA foreign_keys = ON;`);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
  
        CREATE TABLE IF NOT EXISTS Exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE, -- Required
          muscle_group TEXT,  -- Optional
          equipment_type TEXT -- Optional
        );
  
        CREATE TABLE IF NOT EXISTS Workouts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL  -- Required
        );
  
        CREATE TABLE IF NOT EXISTS Workout_Exercises (
          workout_id INTEGER NOT NULL,
          exercise_id INTEGER NOT NULL,
          PRIMARY KEY (workout_id, exercise_id),
          FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
        );
  
        CREATE TABLE IF NOT EXISTS Records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Required
          workout_id INTEGER NOT NULL,                  -- Required
          exercise_id INTEGER,                           -- Nullable for SET NULL
          
          -- These stay nullable so you don't get errors if a user skips them
          weight REAL, 
          set_number INTEGER NOT NULL,                   -- Required for tracking order
          reps INTEGER,
          half_reps INTEGER,
          
          FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE SET NULL
        );
      `);
    } catch (error) {
      console.error("Init failed:", error);
    }
  };

  return (
    <SafeAreaView>
      <SQLiteProvider
        databaseName={userDB}
        onInit={handleOnInit}
        options={{
          useNewConnection: false,
        }}
      >
        <MainView />
      </SQLiteProvider>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16 },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  placeholderStyle: { fontSize: 16 },
  selectedTextStyle: { fontSize: 16 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
