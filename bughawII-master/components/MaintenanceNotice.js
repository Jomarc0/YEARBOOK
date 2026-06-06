import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function MaintenanceNotice({ config = {} }) {
  const email = config.contact_email;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.title}>Under maintenance</Text>
        <Text style={styles.copy}>
          {config.yearbook_name || 'Sinag-Bughaw Digital Yearbook'} is temporarily unavailable while we perform updates. Please check back soon.
        </Text>
        {email ? (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${email}`)}>
            <Text style={styles.email}>Questions? {email}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 28,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 5,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    color: '#d97706',
    fontSize: 28,
    fontWeight: '900',
  },
  title: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  copy: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 14,
  },
  email: {
    color: '#3f51b5',
    fontSize: 12,
    fontWeight: '800',
  },
});
