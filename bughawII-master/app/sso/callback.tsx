import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { fetchCurrentUser, saveToken } from '../../lib/api';
import { colors, shadows } from '../../components/webTheme';

export default function SSOCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('Authenticating your Google account...');

  useEffect(() => {
    const run = async () => {
      const token = Array.isArray(params.token) ? params.token[0] : params.token;
      const error = Array.isArray(params.error) ? params.error[0] : params.error;

      if (error || !token) {
        setMessage('Google sign-in failed.');
        setTimeout(() => router.replace('/login'), 900);
        return;
      }

      await saveToken(token);
      setMessage('Loading your profile...');
      await fetchCurrentUser();
      setMessage('All set.');
      setTimeout(() => router.replace('/(tabs)/home'), 500);
    };

    run().catch(() => {
      setMessage('Google sign-in failed.');
      setTimeout(() => router.replace('/login'), 900);
    });
  }, [params.error, params.token, router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <FontAwesome name="google" size={24} color={colors.indigo} />
        </View>
        <ActivityIndicator color={colors.navy} style={{ marginTop: 22 }} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 34, alignItems: 'center', ...shadows.card },
  iconBox: { width: 62, height: 62, borderRadius: 18, backgroundColor: colors.softIndigo, alignItems: 'center', justifyContent: 'center' },
  message: { color: colors.navy, fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 18 },
});
