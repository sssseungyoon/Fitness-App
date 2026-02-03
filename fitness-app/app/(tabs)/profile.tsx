import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import EditWorkoutView from "./edit-workout";

interface SavedWorkout {
  id: number;
  name: string;
  exercises: { id: number; name: string }[];
}

const EditProfileButton = ({ setIsEditing, setForm, existingUser }: any) => (
  <TouchableOpacity
    style={styles.editButton}
    onPress={() => {
      setForm({
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      });
      setIsEditing(true);
    }}
  >
    <Text style={styles.editText}>Edit Profile</Text>
  </TouchableOpacity>
);

const SaveAndCancelButton = ({ handleOnSave, handleOnCancel }: any) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity style={styles.editButton} onPress={handleOnSave}>
      <Text style={styles.editText}>Save</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.deleteButton} onPress={handleOnCancel}>
      <Text style={styles.deleteText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

// Saved Workout Plan Card
const SavedPlanCard = ({ workout }: { workout: SavedWorkout }) => (
  <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
    <Text className="text-lg font-bold text-gray-800 mb-2">{workout.name}</Text>
    <View className="border-t border-gray-100 pt-2">
      {workout.exercises.map((ex, index) => (
        <View
          key={`${workout.id}-${ex.id}-${index}`}
          className="flex-row items-center py-1"
        >
          <Text className="text-blue-500 mr-2">•</Text>
          <Text className="text-gray-600">{ex.name}</Text>
        </View>
      ))}
      {workout.exercises.length === 0 && (
        <Text className="text-gray-400 italic">No exercises added</Text>
      )}
    </View>
  </View>
);

const UserDetails = ({
  isEditing,
  setIsEditing,
  existingUser,
  handleOnSaveChanges,
  handleOnCancelChanges,
  form,
  setForm,
}: any) => {
  const InfoRow = ({
    label,
    value,
    isLast = false,
  }: {
    label: string;
    value: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.row, isLast && styles.noBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not Set"}</Text>
    </View>
  );

  const InputRow = ({
    label,
    value,
    isLast = false,
    onChangeText,
  }: {
    label: string;
    value: string;
    isLast?: boolean;
    onChangeText: any;
  }) => (
    <View style={[styles.row, isLast && styles.noBorder]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.value}
        value={value || ""}
        onChangeText={onChangeText}
      />
    </View>
  );

  return (
    <View style={styles.tableContainer}>
      <Text style={styles.tableHeader}>Account Details</Text>

      <InfoRow label="User ID" value={`#${existingUser.id}`} />
      {isEditing ? (
        <InputRow
          label="First Name"
          value={form.firstName}
          onChangeText={(text: string) => setForm({ ...form, firstName: text })}
        />
      ) : (
        <InfoRow label="First Name" value={existingUser.firstName} />
      )}
      {isEditing ? (
        <InputRow
          label="Last Name"
          value={form.lastName}
          onChangeText={(text: string) => setForm({ ...form, lastName: text })}
        />
      ) : (
        <InfoRow label="Last Name" value={existingUser.lastName} />
      )}
      <InfoRow label="Status" value="Active" isLast={true} />
      {!isEditing ? (
        <EditProfileButton
          setIsEditing={setIsEditing}
          setForm={setForm}
          existingUser={existingUser}
        />
      ) : (
        <SaveAndCancelButton
          handleOnSave={handleOnSaveChanges}
          handleOnCancel={handleOnCancelChanges}
        />
      )}
    </View>
  );
};

const UserForm = ({ form, setForm, handleSubmitNewUser }: any) => {
  return (
    <View className="w-4/5 bg-white rounded-xl p-4">
      <Text className="text-lg font-bold mb-4">Create Profile</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="First Name"
        value={form.firstName}
        onChangeText={(text) => setForm({ ...form, firstName: text })}
      />
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Last Name"
        value={form.lastName}
        onChangeText={(text) => setForm({ ...form, lastName: text })}
      />
      <TouchableOpacity
        className="bg-blue-500 py-3 rounded-lg items-center"
        onPress={handleSubmitNewUser}
      >
        <Text className="text-white font-semibold">Create Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Profile() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [existingUser, setExistingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const db = useSQLiteContext();

  // Fetch saved workouts
  const fetchSavedWorkouts = useCallback(async () => {
    try {
      const result = await db.getAllAsync<{
        workoutId: number;
        workoutName: string;
        exerciseId: number;
        exerciseName: string;
      }>(`
        SELECT
          w.id AS workoutId,
          w.name AS workoutName,
          e.id AS exerciseId,
          e.name AS exerciseName
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
        if (row.exerciseId && row.exerciseName) {
          grouped[row.workoutId].exercises.push({
            id: row.exerciseId,
            name: row.exerciseName,
          });
        }
      });

      setSavedWorkouts(Object.values(grouped));
    } catch (error) {
      console.error("Failed to fetch workouts:", error);
    }
  }, [db]);

  // Check if the user already exists and update the existing user state
  useEffect(() => {
    const checkUser = async () => {
      try {
        const result = await db.getFirstAsync("SELECT * FROM users LIMIT 1");
        setExistingUser(result);
        await fetchSavedWorkouts();
      } catch (Error) {
        console.log(Error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [db, fetchSavedWorkouts]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleSubmitNewUser = async () => {
    try {
      if (!form.firstName || !form.lastName) {
        throw new Error("All fields are required");
      }
      await db.runAsync(
        `INSERT INTO users (firstName, lastName, weight_unit) VALUES (?, ?, 'kg')`,
        [form.firstName, form.lastName]
      );
      Alert.alert("Success", "User data saved successful");
      const newUser = await db.getFirstAsync("SELECT * FROM users LIMIT 1");
      setExistingUser(newUser);
      setForm({
        firstName: "",
        lastName: "",
      });
    } catch (Error: any) {
      console.error(Error);
      Alert.alert(
        "Error",
        Error.message || "Error has occured when submitting the user form"
      );
    }
  };

  const handleOnSaveChanges = async () => {
    try {
      if (!form.firstName || !form.lastName) {
        throw new Error("All fields are required");
      }
      await db.runAsync(
        `UPDATE users SET firstName = ?, lastName = ? WHERE id = ?`,
        [form.firstName, form.lastName, existingUser.id]
      );
      setExistingUser({ ...existingUser, ...form });
      setIsEditing(false);
      Alert.alert("Success", "Profile Updated!");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "failed to save changes");
    }
  };

  const handleOnCancelChanges = async () => {
    setForm({
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
    });
    setIsEditing(false);
  };

  const handleCloseModal = async () => {
    setShowEditModal(false);
    // Refresh workouts after modal closes
    await fetchSavedWorkouts();
  };

  return (
    <SafeAreaView className="flex-1 items-center bg-gray-100">
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
      >
        {existingUser ? (
          <>
            <UserDetails
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              existingUser={existingUser}
              handleOnSaveChanges={handleOnSaveChanges}
              handleOnCancelChanges={handleOnCancelChanges}
              form={form}
              setForm={setForm}
            />

            {/* Workout Plans Section */}
            <View className="w-4/5 mt-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-gray-800">
                  Workout Plans
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(true)}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Edit Plans</Text>
                </TouchableOpacity>
              </View>

              {savedWorkouts.length === 0 ? (
                <View className="bg-white rounded-xl p-6 items-center">
                  <Text className="text-gray-500 text-center mb-4">
                    No workout plans yet
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowEditModal(true)}
                    className="bg-blue-500 px-6 py-3 rounded-lg"
                  >
                    <Text className="text-white font-semibold">
                      Create Your First Plan
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                savedWorkouts.map((workout) => (
                  <SavedPlanCard key={workout.id} workout={workout} />
                ))
              )}
            </View>

            {/* Edit Workout Modal */}
            <Modal
              visible={showEditModal}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={handleCloseModal}
            >
              <SafeAreaView className="flex-1">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Text className="text-blue-500 text-lg">Done</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-bold">Edit Workout Plans</Text>
                  <View className="w-12" />
                </View>
                <EditWorkoutView />
              </SafeAreaView>
            </Modal>
          </>
        ) : (
          <UserForm
            form={form}
            setForm={setForm}
            handleSubmitNewUser={handleSubmitNewUser}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e1e4e8",
    marginVertical: 20,
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  editButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
  },
});
