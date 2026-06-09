import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAppConfig, getErrorMessage, getFaculty, getFacultyMember, imageUrl, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');
const CARD_WIDTH = (Dimensions.get('window').width - 56) / 2;

const memberId = (member: any) => member?.id || member?.faculty_id;
const memberName = (member: any) => member?.name || member?.full_name || 'Faculty Member';
const memberRole = (member: any) => member?.role || member?.position || member?.title || 'Faculty';
const memberPhoto = (member: any) => imageUrl(member?.image_url || member?.photo || member?.profile_picture || member?.profile_pic || member?.image);
const friendlyFacultyError = (error: any) => (
  error?.message === 'Network Error'
    ? 'Unable to connect to the faculty directory. Pull down to retry.'
    : getErrorMessage(error, 'Unable to load faculty records.')
);

export default function FacultyScreen() {
  const [groups, setGroups] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeDept, setActiveDept] = useState('All Departments');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const schoolName = appConfig?.school_name || 'National University Lipa';

  const loadFaculty = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const payload = await getFaculty({ search: query.trim() || undefined });
      const data = unwrap(payload);
      const normalized = Array.isArray(data)
        ? data.map((group: any) => ({
          name: group.department || group.name || group.title || 'Faculty',
          faculty: group.faculty || group.members || group.items || (group.name ? [] : [group]),
        }))
        : Object.entries(data || {}).map(([name, faculty]) => ({ name, faculty: Array.isArray(faculty) ? faculty : [] }));
      const nextGroups = normalized.filter((group) => group.faculty.length);
      setGroups(nextGroups);
      if (activeDept !== 'All Departments' && !nextGroups.some((group) => group.name === activeDept)) {
        setActiveDept('All Departments');
      }
    } catch (requestError: any) {
      setError(friendlyFacultyError(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeDept, query, refreshing]);

  useEffect(() => {
    const timer = setTimeout(loadFaculty, 300);
    return () => clearTimeout(timer);
  }, [loadFaculty]);

  useEffect(() => {
    let active = true;

    getAppConfig()
      .then((payload) => {
        if (active) setAppConfig(unwrap(payload));
      })
      .catch(() => {
        if (active) setAppConfig(null);
      });

    return () => { active = false; };
  }, []);

  const totalFaculty = useMemo(() => groups.reduce((total, group) => total + group.faculty.length, 0), [groups]);
  const filteredGroups = useMemo(() => (
    activeDept === 'All Departments'
      ? groups
      : groups.filter((group) => group.name === activeDept)
  ), [activeDept, groups]);

  const selectDepartment = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDept(name);
    setQuery('');
  };

  const toggleModal = (visible: boolean, member: any = null) => {
    if (visible) {
      setSelectedFaculty(member);
      setIsModalVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 })
      ]).start();

      const id = memberId(member);
      if (id) {
        getFacultyMember(id).then((payload) => {
          setSelectedFaculty((current: any) => ({ ...current, ...unwrap(payload) }));
        }).catch(() => {});
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true })
      ]).start(() => {
        setIsModalVisible(false);
        setSelectedFaculty(null);
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerKicker}>Faculty</Text>
        <Text style={styles.headerTitle}>Educators</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFaculty(); }} />}
      >
        {!loading ? <Text style={styles.facultySubtitle}>{totalFaculty} faculty across {groups.length} departments</Text> : null}

        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color="#C7C7CC" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search faculty..."
            placeholderTextColor="#C7C7CC"
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setActiveDept('All Departments');
            }}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <FontAwesome name="times" size={13} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {!loading && !query && groups.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptTabs}>
            {['All Departments', ...groups.map((group) => group.name)].map((name) => {
              const active = activeDept === name;
              const count = name === 'All Departments'
                ? totalFaculty
                : groups.find((group) => group.name === name)?.faculty.length || 0;
              return (
                <TouchableOpacity key={name} style={[styles.deptTab, active && styles.deptTabActive]} onPress={() => selectDepartment(name)}>
                  <View style={[styles.deptDot, active && styles.deptDotActive]} />
                  <Text style={[styles.deptTabText, active && styles.deptTabTextActive]}>{name}</Text>
                  <Text style={[styles.deptTabCount, active && styles.deptTabCountActive]}>({count})</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {loading ? <ActivityIndicator color="#1d2b4b" /> : null}
        {!loading && error ? <Text style={styles.emptyText}>{error}</Text> : null}
        {!loading && !error && !filteredGroups.length ? <Text style={styles.emptyText}>No faculty records found.</Text> : null}

        {filteredGroups.map((dept, dIndex) => (
          <View key={`${dept.name}-${dIndex}`} style={styles.section}>
            <View style={styles.deptHeader}>
              <Text style={styles.deptName}>{dept.name}</Text>
              <Text style={styles.deptCount}>{dept.faculty.length}</Text>
              <View style={styles.deptLine} />
            </View>
            <FlatList
              scrollEnabled={false}
              numColumns={2}
              data={dept.faculty}
              keyExtractor={(item, index) => String(memberId(item) || index)}
              columnWrapperStyle={styles.facultyGridRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.facultyCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleModal(true, item);
                  }}
                >
                  <View style={styles.imageWrapper}>
                    {memberPhoto(item) ? (
                      <Image source={memberPhoto(item)} style={styles.facultyImage} contentFit="cover" transition={500} />
                    ) : (
                      <View style={[styles.facultyImage, styles.avatarFallback]}>
                        <Text style={styles.avatarFallbackText}>{memberName(item)[0]}</Text>
                      </View>
                    )}
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{memberRole(item)}</Text>
                    </View>
                  </View>
                  <Text style={styles.memberName}>{memberName(item)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ))}
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="none" onRequestClose={() => toggleModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => toggleModal(false)} />
          </Animated.View>
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.blueHeader} />
              <View style={styles.profileInfoSection}>
                {memberPhoto(selectedFaculty) ? (
                  <Image source={memberPhoto(selectedFaculty)} style={styles.largeAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.largeAvatar, styles.avatarFallback]}>
                    <Text style={styles.largeAvatarFallbackText}>{memberName(selectedFaculty)[0]}</Text>
                  </View>
                )}
                <Text style={styles.userName}>{memberName(selectedFaculty)}</Text>
                <Text style={styles.userDegree}>{memberRole(selectedFaculty)}</Text>
                <Text style={styles.userYear}>{selectedFaculty?.department || schoolName}</Text>
              </View>
              <View style={styles.contentSection}>
                <View style={styles.sectionHeader}>
                  <FontAwesome name="book" size={16} color="#1d2b4b" style={{ marginRight: 10 }} />
                  <Text style={styles.sectionTitle}>BIOGRAPHY</Text>
                </View>
                <Text style={styles.aboutText}>{selectedFaculty?.bio || selectedFaculty?.description || 'No biography has been added yet.'}</Text>
                <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                  <FontAwesome name="graduation-cap" size={16} color="#1d2b4b" style={{ marginRight: 10 }} />
                  <Text style={styles.sectionTitle}>CONTACT</Text>
                </View>
                <View style={styles.achievementCardBlue}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.achievementTitleBlue}>{selectedFaculty?.email || 'Email unavailable'}</Text>
                    <Text style={styles.achievementSubBlue}>{selectedFaculty?.department || selectedFaculty?.office || 'Faculty Directory'}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F8' },
  header: { height: 56, paddingHorizontal: 18, justifyContent: 'center' },
  headerKicker: { color: '#F5A623', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1A2547' },
  scrollContent: { paddingTop: 10, paddingBottom: 24 },
  facultySubtitle: { color: '#6B7280', fontSize: 13, marginHorizontal: 18, marginBottom: 14 },
  pageHeader: { paddingHorizontal: 24, marginBottom: 20 },
  pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E' },
  pageSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  statCard: { flex: 1, backgroundColor: '#1d2b4b', borderRadius: 16, padding: 15 },
  statValue: { color: '#fdb813', fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 10, fontWeight: '900', marginTop: 3, letterSpacing: 0.7, textTransform: 'uppercase' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, height: 56, marginHorizontal: 18, marginBottom: 14 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#000000' },
  clearButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  deptTabs: { paddingHorizontal: 18, gap: 8, paddingBottom: 20 },
  deptTab: { height: 32, borderRadius: 12, borderWidth: 1, borderColor: '#1A2547', backgroundColor: 'transparent', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  deptTabActive: { backgroundColor: '#F5A623', borderColor: '#F5A623' },
  deptDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fdb813' },
  deptDotActive: { backgroundColor: '#1d2b4b' },
  deptTabText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  deptTabTextActive: { color: '#1d2b4b' },
  deptTabCount: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },
  deptTabCountActive: { color: 'rgba(29,43,75,0.65)' },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: 24 },
  section: { marginBottom: 30 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 18 },
  deptName: { fontSize: 14, fontWeight: 'bold', color: '#1d2b4b', marginRight: 8, textTransform: 'uppercase', letterSpacing: 1.5 },
  deptCount: { color: '#1d2b4b', backgroundColor: '#fdb813', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '900', marginRight: 12 },
  deptLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  facultyGridRow: { paddingHorizontal: 18, gap: 12 },
  horizontalScroll: { paddingHorizontal: 24 },
  facultyCard: { width: CARD_WIDTH, backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  imageWrapper: { width: '100%', aspectRatio: 4 / 3, overflow: 'hidden', position: 'relative', backgroundColor: '#eef2ff' },
  facultyImage: { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 42 },
  roleBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(53, 64, 142, 0.9)', paddingVertical: 8, alignItems: 'center' },
  roleText: { color: 'white', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  memberName: { fontSize: 14, fontWeight: '900', color: '#1A2547', padding: 10, minHeight: 48 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  modalContainer: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: height * 0.9, overflow: 'hidden' },
  blueHeader: { height: 150, backgroundColor: '#1d2b4b', width: '100%' },
  profileInfoSection: { alignItems: 'center', marginTop: -70, paddingHorizontal: 24 },
  largeAvatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: '#FFFFFF', backgroundColor: '#eef2ff', marginBottom: 20 },
  largeAvatarFallbackText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 52 },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 6, textAlign: 'center' },
  userDegree: { fontSize: 16, color: '#1d2b4b', fontWeight: '500', marginBottom: 4 },
  userYear: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  contentSection: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 0.5 },
  aboutText: { fontSize: 14, color: '#4A4A4A', lineHeight: 22 },
  achievementCardBlue: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#D6E4FF' },
  achievementTitleBlue: { fontSize: 15, fontWeight: 'bold', color: '#1D39C4', marginBottom: 2 },
  achievementSubBlue: { fontSize: 12, color: '#2F54EB' },
});
