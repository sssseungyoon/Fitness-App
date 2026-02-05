import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ExerciseCard,
  ExerciseRecord,
  PreviousSetData,
  UnitToggle,
} from "../components/workout-input";

const DRAFT_STORAGE_KEY = "workout_draft";

interface SavedWorkout {
  id: number;
  name: string;
  exercises: {
    id: number;
    name: string;
    equipment_type: string;
    is_isolation: boolean;
  }[];
}

interface WorkoutSession {
  date: string;
  workoutId: number;
  workoutName: string;
}

export default function Index() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(
    null
  );
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecord[]>([]);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const backPressedRef = useRef(false);

  // Load saved draft when screen comes into focus (if no active workout)
  useFocusEffect(
    useCallback(() => {
      const loadDraftIfNeeded = async () => {
        // Skip draft load when back was intentionally pressed
        if (backPressedRef.current) {
          backPressedRef.current = false;
          setDraftLoaded(true);
          return;
        }
        // Only load draft if no workout is currently active
        if (selectedWorkout === null) {
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
          }
        }
        setDraftLoaded(true);
      };
      loadDraftIfNeeded();
    }, [])
  );

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
        isIsolation: number;
        exerciseOrder: number;
      }>(`
        SELECT
          w.id AS workoutId,
          w.name AS workoutName,
          e.id AS exerciseId,
          e.name AS exerciseName,
          e.equipment_type AS equipmentType,
          COALESCE(e.is_isolation, 0) AS isIsolation,
          we.exercise_order AS exerciseOrder
        FROM Workouts w
        LEFT JOIN Workout_Exercises we ON w.id = we.workout_id
        LEFT JOIN Exercises e ON we.exercise_id = e.id
        ORDER BY w.id DESC, we.exercise_order ASC
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
            is_isolation: row.isIsolation === 1,
          });
        }
      });

      setSavedWorkouts(Object.values(grouped));

      // Fetch recent workout sessions
      const sessions = await db.getAllAsync<{
        date: string;
        workoutId: number;
        workoutName: string;
      }>(`
        SELECT DISTINCT
          r.date,
          r.workout_id AS workoutId,
          w.name AS workoutName
        FROM Records r
        JOIN Workouts w ON r.workout_id = w.id
        ORDER BY r.date DESC
        LIMIT 10
      `);
      setRecentSessions(sessions);
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
            left_reps: number | null;
            right_reps: number | null;
            date: string;
          }>(
            `SELECT set_number, weight, reps, half_reps, left_reps, right_reps, date
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
            leftReps: r.left_reps ?? undefined,
            rightReps: r.right_reps ?? undefined,
            date: r.date,
          }));
        }

        // Pre-fill current set with the first previous set's values
        const firstPrevSet = previousSets[0];
        const isIsolation = ex.is_isolation;

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          equipmentType: ex.equipment_type,
          isIsolation,
          sets: [
            {
              setNumber: 1,
              weight: firstPrevSet?.weight || 0,
              reps: firstPrevSet?.reps || 0,
              halfReps: firstPrevSet?.halfReps || 0,
              leftReps: isIsolation ? firstPrevSet?.leftReps || 0 : undefined,
              rightReps: isIsolation ? firstPrevSet?.rightReps || 0 : undefined,
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

  // Go back to workout selection with confirmation
  const handleBack = () => {
    Alert.alert(
      "Discard Progress?",
      "Your current workout progress will be lost. Are you sure you want to go back?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            backPressedRef.current = true;
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
              `INSERT INTO Records (date, workout_id, exercise_id, weight, set_number, reps, half_reps, left_reps, right_reps)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                date,
                selectedWorkout.id,
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

      // Clear draft after successful save
      await clearDraft();

      Alert.alert("Success", "Workout recorded!");
      setSelectedWorkout(null);
      setExerciseRecords([]);

      // Refresh the workouts and recent sessions list
      await fetchWorkouts();
    } catch (error: any) {
      console.error("Failed to save:", error);
      Alert.alert(
        "Error",
        `Failed to save workout: ${error.message || "Unknown error"}`
      );
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#A0A0A0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {!selectedWorkout ? (
        <View style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#F5F5F5", marginBottom: 24, textAlign: "center" }}>
            Start Workout
          </Text>

          {savedWorkouts.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: "#6E6E73", textAlign: "center" }}>
                No workout plans found.{"\n"}Create one in your Profile.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: "#6E6E73", marginBottom: 8, fontSize: 13, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>Select a workout</Text>
              <Dropdown
                data={savedWorkouts}
                labelField="name"
                valueField="id"
                placeholder="Choose workout..."
                value={null}
                onChange={(item) => handleWorkoutSelect(item)}
                style={{
                  backgroundColor: "#1C1C1E",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#3A3A3C",
                }}
                placeholderStyle={{ color: "#6E6E73" }}
                selectedTextStyle={{ color: "#F5F5F5" }}
                containerStyle={{ backgroundColor: "#1C1C1E", borderColor: "#3A3A3C", borderRadius: 12 }}
                itemTextStyle={{ color: "#E5E5E5" }}
                itemContainerStyle={{ backgroundColor: "#1C1C1E" }}
                activeColor="#2C2C2E"
              />

              {/* Recent Workouts Section */}
              {recentSessions.length > 0 && (
                <View style={{ marginTop: 32 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#6E6E73", marginBottom: 16, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Recent Workouts
                  </Text>
                  {recentSessions.map((session) => (
                    <TouchableOpacity
                      key={`${session.date}-${session.workoutId}`}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/edit-record",
                          params: {
                            date: session.date,
                            workoutId: session.workoutId.toString(),
                            workoutName: session.workoutName,
                          },
                        })
                      }
                      style={{
                        backgroundColor: "#1C1C1E",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: "#2C2C2E",
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 17, fontWeight: "600", color: "#F5F5F5" }}>
                          {session.workoutName}
                        </Text>
                        <Text style={{ fontSize: 13, color: "#6E6E73", marginTop: 4 }}>
                          {new Date(session.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                      <Text style={{ color: "#4A4A4A", fontSize: 20 }}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <TouchableOpacity onPress={handleBack}>
                <Text style={{ color: "#A0A0A0", fontSize: 16 }}>← Back</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#F5F5F5" }}>
                {selectedWorkout.name}
              </Text>
              <View style={{ width: 48 }} />
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

          <View style={{ padding: 16, backgroundColor: "#0A0A0A", borderTopWidth: 0.5, borderTopColor: "#2C2C2E" }}>
            <TouchableOpacity
              onPress={handleSave}
              style={{ backgroundColor: "#F5F5F5", paddingVertical: 16, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#000", fontWeight: "600", fontSize: 17 }}>Save Workout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
