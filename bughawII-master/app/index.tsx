import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <Image source={require('../assets/images/NU-building.jpg')} style={styles.background} contentFit="cover" />
      <View style={styles.scrim} />
      <View style={styles.topShade} />
      <View style={styles.bottomShade} />

      <View style={styles.content}>
        <Image source={require('../assets/images/NU_logo.png')} style={styles.logo} contentFit="contain" />

        <View style={styles.copyBlock}>
          <Text style={styles.kicker}>National University Lipa</Text>
          <Text style={styles.title}>Sinag-Bughaw</Text>
          <Text style={styles.subtitle}>
            A digital yearbook for memories, classmates, and campus stories.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')} activeOpacity={0.9}>
              <Text style={styles.primaryText}>Sign In</Text>
              <FontAwesome name="arrow-right" size={14} color="#1A2547" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/signup')} activeOpacity={0.9}>
              <Text style={styles.secondaryText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2547' },
  background: { ...StyleSheet.absoluteFillObject },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9,19,43,0.48)' },
  topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: '32%', backgroundColor: 'rgba(9,19,43,0.32)' },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%', backgroundColor: 'rgba(9,19,43,0.72)' },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30 },
  logo: { width: 78, height: 78 },
  copyBlock: { paddingBottom: 4 },
  kicker: { color: '#F5A623', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 42, lineHeight: 48, fontWeight: '900', marginTop: 10 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 24, fontWeight: '700', marginTop: 12, maxWidth: 330 },
  actions: { marginTop: 28, gap: 12 },
  primaryButton: { minHeight: 54, borderRadius: 15, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  primaryText: { color: '#1A2547', fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 54, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
