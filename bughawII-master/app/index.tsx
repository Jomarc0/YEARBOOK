import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../components/webTheme';
import { getAppConfig, unwrap } from '../lib/api';

const STATS = [
  { icon: 'graduation-cap', value: '12,500+', label: 'Graduates', color: '#3f51b5', bg: '#eef2ff' },
  { icon: 'book', value: '35+', label: 'Programs', color: '#d97706', bg: '#fffbeb' },
  { icon: 'image', value: '50k+', label: 'Photos', color: '#059669', bg: '#ecfdf5' },
];

const EXPLORE = [
  {
    image: require('../assets/images/nustud.jpg'),
    title: 'Student Directory',
    desc: 'Find classmates and connect with alumni from various batches.',
    route: '/directory',
    badge: 'DIRECTORY',
    color: '#3f51b5',
  },
  {
    image: require('../assets/images/gallerynu.jpg'),
    title: 'Photo Gallery',
    desc: 'Browse collections from university events and memorable moments.',
    route: '/gallery',
    badge: 'GALLERY',
    color: '#059669',
  },
  {
    image: require('../assets/images/nufaculty.jpg'),
    title: 'Faculty & Staff',
    desc: 'Meet the mentors and staff who guided your academic journey.',
    route: '/faculty',
    badge: 'FACULTY',
    color: '#d97706',
  },
];

