import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { crudStyles as styles } from "./crudStyles";
import { deleteUser, getUsers, updateUser } from "../lib/api";
import { SafeAreaView } from 'react-native-safe-area-context';

const emptyForm = { id: null, email: "", name: "", course: "", section: "", password: "" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load users.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const startEdit = (user) => {
    setForm({
      id: user.id,
      email: user.email || "",
      name: user.name || "",
      course: user.course || "",
      section: user.section || "",
      password: "",
    });
    setMessage(`Editing user #${user.id}`);
  };

  const handleUpdate = async () => {
    if (!form.id) {
      Alert.alert("Select a user", "Tap Update on a user card first.");
      return;
    }

    try {
      setLoading(true);
      await updateUser(form.id, {
        email: form.email,
        name: form.name,
        course: form.course,
        section: form.section,
        ...(form.password ? { password: form.password } : {}),
      });
      setForm(emptyForm);
      setMessage("User updated successfully.");
      await loadUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete user", "This will permanently remove the user.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUser(id);
            setMessage("User deleted successfully.");
            if (form.id === id) {
              setForm(emptyForm);
            }
            await loadUsers();
          } catch (error) {
            setMessage(error.response?.data?.message || "Failed to delete user.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerSubtitle}>GET, PUT, and DELETE connected to `/users`.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Update User</Text>
          <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(value) => setForm({ ...form, email: value })} />
          <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
          <TextInput style={styles.input} placeholder="Course" value={form.course} onChangeText={(value) => setForm({ ...form, course: value })} />
          <TextInput style={styles.input} placeholder="Section" value={form.section} onChangeText={(value) => setForm({ ...form, section: value })} />
          <TextInput style={styles.input} placeholder="New Password (optional)" secureTextEntry value={form.password} onChangeText={(value) => setForm({ ...form, password: value })} />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleUpdate} disabled={loading}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>{loading ? "Saving..." : "Save User Changes"}</Text>
          </TouchableOpacity>
          {!!message && <Text style={[styles.statusText, message.includes("Failed") ? styles.errorText : null]}>{message}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Registered Users</Text>
          {users.length ? (
            users.map((user) => (
              <View key={user.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{user.name || "Unnamed User"}</Text>
                <Text style={styles.itemText}>Email: {user.email}</Text>
                <Text style={styles.itemText}>Course: {user.course || "-"}</Text>
                <Text style={styles.itemText}>Section: {user.section || "-"}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.button, styles.secondaryButton, styles.actionButton]} onPress={() => startEdit(user)}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.dangerButton, styles.actionButton]} onPress={() => handleDelete(user.id)}>
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No users found yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
