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
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { crudStyles as styles } from "./crudStyles";
import { addGallery, deleteGallery, getGallery, updateGallery } from "../lib/api";
import { SafeAreaView } from 'react-native-safe-area-context';

const emptyForm = { id: null, image_url: "", caption: "" };

export default function Gallery() {
  const [gallery, setGallery] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("");

  const loadGallery = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await getGallery();
      setGallery(data);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load gallery.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateGallery(editingId, form);
        setStatus("Gallery entry updated successfully.");
      } else {
        await addGallery(form);
        setStatus("Gallery entry added successfully.");
      }

      resetForm();
      await loadGallery();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to save gallery entry.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      image_url: item.image_url || "",
      caption: item.caption || "",
    });
  };

  const handleDelete = (id) => {
    Alert.alert("Delete gallery item", "This will permanently remove the gallery record.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGallery(id);
            setStatus("Gallery entry deleted successfully.");
            await loadGallery();
          } catch (error) {
            setStatus(error.response?.data?.message || "Failed to delete gallery entry.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <Text style={styles.headerSubtitle}>CRUD integration for the `gallery` table.</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadGallery} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{editingId ? "Update Gallery Item" : "Add Gallery Item"}</Text>
          <TextInput style={styles.input} placeholder="Image URL" value={form.image_url} onChangeText={(value) => setForm({ ...form, image_url: value })} />
          <TextInput style={styles.input} placeholder="Caption" value={form.caption} onChangeText={(value) => setForm({ ...form, caption: value })} />
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSubmit}>
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {editingId ? "Update Gallery Item" : "Add Gallery Item"}
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
          <Text style={styles.sectionTitle}>Gallery List</Text>
          {gallery.length ? (
            gallery.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {item.image_url ? (
                  <Image
                    source={item.image_url}
                    style={{ width: "100%", height: 180, borderRadius: 14, marginBottom: 12, backgroundColor: "#EEF2F9" }}
                    contentFit="cover"
                  />
                ) : null}
                <Text style={styles.itemTitle}>{item.caption || "Untitled Entry"}</Text>
                <Text style={styles.itemText}>Image URL: {item.image_url || "-"}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.button, styles.secondaryButton, styles.actionButton]} onPress={() => handleEdit(item)}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.dangerButton, styles.actionButton]} onPress={() => handleDelete(item.id)}>
                    <Text style={[styles.buttonText, styles.dangerButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No gallery entries found yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
