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
import { addFaculty, deleteFaculty, getFaculty, updateFaculty } from "../lib/api";
import { SafeAreaView } from 'react-native-safe-area-context';

const emptyForm = { id: null, name: "", department: "", email: "" };

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");

  const loadFaculty = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getFaculty();
      setFaculty(data);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load faculty.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFaculty();
  }, [loadFaculty]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateFaculty(editingId, form);
        setStatus("Faculty member updated successfully.");
      } else {
        await addFaculty(form);
        setStatus("Faculty member added successfully.");
      }

      resetForm();
      await loadFaculty();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to save faculty member.");
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setForm({
      id: member.id,
      name: member.name || "",
      department: member.department || "",
      email: member.email || "",
    });
  };

  const handleDelete = (id) => {
    Alert.alert("Delete faculty", "This will permanently remove the faculty record.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFaculty(id);
            setStatus("Faculty member deleted successfully.");
            await loadFaculty();
          } catch (error) {
            setStatus(error.response?.data?.message || "Failed to delete faculty member.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Faculty</Text>
        <Text style={styles.headerSubtitle}>CRUD integration for the `faculty` table.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadFaculty} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{editingId ? "Update Faculty" : "Add Faculty"}</Text>
          <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
          <TextInput style={styles.input} placeholder="Department" value={form.department} onChangeText={(value) => setForm({ ...form, department: value })} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSubmit}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {editingId ? "Update Faculty" : "Add Faculty"}
            </Text>
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity style={[styles.button, styles.secondaryButton, { marginTop: 10 }]} onPress={resetForm}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel Edit</Text>
            </TouchableOpacity>
          ) : null}
          {!!status && <Text style={[styles.statusText, status.includes("Failed") ? styles.errorText : null]}>{status}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Faculty List</Text>
          {faculty.length ? (
            faculty.map((member) => (
              <View key={member.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{member.name}</Text>
                <Text style={styles.itemText}>Department: {member.department}</Text>
                <Text style={styles.itemText}>Email: {member.email}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.button, styles.secondaryButton, styles.actionButton]} onPress={() => handleEdit(member)}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.dangerButton, styles.actionButton]} onPress={() => handleDelete(member.id)}>
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No faculty records found yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
