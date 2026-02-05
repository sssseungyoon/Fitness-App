import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  unit?: string;
  label: string;
  min?: number;
  max?: number;
  isInteger?: boolean;
}

export const NumberInput = ({
  value,
  onChange,
  step = 1,
  unit,
  label,
  min = 0,
  max = 9999,
  isInteger = false,
}: NumberInputProps) => {
  const [textValue, setTextValue] = useState(
    isInteger ? value.toString() : value.toFixed(1)
  );

  // Sync text value when external value changes
  useEffect(() => {
    setTextValue(isInteger ? value.toString() : value.toFixed(1));
  }, [value, isInteger]);

  const increment = () => {
    const newVal = Math.min(max, value + step);
    onChange(Number(newVal.toFixed(1)));
  };

  const decrement = () => {
    const newVal = Math.max(min, value - step);
    onChange(Number(newVal.toFixed(1)));
  };

  const handleTextChange = (text: string) => {
    // Allow empty string, numbers, and one decimal point
    if (isInteger) {
      // Only allow digits
      if (/^\d*$/.test(text)) {
        setTextValue(text);
      }
    } else {
      // Allow digits and one decimal point
      if (/^\d*\.?\d*$/.test(text)) {
        setTextValue(text);
      }
    }
  };

  const handleBlur = () => {
    const num = parseFloat(textValue);
    if (!isNaN(num) && num >= min && num <= max) {
      // Round to step precision
      const rounded = isInteger
        ? Math.round(num)
        : Math.round(num / step) * step;
      const clamped = Math.max(min, Math.min(max, rounded));
      onChange(Number(clamped.toFixed(1)));
      setTextValue(isInteger ? clamped.toString() : clamped.toFixed(1));
    } else {
      // Reset to current value if invalid
      setTextValue(isInteger ? value.toString() : value.toFixed(1));
    }
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
      <Text style={{ color: "#8E8E93", fontSize: 13, width: 64 }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={decrement}
          style={{ width: 44, height: 44, backgroundColor: "#2C2C2E", borderTopLeftRadius: 8, borderBottomLeftRadius: 8, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 22, fontWeight: "600", color: "#A0A0A0" }}>−</Text>
        </TouchableOpacity>
        <TextInput
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType={isInteger ? "number-pad" : "decimal-pad"}
          selectTextOnFocus
          style={{
            width: 70,
            height: 44,
            backgroundColor: "#1C1C1E",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#3A3A3C",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
            color: "#F5F5F5",
            paddingVertical: 0,
          }}
        />
        <TouchableOpacity
          onPress={increment}
          style={{ width: 44, height: 44, backgroundColor: "#F5F5F5", borderTopRightRadius: 8, borderBottomRightRadius: 8, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 22, fontWeight: "600", color: "#000" }}>+</Text>
        </TouchableOpacity>
        {unit && <Text style={{ color: "#6E6E73", marginLeft: 8, width: 36 }}>{unit}</Text>}
      </View>
    </View>
  );
};
