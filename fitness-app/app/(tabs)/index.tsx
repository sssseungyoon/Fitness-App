import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";

const DRAFT_STORAGE_KEY = "workout_draft";

interface SetData {
  setNumber: number;
  weight: number;
  reps: number;
  halfReps: number;
}

interface PreviousSetData {
  setNumber: number;
  weight: number;
  reps: number;
  halfReps: number;
  date: string;
}

interface ExerciseRecord {
  exerciseId: number;
  exerciseName: string;
  equipmentType: string;
  sets: SetData[];
  previousSets: PreviousSetData[];
}

interface SavedWorkout {
  id: number;
  name: string;
  exercises: { id: number; name: string; equipment_type: string }[];
}

// Number Input with +/- buttons and manual text entry
const NumberInput = ({
  value,
  onChange,
  step = 1,
  unit,
  label,
  min = 0,
  max = 9999,
  isInteger = false,
}: {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  unit?: string;
  label: string;
  min?: number;
  max?: number;
  isInteger?: boolean;
}) => {
  const [textValue, setTextValue] = useState(
    isInteger ? value.toString() : value.toFixed(1)
  );

  // Sync text value when external value changes
  useEffect(() => {
    setTextValue(isInteger ? value.toString() : value.toFixed(1));
  }, [value, isInteger]);

  const increment = () => {
    const newVal = Math.min(max, value + step);
    onChange(Number(newVal.toFixed(1)));
  };

  const decrement = () => {
    const newVal = Math.max(min, value - step);
    onChange(Number(newVal.toFixed(1)));
  };

  const handleTextChange = (text: string) => {
    // Allow empty string, numbers, and one decimal point
    if (isInteger) {
      // Only allow digits
      if (/^\d*$/.test(text)) {
        setTextValue(text);
      }
    } else {
      // Allow digits and one decimal point
      if (/^\d*\.?\d*$/.test(text)) {
        setTextValue(text);
      }
    }
  };

  const handleBlur = () => {
    const num = parseFloat(textValue);
    if (!isNaN(num) && num >= min && num <= max) {
      // Round to step precision
      const rounded = isInteger
        ? Math.round(num)
        : Math.round(num / step) * step;
      const clamped = Math.max(min, Math.min(max, rounded));
      onChange(Number(clamped.toFixed(1)));
      setTextValue(isInteger ? clamped.toString() : clamped.toFixed(1));
    } else {
      // Reset to current value if invalid
      setTextValue(isInteger ? value.toString() : value.toFixed(1));
    }
  };

  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-gray-600 text-sm w-16">{label}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={decrement}
          className="w-12 h-12 bg-gray-200 rounded-l-lg items-center justify-center"
        >
          <Text className="text-2xl font-bold text-gray-700">−</Text>
        </TouchableOpacity>
        <TextInput
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType={isInteger ? "number-pad" : "decimal-pad"}
          selectTextOnFocus
          style={{
            width: 70,
            height: 48,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#E5E5E5",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
            paddingVertical: 0,
          }}
        />
        <TouchableOpacity
          onPress={increment}
          className="w-12 h-12 bg-blue-500 rounded-r-lg items-center justify-center"
        >
          <Text className="text-2xl font-bold text-white">+</Text>
        </TouchableOpacity>
        {unit && <Text className="text-gray-600 ml-2 w-10">{unit}</Text>}
      </View>
    </View>
  );
};

