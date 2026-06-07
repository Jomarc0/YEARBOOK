import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, shadows } from '../../components/webTheme';

export default function PaymentCancelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plan?: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <FontAwesome name="times-circle" size={60} color="#ef4444" />
        </View>
        <Text style={styles.title}>Payment Cancelled</Text>
        <Text style={styles.copy}>Your payment was not completed.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace({ pathname: '/payment', params: params.plan ? { plan: params.plan } : undefined } as any)}>
          <FontAwesome name="refresh" size={14} color="#ffffff" />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#ffffff', borderRadius: 24, padding: 34, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadows.card },
  iconCircle: { marginBottom: 16 },
  title: { color: colors.navy, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  copy: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  button: { minHeight: 48, borderRadius: 14, paddingHorizontal: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
