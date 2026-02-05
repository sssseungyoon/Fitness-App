import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
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

export default function EditRecord() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { date, workoutId, workoutName } = useLocalSearchParams<{
    date: string;
    workoutId: string;
    workoutName: string;
  }>();

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
        isIsolation: number;
        setNumber: number;
        weight: number;
        reps: number;
        halfReps: number;
        leftReps: number | null;
        rightReps: number | null;
      }>(
        `SELECT
          r.exercise_id AS exerciseId,
          e.name AS exerciseName,
          e.equipment_type AS equipmentType,
          COALESCE(e.is_isolation, 0) AS isIsolation,
          r.set_number AS setNumber,
          r.weight,
          r.reps,
          r.half_reps AS halfReps,
          r.left_reps AS leftReps,
          r.right_reps AS rightReps
        FROM Records r
        JOIN Exercises e ON r.exercise_id = e.id
        WHERE r.date = ? AND r.workout_id = ?
        ORDER BY r.exercise_id, r.set_number`,
        [date, parseInt(workoutId)]
      );

      // Group by exercise
      const grouped: { [key: number]: ExerciseRecord } = {};
      records.forEach((row) => {
        const isIsolation = row.isIsolation === 1;
        if (!grouped[row.exerciseId]) {
          grouped[row.exerciseId] = {
            exerciseId: row.exerciseId,
            exerciseName: row.exerciseName,
            equipmentType: row.equipmentType,
            isIsolation,
            sets: [],
            previousSets: [], // No previous sets for editing
          };
        }
        grouped[row.exerciseId].sets.push({
          setNumber: row.setNumber,
          weight: row.weight || 0,
          reps: row.reps || 0,
          halfReps: row.halfReps || 0,
          leftReps: isIsolation ? (row.leftReps ?? 0) : undefined,
          rightReps: isIsolation ? (row.rightReps ?? 0) : undefined,
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
              `INSERT INTO Records (date, workout_id, exercise_id, weight, set_number, reps, half_reps, left_reps, right_reps)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                date,
                parseInt(workoutId),
                exercise.exerciseId,
                set.weight,
                set.setNumber,
                set.reps,
                set.halfReps,
                set.leftReps ?? null,
                set.rightReps ?? null,
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#A0A0A0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["bottom"]}>
      <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#A0A0A0", fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: "#FF453A", fontSize: 16 }}>Delete</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 20, fontWeight: "700", color: "#F5F5F5", textAlign: "center", marginBottom: 4 }}>
          {workoutName}
        </Text>
        <Text style={{ fontSize: 14, color: "#6E6E73", textAlign: "center", marginBottom: 16 }}>
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

      <View style={{ padding: 16, backgroundColor: "#0A0A0A", borderTopWidth: 0.5, borderTopColor: "#2C2C2E" }}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: isSaving ? "#3A3A3C" : "#F5F5F5",
          }}
        >
          <Text style={{ color: isSaving ? "#6E6E73" : "#000", fontWeight: "600", fontSize: 17 }}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
