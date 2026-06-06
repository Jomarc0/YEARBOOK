import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getErrorMessage, getFaculty, getFacultyMember, imageUrl, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const memberId = (member: any) => member?.id || member?.faculty_id;
const memberName = (member: any) => member?.name || member?.full_name || 'Faculty Member';
const memberRole = (member: any) => member?.role || member?.position || member?.title || 'Faculty';
const memberPhoto = (member: any) => imageUrl(member?.image_url || member?.photo || member?.profile_picture || member?.profile_pic || member?.image);

export default function FacultyScreen() {
  const [groups, setGroups] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

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
      setGroups(normalized.filter((group) => group.faculty.length));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load faculty records.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, refreshing]);

  useEffect(() => {
    const timer = setTimeout(loadFaculty, 300);
    return () => clearTimeout(timer);
  }, [loadFaculty]);

  const totalFaculty = useMemo(() => groups.reduce((total, group) => total + group.faculty.length, 0), [groups]);
  const filteredGroups = useMemo(() => groups, [groups]);

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
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Faculty</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFaculty(); }} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Our Educators</Text>
          <Text style={styles.pageSubtitle}>Faculty directory from the Sinag Bughaw system</Text>
          {!loading ? (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalFaculty}</Text>
                <Text style={styles.statLabel}>Faculty Members</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{groups.length}</Text>
                <Text style={styles.statLabel}>Departments</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color="#C7C7CC" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Search faculty..." placeholderTextColor="#C7C7CC" value={query} onChangeText={setQuery} />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <FontAwesome name="times" size={13} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

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
              horizontal
              data={dept.faculty}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => String(memberId(item) || index)}
              contentContainerStyle={styles.horizontalScroll}
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
                <Text style={styles.userYear}>{selectedFaculty?.department || 'National University Lipa'}</Text>
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
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  header: { backgroundColor: '#1d2b4b', paddingTop: 45, paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fdb813' },
  scrollContent: { paddingVertical: 24 },
  pageHeader: { paddingHorizontal: 24, marginBottom: 20 },
  pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E' },
  pageSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  statCard: { flex: 1, backgroundColor: '#1d2b4b', borderRadius: 16, padding: 15 },
  statValue: { color: '#fdb813', fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 10, fontWeight: '900', marginTop: 3, letterSpacing: 0.7, textTransform: 'uppercase' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 24, marginBottom: 24 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#000000' },
  clearButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', padding: 24 },
  section: { marginBottom: 40 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 24 },
  deptName: { fontSize: 14, fontWeight: 'bold', color: '#1d2b4b', marginRight: 8, textTransform: 'uppercase', letterSpacing: 1.5 },
  deptCount: { color: '#1d2b4b', backgroundColor: '#fdb813', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 10, fontWeight: '900', marginRight: 12 },
  deptLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  horizontalScroll: { paddingHorizontal: 24 },
  facultyCard: { width: Dimensions.get('window').width * 0.6, backgroundColor: 'white', borderRadius: 14, padding: 14, marginRight: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  imageWrapper: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', backgroundColor: '#eef2ff' },
  facultyImage: { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: '#1d2b4b', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 42 },
  roleBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(53, 64, 142, 0.9)', paddingVertical: 8, alignItems: 'center' },
  roleText: { color: 'white', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  memberName: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center' },
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