// Set Row Component
const SetRow = ({
  setData,
  setIndex,
  equipmentType,
  weightUnit,
  onUpdate,
  onRemove,
  canRemove,
}: {
  setData: SetData;
  setIndex: number;
  equipmentType: string;
  weightUnit: "kg" | "lbs";
  onUpdate: (updated: SetData) => void;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  // Calculate weight increment based on unit and equipment type
  const getWeightStep = () => {
    if (weightUnit === "kg") {
      return 1;
    } else {
      return equipmentType === "machine" ? 5 : 2.5;
    }
  };

  const weightStep = getWeightStep();

  return (
    <View className="bg-gray-50 rounded-lg p-3 mb-2">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-semibold text-gray-800">Set {setIndex + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Text className="text-red-500 text-sm">Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <NumberInput
        label="Weight"
        value={setData.weight}
        step={weightStep}
        unit={weightUnit}
        isInteger={weightUnit === "kg"}
        onChange={(val) => onUpdate({ ...setData, weight: val })}
      />

      <NumberInput
        label="Reps"
        value={setData.reps}
        step={1}
        max={100}
        isInteger={true}
        onChange={(val) => onUpdate({ ...setData, reps: Math.floor(val) })}
      />

      <NumberInput
        label="Half"
        value={setData.halfReps}
        step={1}
        max={50}
        isInteger={true}
        onChange={(val) => onUpdate({ ...setData, halfReps: Math.floor(val) })}
      />
    </View>
  );
};

// Exercise Card Component
const ExerciseCard = ({
  exercise,
  weightUnit,
  onUpdate,
}: {
  exercise: ExerciseRecord;
  weightUnit: "kg" | "lbs";
  onUpdate: (updated: ExerciseRecord) => void;
}) => {
  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: SetData = {
      setNumber: exercise.sets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      halfReps: 0,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (setIndex: number, updated: SetData) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = updated;
    onUpdate({ ...exercise, sets: newSets });
  };

  const removeSet = (setIndex: number) => {
    const newSets = exercise.sets.filter((_, i) => i !== setIndex);
    newSets.forEach((set, i) => (set.setNumber = i + 1));
    onUpdate({ ...exercise, sets: newSets });
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <Text className="text-lg font-bold text-gray-800 mb-1">
        {exercise.exerciseName}
      </Text>
      <Text className="text-xs text-gray-500 mb-3 capitalize">
        {exercise.equipmentType}
      </Text>

      {/* Previous Records Section */}
      {exercise.previousSets.length > 0 && (
        <View className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">
          <Text className="text-sm font-semibold text-amber-800 mb-2">
            Previous ({formatDate(exercise.previousSets[0].date)})
          </Text>
          <View className="flex-row flex-wrap">
            {exercise.previousSets.map((prevSet, idx) => (
              <View
                key={idx}
                className="bg-white rounded px-2 py-1 mr-2 mb-1 border border-amber-300"
              >
                <Text className="text-xs text-gray-600">
                  Set {prevSet.setNumber}: {prevSet.weight}
                  {weightUnit} × {prevSet.reps}
                  {prevSet.halfReps > 0 ? ` + ${prevSet.halfReps}½` : ""}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Current Sets Input */}
      {exercise.sets.map((set, index) => (
        <SetRow
          key={index}
          setData={set}
          setIndex={index}
          equipmentType={exercise.equipmentType}
          weightUnit={weightUnit}
          onUpdate={(updated) => updateSet(index, updated)}
          onRemove={() => removeSet(index)}
          canRemove={exercise.sets.length > 1}
        />
      ))}

      <TouchableOpacity
        onPress={addSet}
        className="py-2 items-center border-t border-gray-200 mt-2"
      >
        <Text className="text-blue-500 font-semibold">+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

// Unit Toggle Component
const UnitToggle = ({
  unit,
  onToggle,
}: {
  unit: "kg" | "lbs";
  onToggle: () => void;
}) => (
  <View className="flex-row items-center justify-center mb-4">
    <Text className="text-gray-600 mr-3">Weight Unit:</Text>
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row bg-gray-200 rounded-full p-1"
    >
      <View
        className={`px-4 py-2 rounded-full ${
          unit === "kg" ? "bg-blue-500" : "bg-transparent"
        }`}
      >
        <Text
          className={`font-semibold ${
            unit === "kg" ? "text-white" : "text-gray-600"
          }`}
        >
          kg
        </Text>
      </View>
      <View
        className={`px-4 py-2 rounded-full ${
          unit === "lbs" ? "bg-blue-500" : "bg-transparent"
        }`}
      >
        <Text
          className={`font-semibold ${
            unit === "lbs" ? "text-white" : "text-gray-600"
          }`}
        >
          lbs
        </Text>
      </View>
    </TouchableOpacity>
  </View>
);

const MainView = () => {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(true);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(
    null
  );
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load saved draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draftJson = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (draftJson) {
          const draft = JSON.parse(draftJson);
          if (draft.selectedWorkout && draft.exerciseRecords) {
            setSelectedWorkout(draft.selectedWorkout);
            setExerciseRecords(draft.exerciseRecords);
          }
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      } finally {
        setDraftLoaded(true);
      }
    };
    loadDraft();
  }, []);

  // Auto-save draft whenever workout data changes
  useEffect(() => {
    if (!draftLoaded) return; // Don't save until initial load is complete

    const saveDraft = async () => {
      try {
        if (selectedWorkout && exerciseRecords.length > 0) {
          const draft = {
            selectedWorkout,
            exerciseRecords,
            savedAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        }
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    };
    saveDraft();
  }, [selectedWorkout, exerciseRecords, draftLoaded]);

  // Clear draft from storage
  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  // Fetch saved workouts
  const fetchWorkouts = useCallback(async () => {
    try {
      // Fetch user's weight unit preference
      const user = await db.getFirstAsync<{ weight_unit: string }>(
        "SELECT weight_unit FROM users LIMIT 1"
      );
      if (user?.weight_unit) {
        setWeightUnit(user.weight_unit as "kg" | "lbs");
      }

      // Fetch saved workouts with their exercises
      const result = await db.getAllAsync<{
        workoutId: number;
        workoutName: string;
        exerciseId: number;
        exerciseName: string;
        equipmentType: string;
      }>(`
        SELECT
          w.id AS workoutId,
          w.name AS workoutName,
          e.id AS exerciseId,
          e.name AS exerciseName,
          e.equipment_type AS equipmentType
        FROM Workouts w
        LEFT JOIN Workout_Exercises we ON w.id = we.workout_id
        LEFT JOIN Exercises e ON we.exercise_id = e.id
        ORDER BY w.id DESC
      `);

      // Group by workout
      const grouped: { [key: number]: SavedWorkout } = {};
      result.forEach((row) => {
        if (!grouped[row.workoutId]) {
          grouped[row.workoutId] = {
            id: row.workoutId,
            name: row.workoutName,
            exercises: [],
          };
        }
        if (row.exerciseId) {
          grouped[row.workoutId].exercises.push({
            id: row.exerciseId,
            name: row.exerciseName,
            equipment_type: row.equipmentType,
          });
        }
      });

      setSavedWorkouts(Object.values(grouped));
    } catch (error) {
      console.error("Failed to fetch workouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  // Refresh workouts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  // When workout is selected, load exercises and previous records
  const handleWorkoutSelect = async (workout: SavedWorkout) => {
    setSelectedWorkout(workout);

    const records: ExerciseRecord[] = await Promise.all(
      workout.exercises.map(async (ex) => {
        // Get the most recent date for this exercise
        const lastSession = await db.getFirstAsync<{ date: string }>(
          `SELECT date FROM Records WHERE exercise_id = ? ORDER BY date DESC LIMIT 1`,
          [ex.id]
        );

        let previousSets: PreviousSetData[] = [];

        if (lastSession?.date) {
          // Get all sets from the most recent session
          const prevRecords = await db.getAllAsync<{
            set_number: number;
            weight: number;
            reps: number;
            half_reps: number;
            date: string;
          }>(
            `SELECT set_number, weight, reps, half_reps, date
             FROM Records
             WHERE exercise_id = ? AND date = ?
             ORDER BY set_number ASC`,
            [ex.id, lastSession.date]
          );

          previousSets = prevRecords.map((r) => ({
            setNumber: r.set_number,
            weight: r.weight || 0,
            reps: r.reps || 0,
            halfReps: r.half_reps || 0,
            date: r.date,
          }));
        }

        // Pre-fill current set with the first previous set's values
        const firstPrevSet = previousSets[0];

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          equipmentType: ex.equipment_type,
          sets: [
            {
              setNumber: 1,
              weight: firstPrevSet?.weight || 0,
              reps: firstPrevSet?.reps || 0,
              halfReps: firstPrevSet?.halfReps || 0,
            },
          ],
          previousSets,
        };
      })
    );

    setExerciseRecords(records);
  };

  // Toggle weight unit and save preference
  const toggleWeightUnit = async () => {
    const newUnit = weightUnit === "kg" ? "lbs" : "kg";
    setWeightUnit(newUnit);

    try {
      await db.runAsync("UPDATE users SET weight_unit = ? WHERE id = 1", [
        newUnit,
      ]);
    } catch (error) {
      console.error("Failed to save weight unit:", error);
    }
  };

  // Update exercise record
  const updateExercise = (index: number, updated: ExerciseRecord) => {
    const newRecords = [...exerciseRecords];
    newRecords[index] = updated;
    setExerciseRecords(newRecords);
  };

  // Go back to workout selection (keeps draft saved)
  const handleBack = () => {
    setSelectedWorkout(null);
    // Don't clear exerciseRecords - they're auto-saved as draft
  };

  // Discard current draft and start fresh
  const handleDiscardDraft = () => {
    Alert.alert(
      "Discard Draft",
      "Are you sure you want to discard your current workout progress?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            await clearDraft();
            setSelectedWorkout(null);
            setExerciseRecords([]);
          },
        },
      ]
    );
  };

  // Save all records
  const handleSave = async () => {
    if (!selectedWorkout) {
      Alert.alert("Error", "No workout selected");
      return;
    }

    if (exerciseRecords.length === 0) {
      Alert.alert("Error", "No exercises to save");
      return;
    }

    try {
      await db.withTransactionAsync(async () => {
        const date = new Date().toISOString();

        for (const exercise of exerciseRecords) {
          for (const set of exercise.sets) {
            await db.runAsync(
              `INSERT INTO Records (date, workout_id, exercise_id, weight, set_number, reps, half_reps)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                date,
                selectedWorkout.id,
                exercise.exerciseId,
                set.weight,
                set.setNumber,
                set.reps,
                set.halfReps,
              ]
            );
          }
        }
      });

      // Clear draft after successful save
      await clearDraft();

      Alert.alert("Success", "Workout recorded!");
      setSelectedWorkout(null);
      setExerciseRecords([]);
    } catch (error: any) {
      console.error("Failed to save:", error);
      Alert.alert("Error", `Failed to save workout: ${error.message || "Unknown error"}`);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {!selectedWorkout ? (
        <View className="flex-1 p-4">
          <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Start Workout
          </Text>

          {savedWorkouts.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500 text-center">
                No workout plans found.{"\n"}Create one in your Profile.
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-gray-600 mb-2">Select a workout:</Text>
              <Dropdown
                data={savedWorkouts}
                labelField="name"
                valueField="id"
                placeholder="Choose workout..."
                value={null}
                onChange={(item) => handleWorkoutSelect(item)}
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                }}
                placeholderStyle={{ color: "#999" }}
                selectedTextStyle={{ color: "#000" }}
              />
            </View>
          )}
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1 p-4"
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={handleBack}>
                <Text className="text-blue-500">← Back</Text>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                {selectedWorkout.name}
              </Text>
              <View className="w-12" />
            </View>

            <UnitToggle unit={weightUnit} onToggle={toggleWeightUnit} />

            {exerciseRecords.map((exercise, index) => (
              <ExerciseCard
                key={exercise.exerciseId}
                exercise={exercise}
                weightUnit={weightUnit}
                onUpdate={(updated) => updateExercise(index, updated)}
              />
            ))}
          </ScrollView>

          <View className="p-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              onPress={handleSave}
              className="bg-blue-500 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-bold text-lg">Save Workout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default function Index() {
  const userDB = "userDatabase3.db";

  const handleOnInit = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(`PRAGMA foreign_keys = ON;`);

      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS Exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          muscle_group TEXT,
          equipment_type TEXT
        );

        CREATE TABLE IF NOT EXISTS Workouts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
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

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          weight_unit TEXT DEFAULT 'kg'
        );
      `);
    } catch (error) {
      console.error("Init failed:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1">
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
