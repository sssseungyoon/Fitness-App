import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WorkoutSession {
  date: string;
  workoutId: number;
  workoutName: string;
}

interface SessionsByMonth {
  [monthKey: string]: {
    label: string;
    sessions: WorkoutSession[];
  };
}

interface ExerciseDetail {
  exerciseName: string;
  equipmentType: string;
  sets: {
    setNumber: number;
    weight: number;
    reps: number;
    halfReps: number;
  }[];
}

export default function Calendar() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionsByMonth, setSessionsByMonth] = useState<SessionsByMonth>({});
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(
    null
  );
  const [sessionDetails, setSessionDetails] = useState<ExerciseDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");

  // Fetch all workout sessions grouped by month
  const fetchSessions = useCallback(async () => {
    try {
      // Fetch user's weight unit preference
      const user = await db.getFirstAsync<{ weight_unit: string }>(
        "SELECT weight_unit FROM users LIMIT 1"
      );
      if (user?.weight_unit) {
        setWeightUnit(user.weight_unit as "kg" | "lbs");
      }

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
      `);

      // Group by month
      const grouped: SessionsByMonth = {};
      sessions.forEach((session) => {
        const d = new Date(session.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = d.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            label: monthLabel,
            sessions: [],
          };
        }
        grouped[monthKey].sessions.push(session);
      });

      setSessionsByMonth(grouped);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions])
  );

  // Load session details when a session is selected
  const handleSessionSelect = async (session: WorkoutSession) => {
    setSelectedSession(session);
    setIsLoadingDetails(true);

    try {
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
        [session.date, session.workoutId]
      );

      // Group by exercise
      const grouped: { [key: number]: ExerciseDetail } = {};
      records.forEach((row) => {
        if (!grouped[row.exerciseId]) {
          grouped[row.exerciseId] = {
            exerciseName: row.exerciseName,
            equipmentType: row.equipmentType,
            sets: [],
          };
        }
        grouped[row.exerciseId].sets.push({
          setNumber: row.setNumber,
          weight: row.weight || 0,
          reps: row.reps || 0,
          halfReps: row.halfReps || 0,
        });
      });

      setSessionDetails(Object.values(grouped));
    } catch (error) {
      console.error("Failed to load session details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setSelectedSession(null);
    setSessionDetails([]);
  };

  // Format date for display
  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDayNumber = (dateStr: string) => {
    return new Date(dateStr).getDate().toString();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#A0A0A0" />
      </View>
    );
  }

  const monthKeys = Object.keys(sessionsByMonth).sort().reverse();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["bottom"]}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#F5F5F5", marginBottom: 24, textAlign: "center" }}>
          History
        </Text>

        {monthKeys.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 }}>
            <Text style={{ color: "#6E6E73", textAlign: "center" }}>
              No workout history yet.{"\n"}Complete a workout to see it here.
            </Text>
          </View>
        ) : (
          monthKeys.map((monthKey) => (
            <View key={monthKey} style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6E6E73", marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {sessionsByMonth[monthKey].label}
              </Text>

              {sessionsByMonth[monthKey].sessions.map((session) => (
                <TouchableOpacity
                  key={`${session.date}-${session.workoutId}`}
                  onPress={() => handleSessionSelect(session)}
                  style={{
                    backgroundColor: "#1C1C1E",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#2C2C2E",
                  }}
                >
                  <View style={{ backgroundColor: "#2C2C2E", borderRadius: 10, width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                    <Text style={{ color: "#F5F5F5", fontWeight: "700", fontSize: 18 }}>
                      {formatDayNumber(session.date)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#F5F5F5" }}>
                      {session.workoutName}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6E6E73", marginTop: 2 }}>
                      {formatSessionDate(session.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* View-Only Modal */}
      <Modal
        visible={selectedSession !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#2C2C2E", backgroundColor: "#0A0A0A" }}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={{ color: "#A0A0A0", fontSize: 17 }}>Close</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 16 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "600", color: "#F5F5F5", textAlign: "center" }}
                numberOfLines={1}
              >
                {selectedSession?.workoutName}
              </Text>
              <Text style={{ fontSize: 13, color: "#6E6E73", textAlign: "center", marginTop: 2 }}>
                {selectedSession && formatSessionDate(selectedSession.date)}
              </Text>
            </View>
            <View style={{ width: 48 }} />
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {isLoadingDetails ? (
              <View style={{ paddingVertical: 80, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#A0A0A0" />
              </View>
            ) : (
              sessionDetails.map((exercise, index) => (
                <View
                  key={index}
                  style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2C2C2E" }}
                >
                  <Text style={{ fontSize: 17, fontWeight: "600", color: "#F5F5F5", marginBottom: 4 }}>
                    {exercise.exerciseName}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6E6E73", marginBottom: 12, textTransform: "capitalize" }}>
                    {exercise.equipmentType}
                  </Text>

                  {exercise.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: setIndex < exercise.sets.length - 1 ? 0.5 : 0, borderBottomColor: "#2C2C2E" }}
                    >
                      <Text style={{ color: "#6E6E73", width: 64 }}>
                        Set {set.setNumber}
                      </Text>
                      <Text style={{ color: "#F5F5F5", fontWeight: "600", flex: 1 }}>
                        {set.weight}
                        {weightUnit} × {set.reps}
                        {set.halfReps > 0 ? (
                          <Text style={{ color: "#A0A0A0" }}>
                            {" "}
                            + {set.halfReps}½
                          </Text>
                        ) : null}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
