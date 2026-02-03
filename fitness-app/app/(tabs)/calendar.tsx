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
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const monthKeys = Object.keys(sessionsByMonth).sort().reverse();

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["bottom"]}>
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          History
        </Text>

        {monthKeys.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-500 text-center">
              No workout history yet.{"\n"}Complete a workout to see it here.
            </Text>
          </View>
        ) : (
          monthKeys.map((monthKey) => (
            <View key={monthKey} className="mb-6">
              <Text className="text-lg font-semibold text-gray-700 mb-3">
                {sessionsByMonth[monthKey].label}
              </Text>

              {sessionsByMonth[monthKey].sessions.map((session) => (
                <TouchableOpacity
                  key={`${session.date}-${session.workoutId}`}
                  onPress={() => handleSessionSelect(session)}
                  className="bg-white rounded-xl p-4 mb-2 flex-row items-center"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View className="bg-blue-100 rounded-lg w-12 h-12 items-center justify-center mr-4">
                    <Text className="text-blue-600 font-bold text-lg">
                      {formatDayNumber(session.date)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">
                      {session.workoutName}
                    </Text>
                    <Text className="text-sm text-gray-500">
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
        <SafeAreaView className="flex-1 bg-gray-100">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
            <TouchableOpacity onPress={closeModal}>
              <Text className="text-blue-500 text-lg">Close</Text>
            </TouchableOpacity>
            <View className="flex-1 mx-4">
              <Text
                className="text-lg font-bold text-gray-800 text-center"
                numberOfLines={1}
              >
                {selectedSession?.workoutName}
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                {selectedSession && formatSessionDate(selectedSession.date)}
              </Text>
            </View>
            <View className="w-12" />
          </View>

          <ScrollView className="flex-1 p-4">
            {isLoadingDetails ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : (
              sessionDetails.map((exercise, index) => (
                <View
                  key={index}
                  className="bg-white rounded-xl p-4 mb-4 shadow-sm"
                >
                  <Text className="text-lg font-bold text-gray-800 mb-1">
                    {exercise.exerciseName}
                  </Text>
                  <Text className="text-xs text-gray-500 mb-3 capitalize">
                    {exercise.equipmentType}
                  </Text>

                  {exercise.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      className="flex-row items-center py-2 border-b border-gray-100"
                    >
                      <Text className="text-gray-600 w-16">
                        Set {set.setNumber}
                      </Text>
                      <Text className="text-gray-800 font-semibold flex-1">
                        {set.weight}
                        {weightUnit} × {set.reps}
                        {set.halfReps > 0 ? (
                          <Text className="text-amber-600">
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
