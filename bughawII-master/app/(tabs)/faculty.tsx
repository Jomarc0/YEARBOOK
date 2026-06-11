import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAppConfig, getErrorMessage, getFaculty, getFacultyMember, imageUrl, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');
const COLORS = {
  navy: '#1B2A5E',
  gold: '#F5A623',
  background: '#F0F2F7',
  card: '#FFFFFF',
  border: '#E0E3EC',
  muted: '#888888',
};

const memberId = (member: any) => member?.id || member?.faculty_id;
const memberName = (member: any) => member?.name || member?.full_name || 'Faculty Member';
const memberRole = (member: any) => member?.role || member?.position || member?.title || 'Faculty';
const memberPhoto = (member: any) => imageUrl(member?.image_url || member?.photo || member?.profile_picture || member?.profile_pic || member?.image);
const memberDepartment = (member: any, fallback = 'Faculty Directory') => member?.department || member?.office || fallback;
const memberInitials = (member: any) => memberName(member).trim().split(/\s+/).map((word: string) => word[0]?.toUpperCase() || '').slice(0, 2).join('') || 'NU';
const friendlyFacultyError = (error: any) => (
  error?.message === 'Network Error'
    ? 'Unable to connect to the faculty directory. Pull down to retry.'
    : getErrorMessage(error, 'Unable to load faculty records.')
);

function DropdownFilterPill({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.dropdownPillGold} onPress={onPress} activeOpacity={0.88}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <Text style={styles.dropdownValue} numberOfLines={1}>{value}</Text>
      </View>
      <FontAwesome name="chevron-down" size={11} color={COLORS.navy} />
    </TouchableOpacity>
  );
}