const FEATURE_TEMPLATES = [
  { icon: 'shield', title: 'Private & Secure', desc: (schoolName: string) => `Your data stays within the ${schoolName} community.` },
  { icon: 'mobile', title: 'Works Everywhere', desc: 'Browse cleanly on desktop, tablet, or mobile.' },
  { icon: 'refresh', title: 'Always Up to Date', desc: 'New batches and galleries are added automatically.' },
  { icon: 'comments', title: 'Stay Connected', desc: 'Message classmates and exchange voice notes.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    let active = true;

    getAppConfig()
      .then((payload) => {
        if (active) setConfig(unwrap(payload));
      })
      .catch(() => {
        if (active) setConfig(null);
      });

    return () => { active = false; };
  }, []);

  const schoolName = config?.school_name || 'National University Lipa';
  const yearbookName = config?.yearbook_name || 'Sinag-Bughaw Digital Yearbook';
  const features = FEATURE_TEMPLATES.map((item) => ({
    ...item,
    desc: typeof item.desc === 'function' ? item.desc(schoolName) : item.desc,
  }));

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <ImageBackground source={require('../assets/images/NU-building.jpg')} style={styles.hero} resizeMode="cover">
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroContent}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/images/nuicon.svg')} style={styles.logo} contentFit="contain" />
              <View>
                <Text style={styles.brandName}>{yearbookName.replace(/\s*Digital Yearbook/i, '')}</Text>
                <Text style={styles.brandMeta}>{schoolName}</Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroBadge}>
                <FontAwesome name="star" size={10} color={colors.gold} />
                <Text style={styles.heroBadgeText}>EXCELLENCE IN EDUCATION</Text>
              </View>
              <Text style={styles.heroTitle}>Your Legacy,{'\n'}<Text style={styles.goldText}>Digitally Preserved.</Text></Text>
              <Text style={styles.heroCopy}>
                The official {yearbookName} of {schoolName}. Connect with classmates, explore stories, and relive your university memories.
              </Text>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => go('/(tabs)/directory')}>
                  <FontAwesome name="search" size={15} color={colors.navy} />
                  <Text style={styles.primaryButtonText}>Browse Directory</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => go('/signup')}>
                  <Text style={styles.secondaryButtonText}>Join the Community</Text>
                  <FontAwesome name="arrow-right" size={13} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.statsSection}>
          {STATS.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                <FontAwesome name={item.icon as any} size={20} color={item.color} />
              </View>
              <View>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionKicker}>EXPLORE</Text>
          <Text style={styles.sectionTitle}>Explore the Yearbook</Text>
          <Text style={styles.sectionCopy}>Discover the vibrant community of {schoolName} through our curated sections.</Text>

          {EXPLORE.map((item) => (
            <TouchableOpacity key={item.title} activeOpacity={0.9} style={styles.exploreCard} onPress={() => go(item.route)}>
              <ImageBackground source={item.image} style={styles.exploreImage} imageStyle={styles.exploreImageStyle}>
                <View style={styles.exploreOverlay} />
                <View style={[styles.exploreBadge, { backgroundColor: item.color }]}>
                  <Text style={styles.exploreBadgeText}>{item.badge}</Text>
                </View>
                <View style={styles.exploreContent}>
                  <Text style={styles.exploreTitle}>{item.title}</Text>
                  <Text style={styles.exploreDesc}>{item.desc}</Text>
                  <View style={styles.exploreLink}>
                    <Text style={styles.exploreLinkText}>Explore</Text>
                    <FontAwesome name="arrow-right" size={11} color={colors.gold} />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.featureSection}>
          <Text style={styles.sectionKicker}>WHY {yearbookName.replace(/\s*Digital Yearbook/i, '').toUpperCase()}</Text>
          <Text style={styles.sectionTitle}>Built for Pioneers</Text>
          <View style={styles.featureGrid}>
            {features.map((item) => (
              <View key={item.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <FontAwesome name={item.icon as any} size={18} color={colors.indigo} />
                </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quoteSection}>
          <FontAwesome name="quote-left" size={36} color="#e0e7ff" />
          <Text style={styles.quoteText}>
            {yearbookName} brought back memories I thought were lost forever. Seeing classmates I had not spoken to in years is priceless.
          </Text>
          <View style={styles.quoteAuthor}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitials}>MS</Text>
            </View>
            <View>
              <Text style={styles.authorName}>Maria Santos</Text>
              <Text style={styles.authorMeta}>BS Computer Science, Batch 2019</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaBadge}>GET STARTED TODAY</Text>
            <Text style={styles.ctaTitle}>Ready to Relive{'\n'}Your Memories?</Text>
            <Text style={styles.ctaCopy}>Join alumni from {schoolName} who have already created their digital legacy.</Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => go('/signup')}>
              <Text style={styles.ctaButtonText}>Get Started - It&apos;s Free</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaGhost} onPress={() => go('/(tabs)/directory')}>
              <Text style={styles.ctaGhostText}>Browse Directory</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomAuth}>
          <Text style={styles.bottomText}>Already part of the community?</Text>
          <TouchableOpacity onPress={() => go('/login')}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  hero: { minHeight: 720 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(29, 43, 75, 0.78)' },
  heroContent: { flex: 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 42 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 44, height: 44, marginRight: 12 },
  brandName: { color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  brandMeta: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 2 },
  heroBody: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(253, 184, 19, 0.15)', borderWidth: 1, borderColor: 'rgba(253, 184, 19, 0.3)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginBottom: 26 },
  heroBadgeText: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: '#ffffff', fontSize: 46, lineHeight: 52, fontWeight: '900', textAlign: 'center' },
  goldText: { color: colors.gold },
  heroCopy: { color: 'rgba(255,255,255,0.76)', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 20, marginBottom: 32 },
  heroActions: { width: '100%', gap: 12 },
  primaryButton: { minHeight: 58, borderRadius: 14, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryButtonText: { color: colors.navy, fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 58, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  statsSection: { marginTop: -34, paddingHorizontal: 22, gap: 12 },
  statCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 18, flexDirection: 'row', alignItems: 'center', shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 5 },
  statIcon: { width: 54, height: 54, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  statValue: { color: colors.navy, fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  section: { paddingHorizontal: 22, paddingTop: 74, paddingBottom: 32 },
  sectionKicker: { color: colors.indigo, fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 1.2 },
  sectionTitle: { color: colors.navy, fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  sectionCopy: { color: '#94a3b8', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 28 },
  exploreCard: { height: 390, borderRadius: 20, overflow: 'hidden', marginBottom: 18, backgroundColor: colors.navy },
  exploreImage: { flex: 1, justifyContent: 'space-between' },
  exploreImageStyle: { borderRadius: 20 },
  exploreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.34)' },
  exploreBadge: { alignSelf: 'flex-start', margin: 18, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  exploreBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  exploreContent: { padding: 24, backgroundColor: 'rgba(0,0,0,0.58)' },
  exploreTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  exploreDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  exploreLink: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exploreLinkText: { color: colors.gold, fontSize: 12, fontWeight: '900' },
  featureSection: { backgroundColor: '#f4f7fe', paddingHorizontal: 22, paddingVertical: 56 },
  featureGrid: { gap: 12, marginTop: 28 },
  featureCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 18 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  featureTitle: { color: colors.navy, fontSize: 15, fontWeight: '900', marginBottom: 8 },
  featureDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  quoteSection: { paddingHorizontal: 28, paddingVertical: 66, alignItems: 'center' },
  quoteText: { color: colors.navy, fontSize: 20, fontWeight: '700', fontStyle: 'italic', lineHeight: 30, textAlign: 'center', marginTop: 12, marginBottom: 24 },
  quoteAuthor: { flexDirection: 'row', alignItems: 'center' },
  authorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  authorInitials: { color: colors.gold, fontWeight: '900' },
  authorName: { color: colors.navy, fontSize: 13, fontWeight: '900' },
  authorMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  ctaWrap: { paddingHorizontal: 22, paddingBottom: 38 },
  ctaCard: { backgroundColor: colors.navy, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 48, alignItems: 'center' },
  ctaBadge: { color: colors.gold, backgroundColor: 'rgba(253,184,19,0.15)', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 22 },
  ctaTitle: { color: '#ffffff', fontSize: 32, lineHeight: 38, fontWeight: '900', textAlign: 'center' },
  ctaCopy: { color: 'rgba(255,255,255,0.62)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 14, marginBottom: 28 },
  ctaButton: { width: '100%', minHeight: 56, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ctaButtonText: { color: colors.navy, fontSize: 15, fontWeight: '900' },
  ctaGhost: { width: '100%', minHeight: 56, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  ctaGhostText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  bottomAuth: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 34 },
  bottomText: { color: '#94a3b8', fontSize: 13, marginRight: 6 },
  loginLink: { color: colors.indigo, fontSize: 13, fontWeight: '900' },
});
