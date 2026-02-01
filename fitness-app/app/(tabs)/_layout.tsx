import React from "react";
import { Tabs } from "expo-router";

const _layout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          headerTitleAlign: "center",
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "User Profile",
          headerTitleAlign: "center",
          tabBarLabel: "Profile",
        }}
      />
      <Tabs.Screen
        name="edit-workout"
        options={{
          href: null, // Hide from tab bar - accessed via modal
        }}
      />
    </Tabs>
  );
};

export default _layout;
