import { Text, TouchableOpacity, View } from "react-native";

interface UnitToggleProps {
  unit: "kg" | "lbs";
  onToggle: () => void;
}

export const UnitToggle = ({ unit, onToggle }: UnitToggleProps) => (
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
    <Text style={{ color: "#6E6E73", marginRight: 12 }}>Weight Unit:</Text>
    <TouchableOpacity
      onPress={onToggle}
      style={{ flexDirection: "row", backgroundColor: "#1C1C1E", borderRadius: 20, padding: 4, borderWidth: 1, borderColor: "#2C2C2E" }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 16,
          backgroundColor: unit === "kg" ? "#F5F5F5" : "transparent",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: unit === "kg" ? "#000" : "#6E6E73",
          }}
        >
          kg
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 16,
          backgroundColor: unit === "lbs" ? "#F5F5F5" : "transparent",
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: unit === "lbs" ? "#000" : "#6E6E73",
          }}
        >
          lbs
        </Text>
      </View>
    </TouchableOpacity>
  </View>
);
