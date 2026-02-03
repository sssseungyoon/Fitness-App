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
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <Text className="text-lg font-bold text-gray-800 mb-1">
        {exercise.exerciseName}
      </Text>
      <Text className="text-xs text-gray-500 mb-3 capitalize">
        {exercise.equipmentType}
        {exercise.isIsolation && " • Isolation"}
      </Text>

      {/* Previous Records Section */}
      {exercise.previousSets.length > 0 && (
        <View className="bg-amber-50 rounded-lg p-3 mb-3 border border-amber-200">
          <Text className="text-sm font-semibold text-amber-800 mb-2">
            Previous ({formatDate(exercise.previousSets[0].date)})
          </Text>
          <View className="flex-row flex-wrap">
            {exercise.previousSets.map((prevSet, idx) => (
              <View
                key={idx}
                className="bg-white rounded px-2 py-1 mr-2 mb-1 border border-amber-300"
              >
                <Text className="text-xs text-gray-600">
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
        className="py-2 items-center border-t border-gray-200 mt-2"
      >
        <Text className="text-blue-500 font-semibold">+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};
