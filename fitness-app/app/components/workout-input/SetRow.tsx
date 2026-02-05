import { Text, TouchableOpacity, View } from "react-native";
import { NumberInput } from "./NumberInput";
import { SetData } from "./types";

interface SetRowProps {
  setData: SetData;
  setIndex: number;
  equipmentType: string;
  weightUnit: "kg" | "lbs";
  isIsolation: boolean;
  onUpdate: (updated: SetData) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export const SetRow = ({
  setData,
  setIndex,
  equipmentType,
  weightUnit,
  isIsolation,
  onUpdate,
  onRemove,
  canRemove,
}: SetRowProps) => {
  // Calculate weight increment based on unit and equipment type
  const getWeightStep = () => {
    if (weightUnit === "kg") {
      return 1;
    } else {
      return equipmentType === "machine" ? 5 : 2.5;
    }
  };

  const weightStep = getWeightStep();

  return (
    <View style={{ backgroundColor: "#0A0A0A", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#2C2C2E" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontWeight: "600", color: "#F5F5F5" }}>Set {setIndex + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={onRemove}>
            <Text style={{ color: "#FF453A", fontSize: 13 }}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <NumberInput
        label="Weight"
        value={setData.weight}
        step={weightStep}
        unit={weightUnit}
        isInteger={weightUnit === "kg"}
        onChange={(val) => onUpdate({ ...setData, weight: val })}
      />

      {isIsolation ? (
        // Isolation exercise: show L/R rep inputs
        <>
          <NumberInput
            label="L Reps"
            value={setData.leftReps ?? 0}
            step={1}
            max={100}
            isInteger={true}
            onChange={(val) => onUpdate({ ...setData, leftReps: Math.floor(val) })}
          />
          <NumberInput
            label="R Reps"
            value={setData.rightReps ?? 0}
            step={1}
            max={100}
            isInteger={true}
            onChange={(val) => onUpdate({ ...setData, rightReps: Math.floor(val) })}
          />
        </>
      ) : (
        // Bilateral exercise: show single reps input
        <NumberInput
          label="Reps"
          value={setData.reps}
          step={1}
          max={100}
          isInteger={true}
          onChange={(val) => onUpdate({ ...setData, reps: Math.floor(val) })}
        />
      )}

      <NumberInput
        label="Half"
        value={setData.halfReps}
        step={1}
        max={50}
        isInteger={true}
        onChange={(val) => onUpdate({ ...setData, halfReps: Math.floor(val) })}
      />
    </View>
  );
};
