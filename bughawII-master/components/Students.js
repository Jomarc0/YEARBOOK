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
import { addStudent, deleteStudent, getStudents, updateStudent } from "../lib/api";
import { SafeAreaView } from 'react-native-safe-area-context';

const emptyForm = { id: null, name: "", course: "", section: "", photo: "" };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");

  const loadStudents = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load students.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateStudent(editingId, form);
        setStatus("Student updated successfully.");
      } else {
        await addStudent(form);
        setStatus("Student added successfully.");
      }

      resetForm();
      await loadStudents();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to save student.");
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({
      id: student.id,
      name: student.name || "",
      course: student.course || "",
      section: student.section || "",
      photo: student.photo || "",
    });
  };

  const handleDelete = (id) => {
    Alert.alert("Delete student", "This will permanently remove the student record.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStudent(id);
            setStatus("Student deleted successfully.");
            await loadStudents();
          } catch (error) {
            setStatus(error.response?.data?.message || "Failed to delete student.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.headerSubtitle}>CRUD integration for the `students` table.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStudents} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{editingId ? "Update Student" : "Add Student"}</Text>
          <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(value) => setForm({ ...form, name: value })} />
          <TextInput style={styles.input} placeholder="Course" value={form.course} onChangeText={(value) => setForm({ ...form, course: value })} />
          <TextInput style={styles.input} placeholder="Section" value={form.section} onChangeText={(value) => setForm({ ...form, section: value })} />
          <TextInput style={styles.input} placeholder="Photo URL" value={form.photo} onChangeText={(value) => setForm({ ...form, photo: value })} />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSubmit}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {editingId ? "Update Student" : "Add Student"}
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
          <Text style={styles.sectionTitle}>Student List</Text>
          {students.length ? (
            students.map((student) => (
              <View key={student.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{student.name}</Text>
                <Text style={styles.itemText}>Course: {student.course}</Text>
                <Text style={styles.itemText}>Section: {student.section}</Text>
                <Text style={styles.itemText}>Photo: {student.photo || "-"}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.button, styles.secondaryButton, styles.actionButton]} onPress={() => handleEdit(student)}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.dangerButton, styles.actionButton]} onPress={() => handleDelete(student.id)}>
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No students found yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
