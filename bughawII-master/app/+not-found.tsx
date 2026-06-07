import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getAppConfig, unwrap } from '../lib/api';

export default function NotFoundScreen() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const schoolName = config?.school_name || 'National University Lipa';
  const yearbookName = config?.yearbook_name || 'Sinag-Bughaw Digital Yearbook';

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
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.copy}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)/home')}>
          <FontAwesome name="home" size={16} color="#1d2b4b" />
          <Text style={styles.buttonText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>(c) 2026 {schoolName} - {yearbookName.replace(/\s*Digital Yearbook/i, '')}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1d2b4b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  code: {
    color: '#fdb813',
    fontSize: 104,
    fontWeight: '900',
    lineHeight: 112,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  copy: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fdb813',
    borderRadius: 16,
    paddingHorizontal: 28,
  },
  buttonText: {
    color: '#1d2b4b',
    fontSize: 15,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 34,
    color: 'rgba(255, 255, 255, 0.22)',
    fontSize: 11,
    textAlign: 'center',
  },
});
