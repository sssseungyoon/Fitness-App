import { Text, TouchableOpacity, View } from "react-native";
import { SetRow } from "./SetRow";
import { ExerciseRecord, SetData } from "./types";

interface ExerciseCardProps {
  exercise: ExerciseRecord;
  weightUnit: "kg" | "lbs";
  onUpdate: (updated: ExerciseRecord) => void;
}

export const ExerciseCard = ({
  exercise,
  weightUnit,
  onUpdate,
}: ExerciseCardProps) => {
  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: SetData = {
      setNumber: exercise.sets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      halfReps: 0,
      leftReps: exercise.isIsolation ? (lastSet?.leftReps || 0) : undefined,
      rightReps: exercise.isIsolation ? (lastSet?.rightReps || 0) : undefined,
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

  // Format reps display based on isolation status
  const formatReps = (prevSet: typeof exercise.previousSets[0]) => {
    if (exercise.isIsolation && (prevSet.leftReps !== undefined || prevSet.rightReps !== undefined)) {
      return `L:${prevSet.leftReps ?? 0} R:${prevSet.rightReps ?? 0}`;
    }
    return `${prevSet.reps}`;
  };

  return (
    <View style={{ backgroundColor: "#1C1C1E", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2C2C2E" }}>
      <Text style={{ fontSize: 17, fontWeight: "600", color: "#F5F5F5", marginBottom: 4 }}>
        {exercise.exerciseName}
      </Text>
      <Text style={{ fontSize: 12, color: "#6E6E73", marginBottom: 12, textTransform: "capitalize" }}>
        {exercise.equipmentType}
        {exercise.isIsolation && " • Isolation"}
      </Text>

      {/* Previous Records Section */}
      {exercise.previousSets.length > 0 && (
        <View style={{ backgroundColor: "#0A0A0A", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#2C2C2E" }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6E6E73", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Previous ({formatDate(exercise.previousSets[0].date)})
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {exercise.previousSets.map((prevSet, idx) => (
              <View
                key={idx}
                style={{ backgroundColor: "#1C1C1E", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: "#3A3A3C" }}
              >
                <Text style={{ fontSize: 11, color: "#A0A0A0" }}>
                  Set {prevSet.setNumber}: {prevSet.weight}
                  {weightUnit} × {formatReps(prevSet)}
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
          isIsolation={exercise.isIsolation}
          onUpdate={(updated) => updateSet(index, updated)}
          onRemove={() => removeSet(index)}
          canRemove={exercise.sets.length > 1}
        />
      ))}

      <TouchableOpacity
        onPress={addSet}
        style={{ paddingVertical: 12, alignItems: "center", borderTopWidth: 0.5, borderTopColor: "#3A3A3C", marginTop: 8 }}
      >
        <Text style={{ color: "#A0A0A0", fontWeight: "600" }}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};
