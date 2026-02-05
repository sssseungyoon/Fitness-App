import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F5F5F5",
        tabBarInactiveTintColor: "#6E6E73",
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          borderTopColor: "#2C2C2E",
          borderTopWidth: 0.5,
        },
        headerStyle: {
          backgroundColor: "#0A0A0A",
        },
        headerTintColor: "#F5F5F5",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "User Profile",
          headerTitleAlign: "center",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen
        name="edit-workout"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-record"
        options={{
          title: "Edit Workout",
          headerTitleAlign: "center",
          href: null,
        }}
      />
    </Tabs>
  );
};

export default _layout;
