import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'brand',
    title: 'Sinag-Bughaw',
    text: 'The official NU Lipa digital yearbook for memories, classmates, and campus stories.',
    logo: true,
  },
  {
    key: 'feature',
    title: 'Find Your People',
    text: 'Search students, browse albums, and reconnect through a mobile-first yearbook experience.',
    icon: 'users',
  },
  {
    key: 'start',
    title: 'Start Your Journey',
    text: 'Sign in or create your account to access your yearbook community.',
    icon: 'graduation-cap',
    actions: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.logo ? (
              <Image source={require('../assets/images/nuicon.svg')} style={styles.logo} contentFit="contain" />
            ) : (
              <View style={styles.illustration}>
                <FontAwesome name={item.icon as any} size={38} color="#F5A623" />
              </View>
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
            {item.actions ? (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
                  <Text style={styles.primaryText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/signup')}>
                  <Text style={styles.secondaryText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      />
      <View style={styles.dots}>
        {slides.map((item, dotIndex) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.dot, index === dotIndex && styles.dotActive]}
            onPress={() => listRef.current?.scrollToIndex({ index: dotIndex })}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A2547' },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 72, height: 72, marginBottom: 24 },
  illustration: { width: 112, height: 112, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  text: { color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 },
  actions: { width: '100%', gap: 12, marginTop: 34 },
  primaryButton: { height: 52, borderRadius: 12, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#1A2547', fontSize: 15, fontWeight: '900' },
  secondaryButton: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  dots: { position: 'absolute', bottom: 34, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)' },
  dotActive: { width: 22, backgroundColor: '#F5A623' },
});
