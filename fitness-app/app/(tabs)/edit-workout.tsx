import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";

// Constants for custom exercise feature
const ADD_CUSTOM_EXERCISE_ID = -1;
const ADD_CUSTOM_ITEM = {
  id: ADD_CUSTOM_EXERCISE_ID,
  name: "+ Add Custom Exercise",
  muscle_group: "_action",
  equipment_type: "",
  is_custom: 0,
};

const MUSCLE_GROUPS = [
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Arms", value: "arms" },
  { label: "Legs", value: "legs" },
  { label: "Glutes", value: "glutes" },
  { label: "Abs", value: "abs" },
  { label: "Calves", value: "calves" },
  { label: "Forearms", value: "forearms" },
];

const EQUIPMENT_TYPES = [
  { label: "Free Weight", value: "free-weight" },
  { label: "Machine", value: "machine" },
  { label: "Bodyweight", value: "bodyweight" },
];

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
  is_custom: number;
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

  // --- BACK ---
  { name: "Deadlift", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Pull-Up", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Chin-Up", muscle_group: "back", equipment_type: "bodyweight" },
  { name: "Lat Pulldown", muscle_group: "back", equipment_type: "machine" },
  {
    name: "Close-Grip Lat Pulldown",
    muscle_group: "back",
    equipment_type: "machine",
  },
  {
    name: "Single-Arm Lat Pulldown",
    muscle_group: "back",
    equipment_type: "machine",
  },
  {
    name: "Straight Arm Pulldown",
    muscle_group: "back",
    equipment_type: "machine",
  },
  { name: "Barbell Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Dumbbell Row", muscle_group: "back", equipment_type: "free-weight" },
  { name: "Seated Cable Row", muscle_group: "back", equipment_type: "machine" },
  { name: "T-Bar Row", muscle_group: "back", equipment_type: "free-weight" },
  {
    name: "Bent Over Row",
    muscle_group: "back",
    equipment_type: "free-weight",
  },
  { name: "Meadows Row", muscle_group: "back", equipment_type: "free-weight" },
  {
    name: "Chest-Supported Row",
    muscle_group: "back",
    equipment_type: "machine",
  },
  { name: "Inverted Row", muscle_group: "back", equipment_type: "bodyweight" },
  {
    name: "Back Extension",
    muscle_group: "back",
    equipment_type: "bodyweight",
  },
  {
    name: "Dumbbell Shrugs",
    muscle_group: "back",
    equipment_type: "free-weight",
  },
  {
    name: "Barbell Shrugs",
    muscle_group: "back",
    equipment_type: "free-weight",
  },
  { name: "Rack Pulls", muscle_group: "back", equipment_type: "free-weight" },

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
    name: "Reverse Pec Deck",
    muscle_group: "shoulders",
    equipment_type: "machine",
  },
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
  {
    name: "Upright Row",
    muscle_group: "shoulders",
    equipment_type: "free-weight",
  },

  // --- ARMS ---
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
  { name: "Spider Curl", muscle_group: "arms", equipment_type: "free-weight" },
  {
    name: "Concentration Curl",
    muscle_group: "arms",
    equipment_type: "free-weight",
  },
  { name: "Cable Curl", muscle_group: "arms", equipment_type: "machine" },
  {
    name: "Machine Bicep Curl",
    muscle_group: "arms",
    equipment_type: "machine",
  },
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
  { name: "JM Press", muscle_group: "arms", equipment_type: "free-weight" },
  { name: "Bench Dip", muscle_group: "arms", equipment_type: "bodyweight" },
  {
    name: "Diamond Push-Up",
    muscle_group: "arms",
    equipment_type: "bodyweight",
  },

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
  { name: "Step-Ups", muscle_group: "legs", equipment_type: "free-weight" },
  { name: "Sissy Squat", muscle_group: "legs", equipment_type: "bodyweight" },
  { name: "Sumo Squat", muscle_group: "legs", equipment_type: "free-weight" },

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
  { name: "Dead Bug", muscle_group: "abs", equipment_type: "bodyweight" },
  {
    name: "Ab Wheel Rollout",
    muscle_group: "abs",
    equipment_type: "free-weight",
  },
  { name: "Pallof Press", muscle_group: "abs", equipment_type: "machine" },
  { name: "Woodchoppers", muscle_group: "abs", equipment_type: "machine" },

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

