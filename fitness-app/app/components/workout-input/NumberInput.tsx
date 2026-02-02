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
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-gray-600 text-sm w-16">{label}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={decrement}
          className="w-12 h-12 bg-gray-200 rounded-l-lg items-center justify-center"
        >
          <Text className="text-2xl font-bold text-gray-700">−</Text>
        </TouchableOpacity>
        <TextInput
          value={textValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType={isInteger ? "number-pad" : "decimal-pad"}
          selectTextOnFocus
          style={{
            width: 70,
            height: 48,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#E5E5E5",
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
            paddingVertical: 0,
          }}
        />
        <TouchableOpacity
          onPress={increment}
          className="w-12 h-12 bg-blue-500 rounded-r-lg items-center justify-center"
        >
          <Text className="text-2xl font-bold text-white">+</Text>
        </TouchableOpacity>
        {unit && <Text className="text-gray-600 ml-2 w-10">{unit}</Text>}
      </View>
    </View>
  );
};