function BottomSheetFilter({ visible, title, options, selected, onSelect, onApply, onClose }: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.filterSheetOverlay}>
        <TouchableOpacity style={styles.filterSheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.filterSheet}>
          <View style={styles.filterSheetHandle} />
          <Text style={styles.filterSheetTitle}>{title}</Text>
          <ScrollView style={styles.filterSheetScroll} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = selected === option.value;
              return (
                <TouchableOpacity key={option.value} style={styles.filterSheetOption} onPress={() => onSelect(option.value)} activeOpacity={0.84}>
                  <Text style={styles.filterSheetOptionText}>{option.label}</Text>
                  <View style={[styles.filterSheetCircle, active && styles.filterSheetCircleActive]}>
                    {active ? <FontAwesome name="check" size={11} color={COLORS.navy} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.filterSheetApply} onPress={onApply}>
            <Text style={styles.filterSheetApplyText}>Apply filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function FacultyScreen() {
  const [groups, setGroups] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [activeDept, setActiveDept] = useState('All Departments');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
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
  const deptOptions = useMemo(() => [
    { label: `All Departments (${totalFaculty})`, value: 'All Departments' },
    ...groups.map((group) => ({ label: `${group.name} (${group.faculty.length})`, value: group.name })),
  ], [groups, totalFaculty]);
  const selectedDeptLabel = deptOptions.find((option) => option.value === activeDept)?.label || `All Departments (${totalFaculty})`;

  const selectDepartment = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDept(name);
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerKicker}>Faculty</Text>
        <Text style={styles.headerTitle}>Educators</Text>
        {!loading ? <Text style={styles.facultySubtitle}>{totalFaculty} faculty across {groups.length} departments</Text> : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFaculty(); }} />}
      >
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

        <View style={styles.facultyFilterRow}>
          <DropdownFilterPill label="Department" value={selectedDeptLabel} onPress={() => setDeptSheetOpen(true)} />
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
            <View style={styles.facultyList}>
              {dept.faculty.map((item: any, index: number) => {
                const photo = memberPhoto(item);
                return (
                  <TouchableOpacity
                    key={String(memberId(item) || `${dept.name}-${index}`)}
                    style={styles.facultyCard}
                    activeOpacity={0.88}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleModal(true, item);
                    }}
                  >
                    <View style={styles.photoArea}>
                      {photo ? (
                        <Image source={photo} style={styles.cardPhoto} contentFit="cover" transition={500} />
                      ) : (
                        <View style={styles.initialsArea}>
                          <Text style={styles.initialsText}>{memberInitials(item)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>{memberName(item)}</Text>
                      <Text style={styles.memberMeta} numberOfLines={1}>{memberDepartment(item, dept.name)}</Text>
                      <View style={styles.memberMetaRow}>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleText} numberOfLines={1}>{memberRole(item)}</Text>
                        </View>
                        {item?.email ? (
                          <View style={styles.emailBadge}>
                            <FontAwesome name="envelope" size={8} color="#9a6100" />
                            <Text style={styles.emailBadgeText}>Contact</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.profileButton}>
                      <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomSheetFilter
        visible={deptSheetOpen}
        title="Filter by department"
        options={deptOptions}
        selected={activeDept}
        onSelect={selectDepartment}
        onApply={() => setDeptSheetOpen(false)}
        onClose={() => setDeptSheetOpen(false)}
      />

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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  headerKicker: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.navy },
  scrollContent: { paddingTop: 0, paddingBottom: 24 },
  facultySubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  pageHeader: { paddingHorizontal: 24, marginBottom: 20 },
  pageTitle: { fontSize: 32, fontWeight: 'bold', color: '#1C1C1E' },
  pageSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  statCard: { flex: 1, backgroundColor: '#1d2b4b', borderRadius: 16, padding: 15 },
  statValue: { color: '#fdb813', fontSize: 24, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 10, fontWeight: '900', marginTop: 3, letterSpacing: 0.7, textTransform: 'uppercase' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 14, height: 46, marginHorizontal: 14, marginTop: 10, marginBottom: 10 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.navy },
  clearButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  facultyFilterRow: { paddingHorizontal: 14, paddingBottom: 12 },
  dropdownPillGold: { width: '100%', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.gold },
  dropdownLabel: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  dropdownValue: { color: COLORS.navy, fontSize: 11, fontWeight: '800', marginTop: 2 },
  deptTabs: { paddingHorizontal: 18, gap: 8, paddingBottom: 20 },
  deptTab: { height: 32, borderRadius: 12, borderWidth: 1, borderColor: '#1A2547', backgroundColor: 'transparent', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  deptTabActive: { backgroundColor: '#F5A623', borderColor: '#F5A623' },
  deptDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fdb813' },
  deptDotActive: { backgroundColor: '#1d2b4b' },
  deptTabText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  deptTabTextActive: { color: '#1d2b4b' },
  deptTabCount: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },
  deptTabCountActive: { color: 'rgba(29,43,75,0.65)' },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', padding: 24 },
  section: { marginBottom: 20 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 14 },
  deptName: { fontSize: 11, fontWeight: '900', color: COLORS.navy, marginRight: 8, textTransform: 'uppercase', letterSpacing: 1.5 },
  deptCount: { width: 20, height: 20, lineHeight: 20, textAlign: 'center', color: COLORS.navy, backgroundColor: COLORS.gold, overflow: 'hidden', borderRadius: 10, fontSize: 10, fontWeight: '900', marginRight: 12 },
  deptLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  horizontalScroll: { paddingHorizontal: 24 },
  facultyList: { paddingHorizontal: 14, gap: 10 },
  facultyCard: { minHeight: 86, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  photoArea: { width: 58, height: 58, borderRadius: 15, overflow: 'hidden', backgroundColor: COLORS.navy, marginRight: 12 },
  cardPhoto: { width: '100%', height: '100%' },
  initialsArea: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.navy },
  initialsText: { color: COLORS.gold, fontSize: 19, fontWeight: '900' },
  cardInfo: { flex: 1, minWidth: 0, justifyContent: 'center' },
  memberName: { fontSize: 15, lineHeight: 19, fontWeight: '900', color: COLORS.navy },
  memberMeta: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 2 },
  memberMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  roleBadge: { maxWidth: '72%', backgroundColor: '#eef2ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  roleText: { color: '#3f51b5', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff3c4', borderWidth: 1, borderColor: '#ffe08a', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  emailBadgeText: { color: '#9a6100', fontSize: 9, fontWeight: '900' },
  profileButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  avatarFallback: { backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center' },
  filterSheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  filterSheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  filterSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, maxHeight: '82%' },
  filterSheetHandle: { width: 36, height: 4, borderRadius: 999, backgroundColor: '#D1D5E0', alignSelf: 'center', marginBottom: 12 },
  filterSheetTitle: { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginBottom: 10 },
  filterSheetScroll: { maxHeight: 430 },
  filterSheetOption: { minHeight: 40, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterSheetOptionText: { color: COLORS.navy, fontSize: 13 },
  filterSheetCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5E0', alignItems: 'center', justifyContent: 'center' },
  filterSheetCircleActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  filterSheetApply: { backgroundColor: COLORS.navy, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  filterSheetApplyText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
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
