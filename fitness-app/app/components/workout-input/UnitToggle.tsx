import { Text, TouchableOpacity, View } from "react-native";

interface UnitToggleProps {
  unit: "kg" | "lbs";
  onToggle: () => void;
}

export const UnitToggle = ({ unit, onToggle }: UnitToggleProps) => (
  <View className="flex-row items-center justify-center mb-4">
    <Text className="text-gray-600 mr-3">Weight Unit:</Text>
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row bg-gray-200 rounded-full p-1"
    >
      <View
        className={`px-4 py-2 rounded-full ${
          unit === "kg" ? "bg-blue-500" : "bg-transparent"
        }`}
      >
        <Text
          className={`font-semibold ${
            unit === "kg" ? "text-white" : "text-gray-600"
          }`}
        >
          kg
        </Text>
      </View>
      <View
        className={`px-4 py-2 rounded-full ${
          unit === "lbs" ? "bg-blue-500" : "bg-transparent"
        }`}
      >
        <Text
          className={`font-semibold ${
            unit === "lbs" ? "text-white" : "text-gray-600"
          }`}
        >
          lbs
        </Text>
      </View>
    </TouchableOpacity>
  </View>
);
