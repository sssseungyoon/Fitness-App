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
  <View style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2C2C2E" }}>
    <Text style={{ fontSize: 17, fontWeight: "600", color: "#F5F5F5", marginBottom: 8 }}>{workout.name}</Text>
    <View style={{ borderTopWidth: 0.5, borderTopColor: "#3A3A3C", paddingTop: 8 }}>
      {workout.exercises.map((ex, index) => (
        <View
          key={`${workout.id}-${ex.id}-${index}`}
          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}
        >
          <Text style={{ color: "#A0A0A0", marginRight: 8, fontSize: 8 }}>•</Text>
          <Text style={{ color: "#B0B0B0", fontSize: 15 }}>{ex.name}</Text>
        </View>
      ))}
      {workout.exercises.length === 0 && (
        <Text style={{ color: "#6E6E73", fontStyle: "italic" }}>No exercises added</Text>
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
    <View style={{ width: "85%", backgroundColor: "#1C1C1E", borderRadius: 12, padding: 20, borderWidth: 1, borderColor: "#2C2C2E" }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#F5F5F5" }}>Create Profile</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: "#3A3A3C", borderRadius: 10, padding: 14, marginBottom: 12, backgroundColor: "#0A0A0A", color: "#F5F5F5", fontSize: 16 }}
        placeholder="First Name"
        placeholderTextColor="#6E6E73"
        value={form.firstName}
        onChangeText={(text) => setForm({ ...form, firstName: text })}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: "#3A3A3C", borderRadius: 10, padding: 14, marginBottom: 16, backgroundColor: "#0A0A0A", color: "#F5F5F5", fontSize: 16 }}
        placeholder="Last Name"
        placeholderTextColor="#6E6E73"
        value={form.lastName}
        onChangeText={(text) => setForm({ ...form, lastName: text })}
      />
      <TouchableOpacity
        style={{ backgroundColor: "#F5F5F5", paddingVertical: 14, borderRadius: 10, alignItems: "center" }}
        onPress={handleSubmitNewUser}
      >
        <Text style={{ color: "#000", fontWeight: "600", fontSize: 16 }}>Create Profile</Text>
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
        exerciseOrder: number;
      }>(`
        SELECT
          w.id AS workoutId,
          w.name AS workoutName,
          e.id AS exerciseId,
          e.name AS exerciseName,
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
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#A0A0A0" />
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
    <SafeAreaView style={{ flex: 1, alignItems: "center", backgroundColor: "#000" }}>
      <ScrollView
        style={{ flex: 1, width: "100%" }}
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
            <View style={{ width: "85%", marginTop: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#6E6E73", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Workout Plans
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(true)}
                  style={{ backgroundColor: "#F5F5F5", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: "#000", fontWeight: "600" }}>Edit Plans</Text>
                </TouchableOpacity>
              </View>

              {savedWorkouts.length === 0 ? (
                <View style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#2C2C2E" }}>
                  <Text style={{ color: "#6E6E73", textAlign: "center", marginBottom: 16 }}>
                    No workout plans yet
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowEditModal(true)}
                    style={{ backgroundColor: "#F5F5F5", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
                  >
                    <Text style={{ color: "#000", fontWeight: "600" }}>
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
              <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#2C2C2E", backgroundColor: "#0A0A0A" }}>
                  <TouchableOpacity onPress={handleCloseModal}>
                    <Text style={{ color: "#A0A0A0", fontSize: 17 }}>Done</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 17, fontWeight: "600", color: "#F5F5F5" }}>Edit Workout Plans</Text>
                  <View style={{ width: 48 }} />
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
    width: "85%",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    marginVertical: 20,
  },
  tableHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6E6E73",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#3A3A3C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2C2C2E",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#F5F5F5",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  editButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  editText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF453A",
  },
  deleteText: {
    color: "#FF453A",
    fontSize: 16,
    fontWeight: "500",
  },
});
