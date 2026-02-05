import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
              placeholderTextColor="#6E6E73"
              onChangeText={setExerciseName}
              selectionColor="#A0A0A0"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Muscle Group</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              containerStyle={{ backgroundColor: "#1C1C1E", borderColor: "#3A3A3C", borderRadius: 10 }}
              itemTextStyle={{ color: "#E5E5E5" }}
              itemContainerStyle={{ backgroundColor: "#1C1C1E" }}
              activeColor="#2C2C2E"
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
              containerStyle={{ backgroundColor: "#1C1C1E", borderColor: "#3A3A3C", borderRadius: 10 }}
              itemTextStyle={{ color: "#E5E5E5" }}
              itemContainerStyle={{ backgroundColor: "#1C1C1E" }}
              activeColor="#2C2C2E"
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
                <Text style={[styles.label, { marginBottom: 0 }]}>Isolation Exercise</Text>
                <Text style={styles.isolationHint}>
                  Track left/right reps separately
                </Text>
              </View>
              <Switch
                value={isIsolation}
                onValueChange={setIsIsolation}
                trackColor={{ false: "#3A3A3C", true: "#A0A0A0" }}
                thumbColor="#F5F5F5"
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
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#A0A0A0" />
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
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => onEdit(workout)} style={{ marginRight: 16 }}>
            <Text style={{ color: "#A0A0A0", fontSize: 13, fontWeight: "600" }}>Edit</Text>
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
            await db.runAsync(`UPDATE Workouts SET name = ? WHERE id = ?`, [
              workout.name || "New Workout",
              editingWorkoutId,
            ]);
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
          <Text style={{ color: "#6E6E73", fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Saved Plans</Text>
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
                <Text style={styles.deleteWorkoutText}>
                  Remove This Workout
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={addWorkoutRow}
          >
            <Text style={styles.secondaryButtonText}>
              + Add Another Workout
            </Text>
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

// Exercise Picker Modal Component
const ExercisePickerModal = ({
  visible,
  onClose,
  onSelect,
  data,
  selectedValue,
  onAddCustomExercise,
  onDeleteCustomExercise,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  data: any[];
  selectedValue: number | null;
  onAddCustomExercise: () => void;
  onDeleteCustomExercise: (id: number, name: string) => void;
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredData = searchText
    ? data.filter(
        (item: any) =>
          item.id === ADD_CUSTOM_EXERCISE_ID ||
          item.name?.toLowerCase().includes(searchText.toLowerCase())
      )
    : data;

  const renderExerciseItem = ({ item, index }: { item: any; index: number }) => {
    if (item.id === ADD_CUSTOM_EXERCISE_ID) {
      return (
        <TouchableOpacity
          style={styles.addCustomItem}
          onPress={() => {
            onAddCustomExercise();
            onClose();
          }}
        >
          <Text style={styles.addCustomItemText}>{item.name}</Text>
        </TouchableOpacity>
      );
    }

    const isCustom = item.is_custom === 1;
    const prevItem = index > 0 ? filteredData[index - 1] : null;

    let isNewSection = false;
    if (index === 1 || (index === 0 && filteredData[0]?.id !== ADD_CUSTOM_EXERCISE_ID)) {
      isNewSection = true;
    } else if (prevItem && prevItem.id !== ADD_CUSTOM_EXERCISE_ID) {
      if (isCustom !== (prevItem.is_custom === 1)) {
        isNewSection = true;
      } else if (!isCustom && prevItem.muscle_group !== item.muscle_group) {
        isNewSection = true;
      }
    }

    const sectionLabel = isCustom ? "CUSTOM" : item.muscle_group?.toUpperCase();
    const isSelected = item.id === selectedValue;

    return (
      <View>
        {isNewSection && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{sectionLabel}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.dropdownItem,
            isCustom && styles.customExerciseItem,
            isSelected && styles.selectedExerciseItem,
          ]}
          onPress={() => onSelect(item.id)}
        >
          <Text
            style={[
              styles.itemTextMain,
              isCustom && styles.customExerciseText,
              isSelected && styles.selectedExerciseText,
            ]}
          >
            {item.name}
          </Text>
          {isCustom && (
            <TouchableOpacity
              onPress={() => onDeleteCustomExercise(item.id, item.name)}
              style={styles.deleteExerciseButton}
            >
              <Text style={styles.deleteExerciseIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
          {isSelected && !isCustom && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
      <SafeAreaView style={styles.pickerModalContainer} edges={["top"]}>
        <View style={styles.pickerModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.pickerModalTitle}>Select Exercise</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#6E6E73"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor="#A0A0A0"
          />
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExerciseItem}
          keyboardShouldPersistTaps="handled"
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      </View>
    </Modal>
  );
};

// Exercise Selector Component (replaces DropdownComponent)
const ExerciseSelector = ({
  placeholder,
  data,
  onValueChange,
  initialValue,
  onAddCustomExercise,
  onDeleteCustomExercise,
}: {
  placeholder: string;
  data: any[];
  onValueChange: (id: number) => void;
  initialValue: number | null;
  onAddCustomExercise: () => void;
  onDeleteCustomExercise: (id: number, name: string) => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialValue);

  const selectedExercise = data.find((e: any) => e.id === selectedId);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={
            selectedExercise
              ? styles.selectedTextStyle
              : styles.placeholderStyle
          }
          numberOfLines={1}
        >
          {selectedExercise?.name || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <ExercisePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(id) => {
          setSelectedId(id);
          onValueChange(id);
          setModalVisible(false);
        }}
        data={data}
        selectedValue={selectedId}
        onAddCustomExercise={onAddCustomExercise}
        onDeleteCustomExercise={onDeleteCustomExercise}
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

  const handleDragEnd = ({
    data: reorderedData,
  }: {
    data: ExerciseRowData[];
  }) => {
    exerciseUpdate(data.rowId, reorderedData);
  };

  const renderExerciseRow = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ExerciseRowData>) => (
    <ScaleDecorator>
      <View
        style={[styles.exerciseRow, isActive && styles.exerciseRowDragging]}
      >
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={100}
          style={styles.dragHandle}
        >
          <Text style={styles.dragHandleText}>≡</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ExerciseSelector
            placeholder="Select Exercise"
            data={exerciseList}
            onValueChange={(id: number) => handleSelectExercise(item.rowId, id)}
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
    backgroundColor: "#000",
  },
  scrollContainer: {
    padding: 16,
  },
  workoutCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#3A3A3C",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#0A0A0A",
    color: "#F5F5F5",
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#1C1C1E",
  },
  exerciseRowDragging: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A4A4A",
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandleText: {
    fontSize: 20,
    color: "#6E6E73",
    fontWeight: "bold",
  },
  dragHint: {
    fontSize: 12,
    color: "#6E6E73",
    marginBottom: 8,
    fontStyle: "italic",
  },
  dropdown: {
    height: 45,
    borderColor: "#3A3A3C",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#0A0A0A",
  },
  inlineDeleteButton: {
    padding: 10,
    marginLeft: 8,
    justifyContent: "center",
  },
  deleteText: {
    color: "#FF453A",
    fontSize: 18,
    fontWeight: "600",
  },
  addExerciseButton: {
    marginTop: 12,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3A3C",
    borderStyle: "dashed",
  },
  addExerciseText: {
    color: "#A0A0A0",
    fontWeight: "600",
  },
  deleteWorkoutButton: {
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.3)",
  },
  deleteWorkoutText: {
    color: "#FF453A",
    fontWeight: "600",
  },
  footerActions: {
    padding: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#2C2C2E",
    backgroundColor: "#0A0A0A",
  },
  primaryButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A4A4A",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "600",
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#6E6E73",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#E5E5E5",
    flex: 1,
  },
  savedWorkoutTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F5F5",
    marginBottom: 8,
  },
  divider: {
    height: 0.5,
    backgroundColor: "#3A3A3C",
    marginBottom: 12,
  },
  savedExerciseRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  bullet: {
    fontSize: 8,
    color: "#A0A0A0",
    marginRight: 10,
  },
  savedExerciseText: {
    fontSize: 15,
    color: "#B0B0B0",
  },
  sectionHeader: {
    backgroundColor: "#0A0A0A",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#2C2C2E",
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6E6E73",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dropdownItem: {
    padding: 16,
    backgroundColor: "#000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#1C1C1E",
  },
  dropdownListContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  itemTextMain: {
    fontSize: 16,
    color: "#E5E5E5",
    fontWeight: "400",
  },
  savedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deleteIconText: {
    color: "#FF453A",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#3A3A3C",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F5F5",
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 18,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#A0A0A0",
    fontWeight: "600",
  },
  modalBody: {
    padding: 20,
  },
  addCustomItem: {
    padding: 16,
    backgroundColor: "#1C1C1E",
    borderBottomWidth: 0.5,
    borderBottomColor: "#2C2C2E",
    borderLeftWidth: 3,
    borderLeftColor: "#A0A0A0",
  },
  addCustomItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A0A0A0",
    letterSpacing: 0.3,
  },
  customExerciseItem: {
    backgroundColor: "#141414",
    borderLeftWidth: 2,
    borderLeftColor: "#4A4A4A",
  },
  customExerciseText: {
    color: "#B0B0B0",
  },
  deleteExerciseButton: {
    padding: 8,
  },
  deleteExerciseIcon: {
    fontSize: 14,
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
    color: "#6E6E73",
    marginTop: 2,
  },
  // Exercise Picker Modal styles - Dark theme with silver accents
  pickerModalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#0A0A0A",
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  pickerModalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#F5F5F5",
    letterSpacing: 0.3,
  },
  searchContainer: {
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  searchInput: {
    height: 42,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  exerciseList: {
    flex: 1,
    backgroundColor: "#000",
  },
  selectedExerciseItem: {
    backgroundColor: "#1C1C1E",
    borderLeftWidth: 3,
    borderLeftColor: "#A0A0A0",
  },
  selectedExerciseText: {
    color: "#F5F5F5",
    fontWeight: "600",
  },
  checkmark: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "600",
  },
  selectorButton: {
    height: 45,
    borderColor: "#3A3A3C",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1C1C1E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#6E6E73",
    marginLeft: 8,
  },
});
