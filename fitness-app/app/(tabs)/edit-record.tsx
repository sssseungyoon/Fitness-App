import { useLocalSearchParams, useRouter } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ExerciseCard,
  ExerciseRecord,
  UnitToggle,
} from "../components/workout-input";

interface EditRecordViewProps {
  date: string;
  workoutId: string;
  workoutName: string;
}

const EditRecordView = ({
  date,
  workoutId,
  workoutName,
}: EditRecordViewProps) => {
  const db = useSQLiteContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [isSaving, setIsSaving] = useState(false);

  // Load session records
  const loadRecords = useCallback(async () => {
    if (!date || !workoutId) return;

    try {
      // Fetch user's weight unit preference
      const user = await db.getFirstAsync<{ weight_unit: string }>(
        "SELECT weight_unit FROM users LIMIT 1"
      );
      if (user?.weight_unit) {
        setWeightUnit(user.weight_unit as "kg" | "lbs");
      }

      // Fetch all records for this session grouped by exercise
      const records = await db.getAllAsync<{
        exerciseId: number;
        exerciseName: string;
        equipmentType: string;
        setNumber: number;
        weight: number;
        reps: number;
        halfReps: number;
      }>(
        `SELECT
          r.exercise_id AS exerciseId,
          e.name AS exerciseName,
          e.equipment_type AS equipmentType,
          r.set_number AS setNumber,
          r.weight,
          r.reps,
          r.half_reps AS halfReps
        FROM Records r
        JOIN Exercises e ON r.exercise_id = e.id
        WHERE r.date = ? AND r.workout_id = ?
        ORDER BY r.exercise_id, r.set_number`,
        [date, parseInt(workoutId)]
      );

      // Group by exercise
      const grouped: { [key: number]: ExerciseRecord } = {};
      records.forEach((row) => {
        if (!grouped[row.exerciseId]) {
          grouped[row.exerciseId] = {
            exerciseId: row.exerciseId,
            exerciseName: row.exerciseName,
            equipmentType: row.equipmentType,
            sets: [],
            previousSets: [], // No previous sets for editing
          };
        }
        grouped[row.exerciseId].sets.push({
          setNumber: row.setNumber,
          weight: row.weight || 0,
          reps: row.reps || 0,
          halfReps: row.halfReps || 0,
        });
      });

      setExerciseRecords(Object.values(grouped));
    } catch (error) {
      console.error("Failed to load records:", error);
      Alert.alert("Error", "Failed to load workout records");
    } finally {
      setIsLoading(false);
    }
  }, [date, workoutId, db]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Toggle weight unit
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

  // Save changes using DELETE + INSERT pattern
  const handleSave = async () => {
    if (!date || !workoutId) return;

    setIsSaving(true);
    try {
      await db.withTransactionAsync(async () => {
        // Delete existing records for this session
        await db.runAsync(
          "DELETE FROM Records WHERE date = ? AND workout_id = ?",
          [date, parseInt(workoutId)]
        );

        // Insert updated records
        for (const exercise of exerciseRecords) {
          for (const set of exercise.sets) {
            await db.runAsync(
              `INSERT INTO Records (date, workout_id, exercise_id, weight, set_number, reps, half_reps)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                date,
                parseInt(workoutId),
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

      Alert.alert("Success", "Workout updated!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Failed to save:", error);
      Alert.alert(
        "Error",
        `Failed to save changes: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete this session
  const handleDelete = () => {
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout session? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync(
                "DELETE FROM Records WHERE date = ? AND workout_id = ?",
                [date, parseInt(workoutId)]
              );
              router.back();
            } catch (error) {
              console.error("Failed to delete:", error);
              Alert.alert("Error", "Failed to delete workout");
            }
          },
        },
      ]
    );
  };

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500">← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xl font-bold text-gray-800 text-center mb-1">
          {workoutName}
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-4">
          {formattedDate}
        </Text>

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
          disabled={isSaving}
          className={`py-4 rounded-xl items-center ${
            isSaving ? "bg-gray-400" : "bg-blue-500"
          }`}
        >
          <Text className="text-white font-bold text-lg">
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default function EditRecord() {
  const userDB = "userDatabase7.db";
  const { date, workoutId, workoutName } = useLocalSearchParams<{
    date: string;
    workoutId: string;
    workoutName: string;
  }>();

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["bottom"]}>
      <SQLiteProvider databaseName={userDB}>
        <EditRecordView
          date={date || ""}
          workoutId={workoutId || ""}
          workoutName={workoutName || ""}
        />
      </SQLiteProvider>
    </SafeAreaView>
  );
}
