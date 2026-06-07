import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, shadows } from '../../components/webTheme';
import { getAppConfig, unwrap } from '../../lib/api';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tier?: string }>();
  const tier = params.tier === 'standard' ? 'Standard' : 'Premium';
  const [config, setConfig] = React.useState<any>(null);
  const yearbookName = config?.yearbook_name?.replace(/\s*Digital Yearbook/i, '') || 'Sinag-Bughaw';

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(tabs)/home' as any), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    let active = true;

    getAppConfig()
      .then((payload) => {
        if (active) setConfig(unwrap(payload));
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <FontAwesome name="check-circle" size={60} color="#22c55e" />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.copy}>Your {yearbookName} {tier} access is now active.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/home' as any)}>
          <FontAwesome name="home" size={14} color="#ffffff" />
          <Text style={styles.buttonText}>Go to Home</Text>
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