interface Workout {
  rowId: number;
  name: string;
  exercises: { rowId: number; exerciseId: number | null }[];
}

// Add Custom Exercise Modal Component
const AddExerciseModal = ({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, muscleGroup: string, equipmentType: string) => void;
}) => {
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [equipmentType, setEquipmentType] = useState<string | null>(null);

  const handleSave = () => {
    if (!exerciseName.trim()) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }
    if (!muscleGroup) {
      Alert.alert("Error", "Please select a muscle group");
      return;
    }
    if (!equipmentType) {
      Alert.alert("Error", "Please select an equipment type");
      return;
    }
    onSave(exerciseName.trim(), muscleGroup, equipmentType);
    // Reset form
    setExerciseName("");
    setMuscleGroup(null);
    setEquipmentType(null);
  };

  const handleClose = () => {
    setExerciseName("");
    setMuscleGroup(null);
    setEquipmentType(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Custom Exercise</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.label}>Exercise Name</Text>
            <TextInput
              style={styles.input}
              value={exerciseName}
              placeholder="e.g., Seated Row Machine"
              placeholderTextColor="#999"
              onChangeText={setExerciseName}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Muscle Group</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={MUSCLE_GROUPS}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select muscle group"
              value={muscleGroup}
              onChange={(item) => setMuscleGroup(item.value)}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>
              Equipment Type
            </Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={EQUIPMENT_TYPES}
              maxHeight={200}
              labelField="label"
              valueField="value"
              placeholder="Select equipment type"
              value={equipmentType}
              onChange={(item) => setEquipmentType(item.value)}
            />

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 24 }]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const MainView = () => {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);

  const [workoutPlan, setWorkoutPlan] = useState([
    {
      rowId: Date.now(),
      name: "",
      exercises: [{ rowId: Date.now(), exerciseId: null }],
    },
  ]);

  const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);

  const fetchSavedWorkouts = async () => {
    try {
      // This query joins the junction table with the exercise names
      const result = await db.getAllAsync(`
      SELECT
        w.id AS workoutId,
        w.name AS workoutName,
        e.name AS exerciseName,
        e.id AS exerciseId
      FROM Workouts w
      LEFT JOIN Workout_Exercises we ON w.id = we.workout_id
      LEFT JOIN Exercises e ON we.exercise_id = e.id
      ORDER BY w.id DESC
    `);

      interface GroupedWorkout {
        id: number;
        name: string;
        exercises: { id: number; name: string }[];
      }

      // Grouping the flat rows by Workout ID
      const grouped = result.reduce<{ [key: number]: GroupedWorkout }>(
        (acc: any, row: any) => {
          const { workoutId, workoutName, exerciseName, exerciseId } = row;
          if (!acc[workoutId]) {
            acc[workoutId] = {
              id: workoutId,
              name: workoutName,
              exercises: [],
            };
          }
          if (exerciseName && exerciseId) {
            acc[workoutId].exercises.push({
              id: exerciseId,
              name: exerciseName,
            });
          }
          return acc;
        },
        {}
      );

      setSavedWorkouts(Object.values(grouped));
    } catch (error) {
      console.error("Fetch failed", error);
    }
  };

  const fetchExercises = async () => {
    try {
      // First check if is_custom column exists
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(Exercises)"
      );
      const hasIsCustom = tableInfo.some((col) => col.name === "is_custom");
      console.log("Has is_custom column:", hasIsCustom);

      let freshData: Exercise[];
      if (hasIsCustom) {
        freshData = await db.getAllAsync<Exercise>(
          "SELECT id, name, muscle_group, equipment_type, is_custom FROM Exercises ORDER BY is_custom DESC, muscle_group ASC, name ASC"
        );
      } else {
        freshData = await db.getAllAsync<Exercise>(
          "SELECT id, name, muscle_group, equipment_type, 0 as is_custom FROM Exercises ORDER BY muscle_group ASC, name ASC"
        );
      }
      console.log("Fetched exercises:", freshData.length);
      setExercises(freshData);
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
    }
  };

  const saveCustomExercise = async (
    name: string,
    muscleGroup: string,
    equipmentType: string
  ) => {
    try {
      await db.runAsync(
        "INSERT INTO Exercises (name, muscle_group, equipment_type, is_custom) VALUES (?, ?, ?, 1)",
        [name, muscleGroup, equipmentType]
      );
      await fetchExercises();
      setShowAddExerciseModal(false);
      Alert.alert("Success", `"${name}" has been added to your exercises!`);
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint failed")) {
        Alert.alert("Error", "An exercise with this name already exists");
      } else {
        console.error("Failed to save custom exercise:", error);
        Alert.alert("Error", "Failed to save exercise");
      }
    }
  };

  const deleteCustomExercise = (exerciseId: number, exerciseName: string) => {
    Alert.alert(
      "Delete Exercise",
      `Are you sure you want to delete "${exerciseName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync(
                "DELETE FROM Exercises WHERE id = ? AND is_custom = 1",
                [exerciseId]
              );
              await fetchExercises();
            } catch (error) {
              console.error("Failed to delete exercise:", error);
              Alert.alert("Error", "Failed to delete exercise");
            }
          },
        },
      ]
    );
  };

  // Prepare exercise list with custom exercises first, then add the "Add Custom" action item
  const getDropdownData = () => {
    console.log("Exercises count:", exercises.length);
    // Sort: custom first, then by muscle group
    const sorted = [...exercises].sort((a, b) => {
      if (a.is_custom && !b.is_custom) return -1;
      if (!a.is_custom && b.is_custom) return 1;
      return 0;
    });
    return [ADD_CUSTOM_ITEM, ...sorted];
  };

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log("Starting database setup...");
        // Add is_custom column if it doesn't exist (for existing databases)
        try {
          await db.execAsync(
            `ALTER TABLE Exercises ADD COLUMN is_custom INTEGER DEFAULT 0;`
          );
          console.log("Added is_custom column");
        } catch {
          // Column already exists, ignore error
        }
        // 2. Only import if the table is empty
        await bulkImportExercises(db, exerciseList);
        console.log("Bulk import done, fetching exercises...");
        await fetchExercises();
        console.log("Exercises fetched, fetching workouts...");
        fetchSavedWorkouts();
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
    if (workoutPlan.length <= 1) {
      Alert.alert(
        "Error",
        "You need at least one workout for your workout plan"
      );
    } else {
      setWorkoutPlan((prev) => prev.filter((row) => row.rowId !== rowId));
    }
  };

  const addWorkoutRow = () => {
    setWorkoutPlan([
      ...workoutPlan,
      {
        rowId: Date.now(),
        name: "",
        exercises: [{ rowId: Date.now() + 1, exerciseId: null }],
      },
    ]);
  };

  const workoutNameUpdate = (rowId: number, name: string) => {
    setWorkoutPlan((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, name: name } : row))
    );
  };

  const workoutExerciseUpdate = (rowId: number, updatedExercises: any) => {
    setWorkoutPlan((prev) =>
      prev.map((row) =>
        row.rowId === rowId ? { ...row, exercises: updatedExercises } : row
      )
    );
  };

  const SavedPlanCard = ({ workout, onDelete, onEdit }: any) => (
    <View style={styles.workoutCard}>
      <View style={styles.savedCardHeader}>
        <Text style={styles.savedWorkoutTitle}>{workout.name}</Text>
        <View className="flex-row">
          <TouchableOpacity onPress={() => onEdit(workout)} className="mr-3">
            <Text className="text-blue-500 text-sm font-semibold">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(workout.id)}>
            <Text style={styles.deleteIconText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {workout?.exercises?.map(
        (ex: { id: number; name: string }, index: number) => (
          <View
            key={`${workout.id}-${ex.id}-${index}`}
            style={styles.savedExerciseRow}
          >
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.savedExerciseText}>{ex.name}</Text>
          </View>
        )
      )}
    </View>
  );

  const handleEditWorkout = (savedWorkout: any) => {
    setEditingWorkoutId(savedWorkout.id);
    const editingWorkout = {
      rowId: Date.now(),
      name: savedWorkout.name,
      exercises: savedWorkout.exercises.map((ex: any, idx: number) => ({
        rowId: Date.now() + idx + 1,
        exerciseId: ex.id,
      })),
    };
    setWorkoutPlan([editingWorkout]);
  };

  const handleOnSave = async () => {
    try {
      await db.withTransactionAsync(async () => {
        // If editing, delete the old workout first
        if (editingWorkoutId) {
          await db.runAsync("DELETE FROM Workouts WHERE id = ?", [
            editingWorkoutId,
          ]);
        }

        for (const workout of workoutPlan) {
          const result = await db.runAsync(
            `INSERT INTO Workouts (name) VALUES (?)`,
            [workout.name || "New Workout"]
          );
          const workoutId = result.lastInsertRowId;
          for (const exercise of workout.exercises) {
            if (exercise.exerciseId) {
              await db.runAsync(
                "INSERT INTO Workout_Exercises (workout_id, exercise_id) VALUES (?,?)",
                [workoutId, exercise.exerciseId]
              );
            }
          }
        }
      });
      setEditingWorkoutId(null);
      await fetchSavedWorkouts(); // Refetch data to update the 'savedWorkouts' state
      // 2. RESET THE FORM
      // We set it back to a fresh array with one empty workout and one empty exercise row
      setWorkoutPlan([
        {
          rowId: Date.now(), // Unique ID for the new row
          name: "",
          exercises: [{ rowId: Date.now() + 1, exerciseId: null }],
        },
      ]);
      Alert.alert("Success", "Your workout plan has been saved!");
    } catch (exception) {
      console.log(exception);
      Alert.alert("Error", "Couldn't save your workout plan");
    }
  };

  const deleteSavedWorkout = async (workoutId: number) => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to remove this saved plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete the workout. foreign keys handle the rest!
              await db.runAsync("DELETE FROM Workouts WHERE id = ?", [
                workoutId,
              ]);

              // Refresh the UI
              await fetchSavedWorkouts();
            } catch (error) {
              console.error("Delete failed", error);
              Alert.alert("Error", "Could not delete workout.");
            }
          },
        },
      ]
    );
  };

  // upon onChange, the components must call the helper function along with the new value
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 1. DISPLAY SAVED WORKOUTS FROM DB */}
        <Text>Saved Plans</Text>
        {savedWorkouts.map((workout) => (
          <SavedPlanCard
            key={workout.id}
            workout={workout}
            onDelete={deleteSavedWorkout}
            onEdit={handleEditWorkout}
          />
        ))}
        {workoutPlan.map((workout) => (
          <View key={workout.rowId}>
            <Workout
              exerciseList={getDropdownData()}
              data={workout}
              nameUpdate={workoutNameUpdate}
              exerciseUpdate={workoutExerciseUpdate}
              onAddCustomExercise={() => setShowAddExerciseModal(true)}
              onDeleteCustomExercise={deleteCustomExercise}
            />
            <TouchableOpacity
              style={styles.deleteWorkoutButton}
              onPress={() => removeWorkoutRow(workout.rowId)}
            >
              <Text style={styles.deleteWorkoutText}>Remove This Workout</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={addWorkoutRow}
        >
          <Text style={styles.secondaryButtonText}>+ Add Another Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 12 }]}
          onPress={handleOnSave}
        >
          <Text style={styles.buttonText}>Save Complete Plan</Text>
        </TouchableOpacity>
      </View>

      <AddExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onSave={saveCustomExercise}
      />
    </SafeAreaView>
  );
};

const DropdownComponent = ({
  labelField,
  valueField,
  placeholder,
  data,
  onValueChange,
  initialValue,
  onAddCustomExercise,
  onDeleteCustomExercise,
}: any) => {
  const [value, setValue] = useState(initialValue ?? null);

  const renderItem = (item: any) => {
    // Handle the special "Add Custom Exercise" action item
    if (item.id === ADD_CUSTOM_EXERCISE_ID) {
      return (
        <View style={styles.addCustomItem}>
          <Text style={styles.addCustomItemText}>{item.name}</Text>
        </View>
      );
    }

    // Find the index of the current item in the full list (excluding action item)
    const currentIndex = data.findIndex((i: any) => i.id === item.id);

    // Check if the previous item had a different muscle group
    // For custom exercises, show "CUSTOM" section header
    const isCustom = item.is_custom === 1;
    const prevItem = currentIndex > 0 ? data[currentIndex - 1] : null;

    let isNewSection = false;
    if (currentIndex === 1) {
      // First real item after "Add Custom" action
      isNewSection = true;
    } else if (prevItem && prevItem.id !== ADD_CUSTOM_EXERCISE_ID) {
      // Check if transitioning between custom and non-custom or between muscle groups
      if (isCustom !== (prevItem.is_custom === 1)) {
        isNewSection = true;
      } else if (!isCustom && prevItem.muscle_group !== item.muscle_group) {
        isNewSection = true;
      }
    }

    const sectionLabel = isCustom ? "CUSTOM" : item.muscle_group?.toUpperCase();

    return (
      <View>
        {isNewSection && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{sectionLabel}</Text>
          </View>
        )}
        <View
          style={[styles.dropdownItem, isCustom && styles.customExerciseItem]}
        >
          <Text
            style={[styles.itemTextMain, isCustom && styles.customExerciseText]}
          >
            {item.name}
          </Text>
          {isCustom && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDeleteCustomExercise(item.id, item.name);
              }}
              style={styles.deleteExerciseButton}
            >
              <Text style={styles.deleteExerciseIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        containerStyle={styles.dropdownListContainer}
        data={data}
        maxHeight={400}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        value={value}
        autoScroll={false}
        onChange={(item) => {
          // Handle the special "Add Custom Exercise" action
          if (item.id === ADD_CUSTOM_EXERCISE_ID) {
            onAddCustomExercise();
            return; // Don't update the value
          }
          const val = item[valueField];
          setValue(val);
          onValueChange(val);
        }}
        renderItem={renderItem}
      />
    </View>
  );
};

const Workout = ({
  exerciseList,
  data,
  nameUpdate,
  exerciseUpdate,
  onAddCustomExercise,
  onDeleteCustomExercise,
}: any) => {
  const handleSelectExercise = (rowId: number, selectedId: number) => {
    const updatedExercises = data.exercises.map((row: any) =>
      row.rowId === rowId ? { ...row, exerciseId: selectedId } : row
    );
    exerciseUpdate(data.rowId, updatedExercises);
  };

  const addRow = () => {
    const newExercises = [
      ...data.exercises,
      { rowId: Date.now(), exerciseId: null },
    ];
    exerciseUpdate(data.rowId, newExercises);
  };

  const removeRow = (rowId: number) => {
    if (data.exercises.length <= 1) {
      Alert.alert("Error", "You need at least one exercise");
    } else {
      const filtered = data.exercises.filter((row: any) => row.rowId !== rowId);
      exerciseUpdate(data.rowId, filtered);
    }
  };

  return (
    <View style={styles.workoutCard}>
      <Text style={styles.label}>Workout Name</Text>
      <TextInput
        style={styles.input}
        value={data.name}
        placeholder="e.g., Heavy Push Day"
        placeholderTextColor="#999"
        onChangeText={(text) => nameUpdate(data.rowId, text)}
      />

      <Text style={[styles.label, { marginTop: 10 }]}>Exercises</Text>
      {data.exercises.map((row: any) => (
        <View key={row.rowId} style={styles.exerciseRow}>
          <View style={{ flex: 1 }}>
            <DropdownComponent
              labelField="name"
              valueField="id"
              placeholder="Select Exercise"
              data={exerciseList}
              onValueChange={(id: number) =>
                handleSelectExercise(row.rowId, id)
              }
              initialValue={row.exerciseId}
              onAddCustomExercise={onAddCustomExercise}
              onDeleteCustomExercise={onDeleteCustomExercise}
            />
          </View>
          <TouchableOpacity
            style={styles.inlineDeleteButton}
            onPress={() => removeRow(row.rowId)}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addExerciseButton} onPress={addRow}>
        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
      </TouchableOpacity>
    </View>
  );
};

// Export MainView for use in modal (when already wrapped in SQLiteProvider)
export { MainView as EditWorkoutView };

export default function EditWorkout() {
  const userDB = "userDatabase7.db";

  const handleOnInit = async (db: SQLiteDatabase) => {
    try {
      console.log("Initializing database...");
      await db.execAsync(`PRAGMA foreign_keys = ON;`);
      await db.execAsync(`PRAGMA journal_mode = WAL;`);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          muscle_group TEXT,
          equipment_type TEXT,
          is_custom INTEGER DEFAULT 0
        );
      `);
      console.log("Exercises table created");

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Workouts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        );
      `);
      console.log("Workouts table created");

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS Workout_Exercises (
          workout_id INTEGER NOT NULL,
          exercise_id INTEGER NOT NULL,
          PRIMARY KEY (workout_id, exercise_id),
          FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE CASCADE
        );
      `);
      console.log("Workout_Exercises table created");

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
          FOREIGN KEY (workout_id) REFERENCES Workouts(id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES Exercises(id) ON DELETE SET NULL
        );
      `);
      console.log("Records table created");

      // Add is_custom column if it doesn't exist (for existing databases)
      try {
        await db.execAsync(
          `ALTER TABLE Exercises ADD COLUMN is_custom INTEGER DEFAULT 0;`
        );
        console.log("Added is_custom column");
      } catch {
        // Column already exists, ignore error
      }

      console.log("Database initialization complete");
    } catch (error) {
      console.error("Init failed:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // Light grey background
  },
  scrollContainer: {
    padding: 16,
  },
  workoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdown: {
    height: 45,
    borderColor: "#DDD",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
  },
  inlineDeleteButton: {
    padding: 10,
    marginLeft: 8,
    justifyContent: "center",
  },
  deleteText: {
    color: "#FF3B30", // iOS Red
    fontSize: 20,
    fontWeight: "bold",
  },
  addExerciseButton: {
    marginTop: 8,
    padding: 10,
    alignItems: "center",
  },
  addExerciseText: {
    color: "#007AFF", // iOS Blue
    fontWeight: "600",
  },
  deleteWorkoutButton: {
    backgroundColor: "#FFF1F0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFA39E",
  },
  deleteWorkoutText: {
    color: "#CF1322",
    fontWeight: "600",
  },
  footerActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    backgroundColor: "#FFF",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#000",
  },
  savedWorkoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 12,
  },
  savedExerciseRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  bullet: {
    fontSize: 18,
    color: "#007AFF",
    marginRight: 8,
    width: 10,
  },
  savedExerciseText: {
    fontSize: 16,
    color: "#3A3A3C",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#8E8E93",
  },
  sectionHeader: {
    backgroundColor: "#F2F2F7", // Light grey background for the header
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8E8E93",
    letterSpacing: 1,
  },
  dropdownItem: {
    padding: 15,
    backgroundColor: "#FFF",
  },
  dropdownListContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  itemTextMain: {
    fontSize: 16,
    color: "#000",
  },
  savedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deleteIconText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#8E8E93",
  },
  modalBody: {
    padding: 20,
  },
  // Custom exercise dropdown styles
  addCustomItem: {
    padding: 15,
    backgroundColor: "#E8F4FD",
    borderBottomWidth: 1,
    borderBottomColor: "#B8D9F0",
  },
  addCustomItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  customExerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
  },
  customExerciseText: {
    color: "#996600",
  },
  deleteExerciseButton: {
    padding: 8,
  },
  deleteExerciseIcon: {
    fontSize: 16,
  },
});
