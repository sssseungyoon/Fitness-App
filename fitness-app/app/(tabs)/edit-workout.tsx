import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment_type: string;
  is_custom: number;
}

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
  onSave: (
    name: string,
    muscleGroup: string,
    equipmentType: string,
    isIsolation: boolean
  ) => void;
}) => {
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<string | null>(null);
  const [equipmentType, setEquipmentType] = useState<string | null>(null);
  const [isIsolation, setIsIsolation] = useState(false);

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
    onSave(exerciseName.trim(), muscleGroup, equipmentType, isIsolation);
    // Reset form
    setExerciseName("");
    setMuscleGroup(null);
    setEquipmentType(null);
    setIsIsolation(false);
  };

  const handleClose = () => {
    setExerciseName("");
    setMuscleGroup(null);
    setEquipmentType(null);
    setIsIsolation(false);
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

            <View style={styles.isolationToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Isolation Exercise</Text>
                <Text style={styles.isolationHint}>
                  Track left/right reps separately
                </Text>
              </View>
              <Switch
                value={isIsolation}
                onValueChange={setIsIsolation}
                trackColor={{ false: "#DDD", true: "#007AFF" }}
                thumbColor="#FFF"
              />
            </View>

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

export default function EditWorkout() {
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
      const result = await db.getAllAsync(`
      SELECT
        w.id AS workoutId,
        w.name AS workoutName,
        e.name AS exerciseName,
        e.id AS exerciseId,
        we.exercise_order AS exerciseOrder
      FROM Workouts w
      LEFT JOIN Workout_Exercises we ON w.id = we.workout_id
      LEFT JOIN Exercises e ON we.exercise_id = e.id
      ORDER BY w.id DESC, we.exercise_order ASC
    `);

      interface GroupedWorkout {
        id: number;
        name: string;
        exercises: { id: number; name: string }[];
      }

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
      const freshData = await db.getAllAsync<Exercise>(
        "SELECT id, name, muscle_group, equipment_type, is_custom FROM Exercises ORDER BY is_custom DESC, muscle_group ASC, name ASC"
      );
      setExercises(freshData);
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
    }
  };

  const saveCustomExercise = async (
    name: string,
    muscleGroup: string,
    equipmentType: string,
    isIsolation: boolean
  ) => {
    try {
      await db.runAsync(
        "INSERT INTO Exercises (name, muscle_group, equipment_type, is_custom, is_isolation) VALUES (?, ?, ?, 1, ?)",
        [name, muscleGroup, equipmentType, isIsolation ? 1 : 0]
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
    const sorted = [...exercises].sort((a, b) => {
      if (a.is_custom && !b.is_custom) return -1;
      if (!a.is_custom && b.is_custom) return 1;
      return 0;
    });
    return [ADD_CUSTOM_ITEM, ...sorted];
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchExercises();
        await fetchSavedWorkouts();
      } catch (e) {
        console.error("Load failed", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
        for (const workout of workoutPlan) {
          let workoutId: number;

          if (editingWorkoutId) {
            // Update existing workout name instead of deleting
            await db.runAsync(
              `UPDATE Workouts SET name = ? WHERE id = ?`,
              [workout.name || "New Workout", editingWorkoutId]
            );
            workoutId = editingWorkoutId;

            // Clear only the exercise associations (not the workout itself)
            await db.runAsync(
              "DELETE FROM Workout_Exercises WHERE workout_id = ?",
              [editingWorkoutId]
            );
          } else {
            // Create new workout
            const result = await db.runAsync(
              `INSERT INTO Workouts (name) VALUES (?)`,
              [workout.name || "New Workout"]
            );
            workoutId = result.lastInsertRowId;
          }

          // Insert exercises with order
          for (let i = 0; i < workout.exercises.length; i++) {
            const exercise = workout.exercises[i];
            if (exercise.exerciseId) {
              await db.runAsync(
                "INSERT INTO Workout_Exercises (workout_id, exercise_id, exercise_order) VALUES (?, ?, ?)",
                [workoutId, exercise.exerciseId, i]
              );
            }
          }
        }
      });
      setEditingWorkoutId(null);
      await fetchSavedWorkouts();
      setWorkoutPlan([
        {
          rowId: Date.now(),
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
              await db.runAsync("DELETE FROM Workouts WHERE id = ?", [
                workoutId,
              ]);
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
              <WorkoutCard
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
    </GestureHandlerRootView>
  );
}

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
    if (item.id === ADD_CUSTOM_EXERCISE_ID) {
      return (
        <View style={styles.addCustomItem}>
          <Text style={styles.addCustomItemText}>{item.name}</Text>
        </View>
      );
    }

    const currentIndex = data.findIndex((i: any) => i.id === item.id);
    const isCustom = item.is_custom === 1;
    const prevItem = currentIndex > 0 ? data[currentIndex - 1] : null;

    let isNewSection = false;
    if (currentIndex === 1) {
      isNewSection = true;
    } else if (prevItem && prevItem.id !== ADD_CUSTOM_EXERCISE_ID) {
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
        inputSearchStyle={styles.inputSearchStyle}
        data={data}
        maxHeight={400}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        value={value}
        autoScroll={false}
        search
        searchPlaceholder="Search exercises..."
        onChange={(item) => {
          if (item.id === ADD_CUSTOM_EXERCISE_ID) {
            onAddCustomExercise();
            return;
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

interface ExerciseRowData {
  rowId: number;
  exerciseId: number | null;
}

const WorkoutCard = ({
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

  const handleDragEnd = ({ data: reorderedData }: { data: ExerciseRowData[] }) => {
    exerciseUpdate(data.rowId, reorderedData);
  };

  const renderExerciseRow = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ExerciseRowData>) => (
    <ScaleDecorator>
      <View
        style={[
          styles.exerciseRow,
          isActive && styles.exerciseRowDragging,
        ]}
      >
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={100}
          style={styles.dragHandle}
        >
          <Text style={styles.dragHandleText}>≡</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <DropdownComponent
            labelField="name"
            valueField="id"
            placeholder="Select Exercise"
            data={exerciseList}
            onValueChange={(id: number) =>
              handleSelectExercise(item.rowId, id)
            }
            initialValue={item.exerciseId}
            onAddCustomExercise={onAddCustomExercise}
            onDeleteCustomExercise={onDeleteCustomExercise}
          />
        </View>
        <TouchableOpacity
          style={styles.inlineDeleteButton}
          onPress={() => removeRow(item.rowId)}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );

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
      <Text style={styles.dragHint}>Hold and drag ≡ to reorder</Text>
      <DraggableFlatList
        data={data.exercises}
        keyExtractor={(item: ExerciseRowData) => item.rowId.toString()}
        onDragEnd={handleDragEnd}
        renderItem={renderExerciseRow}
        scrollEnabled={false}
      />

      <TouchableOpacity style={styles.addExerciseButton} onPress={addRow}>
        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scrollContainer: {
    padding: 16,
  },
  workoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: "#FFF",
  },
  exerciseRowDragging: {
    backgroundColor: "#E8F4FD",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandleText: {
    fontSize: 20,
    color: "#999",
    fontWeight: "bold",
  },
  dragHint: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 8,
    fontStyle: "italic",
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
    color: "#FF3B30",
    fontSize: 20,
    fontWeight: "bold",
  },
  addExerciseButton: {
    marginTop: 8,
    padding: 10,
    alignItems: "center",
  },
  addExerciseText: {
    color: "#007AFF",
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
  sectionHeader: {
    backgroundColor: "#F2F2F7",
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
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    borderRadius: 8,
  },
  isolationToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingVertical: 8,
  },
  isolationHint: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
});
