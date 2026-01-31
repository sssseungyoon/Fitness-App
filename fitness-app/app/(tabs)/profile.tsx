import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";

const EditProfileButton = ({ setIsEditing, setForm, existingUser }: any) => (
  <TouchableOpacity
    style={styles.editButton}
    onPress={() => {
      setForm({
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      });
      setIsEditing(true);
    }}
  >
    <Text style={styles.editText}>Edit Profile</Text>
  </TouchableOpacity>
);

const SaveAndCancelButton = ({ handleOnSave, handleOnCancel }: any) => (
  <View style={styles.buttonContainer}>
    <TouchableOpacity style={styles.editButton} onPress={handleOnSave}>
      <Text style={styles.editText}>Save</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.deleteButton} onPress={handleOnCancel}>
      <Text style={styles.deleteText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);

// Props of a component comes in as a one JSON argument, so if you are using a prop to pass in neccessary arguments for a function
// you must destruct the variables inside a curly bracket to indicate that you are working with diff vars within one JSON.
// For typescript, you must give the type definition as a json object of the same structure with the varaible's type indicated
// after the name of the variable followed by a colon
const UserDetails = ({
  isEditing,
  setIsEditing,

  existingUser,

  handleOnSaveChanges,
  handleOnCancelChanges,

  form,
  setForm,
}: any) => {
  // A reusable sub-component for the table rows
  //   hello
  const InfoRow = ({
    label,
    value,
    isLast = false,
  }: {
    label: string;
    value: string;
    isLast?: boolean;
  }) => (
    <View style={[styles.row, isLast && styles.noBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not Set"}</Text>
    </View>
  );

  const InputRow = ({
    label,
    value,
    isLast = false,
    onChangeText,
  }: {
    label: string;
    value: string;
    isLast?: boolean;
    onChangeText: any;
  }) => (
    <View style={[styles.row, isLast && styles.noBorder]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.value}
        value={value || ""}
        onChangeText={onChangeText}
      />
    </View>
  );

  return (
    <View style={styles.tableContainer}>
      <Text style={styles.tableHeader}>Account Details</Text>

      <InfoRow label="User ID" value={`#${existingUser.id}`} />
      {isEditing ? (
        <InputRow
          label="First Name"
          value={form.firstName}
          onChangeText={(text: string) => setForm({ ...form, firstName: text })}
        />
      ) : (
        <InfoRow label="First Name" value={existingUser.firstName} />
      )}
      {isEditing ? (
        <InputRow
          label="Last Name"
          value={form.lastName}
          onChangeText={(text: string) => setForm({ ...form, lastName: text })}
        />
      ) : (
        <InfoRow label="Last Name" value={existingUser.lastName} />
      )}
      {/* Example of adding more data later */}
      <InfoRow label="Status" value="Active" isLast={true} />
      {!isEditing ? (
        <EditProfileButton
          setIsEditing={setIsEditing}
          setForm={setForm}
          existingUser={existingUser}
        />
      ) : (
        <SaveAndCancelButton
          handleOnSave={handleOnSaveChanges}
          handleOnCancel={handleOnCancelChanges}
        />
      )}
    </View>
  );
};

const UserForm = ({ form, setForm, handleSubmitNewUser }: any) => {
  return (
    <View>
      <TextInput
        placeholder="First Name"
        value={form.firstName}
        onChangeText={(text) => setForm({ ...form, firstName: text })}
        // when you want to update the state, you must change the entire state, and if you want to leave some components within the state unchanged, you would have to create a shallow copy of the entire object and alter the specific components to the desired value
      />
      <TextInput
        placeholder="Last Name"
        value={form.lastName}
        onChangeText={(text) => setForm({ ...form, lastName: text })}
      />
      <Button title="Add User" onPress={handleSubmitNewUser} />
    </View>
  );
};

// ProfileView
const ProfileView = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [existingUser, setExistingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const db = useSQLiteContext();

  //   check if the user already exists and update the existing user state
  useEffect(() => {
    const checkUser = async () => {
      try {
        const result = await db.getFirstAsync("SELECT * FROM users LIMIT 1");
        setExistingUser(result);
      } catch (Error) {
        console.log(Error);
      } finally {
        setIsLoading(false);
        //   it is the best practice to return the ui componenets outside of the useEffect function
      }
    };
    checkUser();
  }, []);

  //   ui for loading when the api tries to access the database
  if (isLoading) {
    return (
      <View className="flex-1 justify-center ">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  //   logic for handling submitting a new user info
  const handleSubmitNewUser = async () => {
    try {
      if (!form.firstName || !form.lastName) {
        throw new Error("All fields are required");
      }
      await db.runAsync(
        `
                            INSERT INTO users (firstName, lastName) VALUES (?,?)`,
        [form.firstName, form.lastName]
      );
      Alert.alert("Success", "User data saved successful");
      setExistingUser({ ...existingUser, ...form });
      setForm({
        firstName: "",
        lastName: "",
      });
    } catch (Error: any) {
      console.error(Error);
      Alert.alert(
        "Error",
        Error.message || "Error has occured when submitting the user form"
      );
    }
  };
  // logic for handling saving changes
  const handleOnSaveChanges = async () => {
    try {
      if (!form.firstName || !form.lastName) {
        throw new Error("All fields are required");
      }
      //   this is how you would go on to update data in a database
      await db.runAsync(
        `UPDATE users SET firstName = ?, lastName = ? WHERE id = ?`,
        [form.firstName, form.lastName, existingUser.id]
      );
      setExistingUser({ ...existingUser, ...form });
      setIsEditing(false);
      Alert.alert("Success", "Profile Updated!");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "failed to save changes");
    }
  };
  //   logic for handling canceling changes
  const handleOnCancelChanges = async () => {
    setForm({
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
    });
    setIsEditing(false);
  };

  // you have to put the return statement in front of the ternary operator
  // ternary operator will return either one of the components as the result of the if-statement logic, but without the return statement, the data will go nowhere
  return existingUser ? (
    <UserDetails
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      existingUser={existingUser}
      handleOnSaveChanges={handleOnSaveChanges}
      handleOnCancelChanges={handleOnCancelChanges}
      form={form}
      setForm={setForm}
    />
  ) : (
    <UserForm
      form={form}
      setForm={setForm}
      handleSubmitNewUser={handleSubmitNewUser}
    />
  );
};

const Profile = () => {
  // user database name
  const userDB = "userDatabase2.db";
  //   states

  const handleOnInit = async (db: SQLiteDatabase) => {
    try {
      await db.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL
            );
            `);
    } catch (Error: any) {
      console.log(Error);
    }
  };

  return (
    <SafeAreaView className="justify-center items-center">
      <SQLiteProvider
        databaseName={userDB}
        onInit={handleOnInit}
        options={{
          useNewConnection: false, // this would restablish a connection even when a connection already exists with a database
          //   you might want to turn this as true when you are daeling with heavy background processing. However, one must be careful with
          // multiple connections as
        }}
      >
        <ProfileView />
      </SQLiteProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // styles related to tables
  tableContainer: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e1e4e8",
    marginVertical: 20,
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },

  //   styles related to buttons
  buttonContainer: {
    marginTop: 20,
    gap: 12, // Adds space between buttons
  },
  editButton: {
    backgroundColor: "#007AFF", // Classic iOS Blue
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3, // Android shadow
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30", // Danger Red
  },
  deleteText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default Profile;
