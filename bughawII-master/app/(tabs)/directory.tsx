import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  fetchCurrentUser,
  generateYearbook,
  getAppConfig,
  getBatchmates,
  getBatches,
  getCurrentUser,
  getDiscoveryCrossProgram,
  getDiscoverySchool,
  getDiscoverySectionmates,
  getErrorMessage,
  imageUrl,
  searchFace,
  unwrap,
} from '../../lib/api';

const COLORS = {
  navy: '#1B2A5E',
  gold: '#F5A623',
  background: '#F0F2F7',
  card: '#FFFFFF',
  border: '#E0E3EC',
  muted: '#888888',
};

const DEPARTMENTS = ['All Departments', 'SAHS', 'SACE', 'SHS', 'SABM'];
const YEAR_OPTIONS = ['All Years', '2026', '2025', '2024', '2023', '2022'];
const VIEW_MODES = [
  { key: 'batch', label: 'My Batch', icon: 'graduation-cap', desc: 'Same course & year' },
  { key: 'section', label: 'My Section', icon: 'clone', desc: 'My classmates' },
  { key: 'school', label: 'Whole School', icon: 'institution', desc: 'All students' },
  { key: 'cross_program', label: 'Cross-Program', icon: 'random', desc: 'Other programs' },
] as const;
const COURSE_BY_DEPT: Record<string, string[]> = {
  SAHS: ['BS Medical Technology', 'BS Psychology', 'BS Nursing'],
  SACE: ['BS Civil Engineering', 'BS Architecture', 'BS Computer Engineering'],
  SHS: ['STEM', 'ABM', 'HUMSS'],
  SABM: ['BS Accountancy', 'BS Business Admin', 'BS Multimedia Arts'],
};

const COURSE_ALIASES: Record<string, string[]> = {
  'bachelor of science in architecture': ['bs architecture', 'architecture', 'bsarch'],
  'bachelor of multimedia arts': ['bachelor of multimedia arts (bmma)', 'bmma', 'bma', 'multimedia arts'],
  'bachelor of science in civil engineering': ['bs civil engineering', 'civil engineering', 'bsce'],
  'bachelor of science in computer science': ['bs computer science', 'bscs', 'computer science'],
  'bachelor of science in information technology': ['bs information technology', 'bsit', 'information technology'],
  'bachelor of science in nursing': ['bs nursing', 'bsn', 'nursing'],
  'bachelor of science in medical technology': ['bs medical technology', 'bsmt', 'medical technology'],
  'bachelor of science in psychology': ['bs psychology', 'bsp', 'psychology'],
  'bachelor of science in accountancy': ['bs accountancy', 'bsa', 'accountancy'],
  'bachelor of science in business administration - financial management': ['bsba financial management', 'bsba-fm', 'financial management'],
  'bachelor of science in business administration - marketing management': ['bsba marketing management', 'bsba-mm', 'marketing management'],
  'bachelor of science in tourism management': ['bs tourism management', 'bstm', 'tourism management'],
  'master in management': ['mm'],
  abm: ['accountancy business and management'],
  stem: ['science technology engineering mathematics'],
  humss: ['humanities and social sciences'],
};

const normalizeText = (value: any) => String(value ?? '').trim().toLowerCase();
const studentName = (item: any) => item?.name || item?.full_name || item?.student_name || 'Student';
const studentId = (item: any) => item?.id ?? item?.user_id ?? item?.account_user_id ?? item?.student_id;
const studentCourse = (item: any) => item?.course || item?.program || item?.student?.course || '';
const studentDepartment = (item: any) => item?.batch?.department || item?.department || 'Department';
const studentSection = (item: any) => item?.section?.name || item?.section_name || item?.section || 'No Section';
const studentYear = (item: any) => String(item?.graduation_year || item?.batch_year || item?.batch?.graduation_year || item?.year || '');
const studentNo = (item: any) => item?.student_no || item?.student_number || item?.student_id || item?.student?.student_no || '';
const studentPhoto = (item: any) => imageUrl(
  item?.profile_picture ||
  item?.profile_pic ||
  item?.photo_url ||
  item?.photo ||
  item?.avatar ||
  item?.avatar_url ||
  item?.image_url ||
  item?.user?.profile_picture ||
  item?.user?.profile_pic ||
  item?.user?.photo ||
  item?.student?.profile_picture ||
  item?.student?.photo_url ||
  item?.student?.photo ||
  item?.student_record?.photo ||
  item?.studentRecord?.photo,
);
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NU';
const courseShortLabel = (course: string) => {
  const normalized = normalizeText(course);
  const direct = Object.entries(COURSE_ALIASES).find(([full, aliases]) => full === normalized || aliases.some((alias) => alias === normalized));
  if (!direct) return course;
  const [full] = direct;
  if (full.includes('accountancy')) return 'BSA';
  if (full.includes('financial management')) return 'BSBA-FM';
  if (full.includes('marketing management')) return 'BSBA-MM';
  if (full.includes('tourism')) return 'BSTM';
  if (full.includes('computer science')) return 'BSCS';
  if (full.includes('information technology')) return 'BSIT';
  if (full.includes('medical technology')) return 'BSMT';
  if (full.includes('psychology')) return 'BSP';
  if (full.includes('nursing')) return 'BSN';
  if (full.includes('architecture')) return 'BSARCH';
  if (full.includes('civil engineering')) return 'BSCE';
  if (full.includes('multimedia')) return 'BMMA';
  return course;
};
const userStudent = (user: any) => user?.student || user?.profile || user || {};
const userYear = (user: any) => String(userStudent(user)?.graduation_year || user?.graduation_year || user?.batch_year || '');
const userCourse = (user: any) => userStudent(user)?.course || user?.course || '';
const userSection = (user: any) => userStudent(user)?.section?.name || userStudent(user)?.section_name || user?.section?.name || user?.section_name || '';
const sameText = (a: any, b: any) => Boolean(a && b && normalizeText(a) === normalizeText(b));
const hasPaidAccess = (user: any) => Boolean(
  user?.is_premium ||
  user?.is_subscribed ||
  user?.premium ||
  user?.tier === 'premium' ||
  user?.tier === 'standard' ||
  user?.subscription?.active ||
  user?.subscription_status === 'active'
);

const getPayloadList = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const flattenBatches = (payload: any) => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (raw && typeof raw === 'object') return Object.values(raw).flat();
  return [];
};

function courseMatches(studentCourseValue: string, selectedCourse: string) {
  if (!selectedCourse) return true;
  const selected = normalizeText(selectedCourse);
  const course = normalizeText(studentCourseValue);
  const selectedTerms = [selected, ...(COURSE_ALIASES[selected] ?? [])];
  const courseTerms = [course, ...(COURSE_ALIASES[course] ?? [])];
  return selectedTerms.some((term) => courseTerms.some((courseTerm) => courseTerm === term || courseTerm.includes(term) || term.includes(courseTerm)));
}

function FilterDropdown({ label, value, variant, onPress }: { label: string; value: string; variant: 'gold' | 'navy' | 'white'; onPress: () => void }) {
  const isNavy = variant === 'navy';
  const isWhite = variant === 'white';
  return (
    <TouchableOpacity style={[styles.dropdown, isNavy && styles.dropdownNavy, isWhite && styles.dropdownWhite]} onPress={onPress} activeOpacity={0.88}>
      <Text style={[styles.dropdownLabel, isNavy && styles.dropdownLabelNavy]}>{label}</Text>
      <View style={styles.dropdownValueRow}>
        <Text style={[styles.dropdownValue, isNavy && styles.dropdownValueNavy, isWhite && styles.dropdownValueWhite]} numberOfLines={1}>{value}</Text>
        <FontAwesome name="chevron-down" size={10} color={isNavy ? COLORS.gold : isWhite ? COLORS.muted : COLORS.navy} />
      </View>
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
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = selected === option.value;
              return (
                <TouchableOpacity key={option.value} style={styles.sheetOption} onPress={() => onSelect(option.value)} activeOpacity={0.84}>
                  <Text style={styles.sheetOptionText}>{option.label}</Text>
                  <View style={[styles.sheetCircle, active && styles.sheetCircleActive]}>
                    {active ? <FontAwesome name="check" size={11} color={COLORS.navy} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.sheetApply} onPress={onApply}>
            <Text style={styles.sheetApplyText}>Apply filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ year?: string; department?: string; course?: string }>();
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [course, setCourse] = useState('');
  const [viewMode, setViewMode] = useState<(typeof VIEW_MODES)[number]['key']>('batch');
  const [filterSheet, setFilterSheet] = useState<null | 'dept' | 'course' | 'year'>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [faceMatchedIds, setFaceMatchedIds] = useState<Set<any>>(new Set());
  const [faceSearching, setFaceSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingYearbook, setOpeningYearbook] = useState(false);
  const [error, setError] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);
  const courseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nextYear = Array.isArray(routeParams.year) ? routeParams.year[0] : routeParams.year;
    const nextDepartment = Array.isArray(routeParams.department) ? routeParams.department[0] : routeParams.department;
    const nextCourse = Array.isArray(routeParams.course) ? routeParams.course[0] : routeParams.course;

    if (nextYear) setYear(String(nextYear));
    if (nextDepartment) setDepartment(String(nextDepartment));
    if (nextCourse) setCourse(String(nextCourse));
  }, [routeParams.course, routeParams.department, routeParams.year]);

  const premium = hasPaidAccess(user);
  const premiumEnabled = appConfig?.features?.enable_premium_subscription !== false;
  const yearbookEnabled = appConfig?.features?.enable_flipbook_viewer !== false;
  const activeMode = VIEW_MODES.find((mode) => mode.key === viewMode) || VIEW_MODES[0];

  const loadCurrentUser = useCallback(async () => {
    try {
      const cached = await getCurrentUser();
      if (cached) {
        setUser(cached);
        setYear((current) => current ? current : (userYear(cached) || ''));
      }

      const fresh = await fetchCurrentUser();
      if (fresh) {
        setUser(fresh);
        setYear((current) => current ? current : (userYear(fresh) || ''));
      }
    } catch {
      // Batchmates can still attempt to render with cached filters.
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const scopedYear = viewMode === 'batch' ? (year && year !== 'All Years' ? year : userYear(user)) : year;
      const params = {
        per_page: 500,
        search: query.trim() || undefined,
        q: query.trim() || undefined,
        year: scopedYear && scopedYear !== 'All Years' ? scopedYear : undefined,
        department: department !== 'All Departments' ? department : undefined,
        course: viewMode === 'batch' ? undefined : (course || undefined),
      };
      const payload = viewMode === 'section'
        ? await getDiscoverySectionmates({ search: params.search, q: params.q })
        : viewMode === 'school'
          ? await getDiscoverySchool(params)
          : viewMode === 'cross_program'
            ? await getDiscoveryCrossProgram(params)
            : await getBatchmates(params);
      const raw = unwrap(payload);
      const list = getPayloadList(payload);
      setStudents(list.length ? list : (Array.isArray(raw?.data?.data) ? raw.data.data : []));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load students.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [course, department, query, refreshing, user, viewMode, year]);

  useEffect(() => {
    setFaceMatchedIds(new Set());
    setQuery('');
    setDepartment('All Departments');
    setCourse('');
    setYear(viewMode === 'batch' ? (userYear(user) || '') : viewMode === 'section' ? '' : 'All Years');
  }, [user, viewMode]);

  useEffect(() => {
    Animated.timing(courseAnim, {
      toValue: department === 'All Departments' ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [courseAnim, department]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    let active = true;
    getAppConfig()
      .then((payload) => { if (active) setAppConfig(unwrap(payload)); })
      .catch(() => { if (active) setAppConfig(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(), 300);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const searchQuery = normalizeText(query);
    const ownCourse = userCourse(user);
    const ownSection = userSection(user);
    const ownYear = userYear(user);
    return students.filter((student) => {
      const faceMatch = faceMatchedIds.size === 0 || faceMatchedIds.has(studentId(student)) || faceMatchedIds.has(student?.user_id) || faceMatchedIds.has(student?.student_id);
      const selectedDepartmentMatch = ['batch', 'section'].includes(viewMode) || department === 'All Departments' || normalizeText(studentDepartment(student)) === normalizeText(department);
      const selectedCourseMatch = ['batch', 'section'].includes(viewMode) || courseMatches(studentCourse(student), course);
      const targetYear = viewMode === 'batch' ? (year && year !== 'All Years' ? year : ownYear) : year;
      const selectedYearMatch = viewMode === 'section' || !targetYear || targetYear === 'All Years' || studentYear(student) === String(targetYear);
      const sameOwnCourse = Boolean(ownCourse) && courseMatches(studentCourse(student), ownCourse);
      const batchScopeMatch = viewMode !== 'batch' || sameOwnCourse || sameText(studentSection(student), ownSection);
      const crossProgramMatch = viewMode !== 'cross_program' || !sameOwnCourse;
      const textMatch = !searchQuery || [
        studentName(student),
        studentNo(student),
        studentCourse(student),
        studentDepartment(student),
        studentSection(student),
        studentYear(student),
      ].some((value) => normalizeText(value).includes(searchQuery));
      return faceMatch && selectedDepartmentMatch && selectedCourseMatch && selectedYearMatch && batchScopeMatch && crossProgramMatch && textMatch;
    });
  }, [course, department, faceMatchedIds, query, students, user, viewMode, year]);

  const courseOptions = useMemo(() => {
    const mapped = COURSE_BY_DEPT[department] || [];
    const source = department === 'All Departments'
      ? filteredStudents
      : students.filter((student) => normalizeText(studentDepartment(student)) === normalizeText(department));
    const courses = Array.from(new Set([...mapped, ...source.map(studentCourse).filter(Boolean)]));
    return courses.sort((a, b) => a.localeCompare(b));
  }, [department, filteredStudents, students]);

  const activeYear = year || userYear(user) || '';
  const selectedDeptValue = department === 'All Departments' ? 'All' : department;
  const selectedCourseValue = course ? course.replace(/^Bachelor of Science in\s+/i, 'BS ') : 'All';
  const selectedYearValue = year || 'Set batch';
  const resultLabel = viewMode === 'section' ? 'classmate' : viewMode === 'batch' ? 'batchmate' : 'student';
  const departmentOptions = DEPARTMENTS.map((item) => ({ label: item, value: item }));
  const courseSheetOptions = [{ label: 'All Courses', value: '' }, ...courseOptions.map((item) => ({ label: item, value: item }))];
  const yearChoices = year && !YEAR_OPTIONS.includes(year) ? [year, ...YEAR_OPTIONS] : YEAR_OPTIONS;
  const yearOptions = yearChoices.map((item) => ({ label: item, value: item }));

  const handleFaceSearch = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to search by face.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const form = new FormData();
    form.append('face_image', {
      uri: asset.uri,
      name: asset.fileName || 'batchmates-face-search.jpg',
      type: asset.mimeType || 'image/jpeg',
    } as any);

    try {
      setFaceSearching(true);
      const payload = await searchFace(form);
      const matches = (payload?.matches || payload?.data?.matches || []).filter((match: any) => studentId(match) || match?.user_id || match?.student_id);
      setFaceMatchedIds(new Set(matches.flatMap((match: any) => [studentId(match), match?.user_id, match?.student_id].filter(Boolean))));
    } catch (requestError: any) {
      Alert.alert('Face search failed', getErrorMessage(requestError, 'Unable to run face search.'));
    } finally {
      setFaceSearching(false);
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setFaceMatchedIds(new Set());
    setYear(userYear(user) || '');
    setDepartment('All Departments');
    setCourse('');
  };

  const handleOpenYearbook = async () => {
    if (!yearbookEnabled) {
      Alert.alert('Yearbook unavailable', 'The digital yearbook viewer is currently disabled.');
      return;
    }

    try {
      setOpeningYearbook(true);
      const payload = await getBatches({ year: activeYear, course: course || undefined });
      const batches = flattenBatches(payload) as any[];
      const target = batches.find((batch) => String(batch?.year || batch?.batch_year || batch?.graduation_year || batch?.name) === String(activeYear))
        || batches[0];
      if (!target?.id) {
        Alert.alert('Yearbook not found', 'Select a batch year with an available yearbook.');
        return;
      }
      await generateYearbook(target.id).catch(() => null);
      router.push({
        pathname: '/yearbook',
        params: { batchId: String(target.id), view: '1' },
      } as any);
    } catch (requestError: any) {
      Alert.alert('Yearbook unavailable', getErrorMessage(requestError, 'Unable to open this yearbook.'));
    } finally {
      setOpeningYearbook(false);
    }
  };

  const renderStudentCard = (student: any, index: number) => {
    const name = studentName(student);
    const photo = studentPhoto(student);
    const program = studentCourse(student);
    const hasProgram = Boolean(program && !['course', 'no program listed'].includes(normalizeText(program)));
    const matched = faceMatchedIds.has(studentId(student)) || faceMatchedIds.has(student?.user_id) || faceMatchedIds.has(student?.student_id);
    const profileId = student?.student_record_id || student?.student?.id || student?.record?.id || student?.id || studentId(student);
    const userId = student?.user_id || student?.user?.id || student?.account_user_id;
    const id = studentId(student);
    const cardKey = id != null ? String(id) : `student-${index}`;

    return (
      <TouchableOpacity
        key={cardKey}
        style={[styles.studentCard, matched && styles.studentCardMatched]}
        activeOpacity={0.88}
        onPress={() => router.push({
          pathname: '/student/[id]',
          params: {
            id: String(profileId),
            source: 'discovery',
            ...(userId ? { userId: String(userId) } : {}),
            name,
            ...(hasProgram ? { course: program } : {}),
            year: String(studentYear(student) || ''),
            section: studentSection(student),
            studentNo: String(studentNo(student) || ''),
            ...(photo ? { photo } : {}),
          },
        } as any)}
      >
        <View style={styles.photoArea}>
          {photo ? <Image source={photo} style={styles.cardPhoto} contentFit="cover" /> : (
            <View style={styles.initialsArea}>
              <Text style={styles.initialsText}>{initials(name)}</Text>
            </View>
          )}
          {matched ? (
            <View style={styles.matchBadge}>
              <FontAwesome name="camera" size={8} color={COLORS.navy} />
            </View>
          ) : null}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{name}</Text>
          {hasProgram ? <Text style={styles.studentMeta} numberOfLines={1}>{program}</Text> : null}
          <View style={styles.studentMetaRow}>
            {hasProgram ? (
              <View style={styles.courseBadge}>
                <Text style={styles.courseBadgeText} numberOfLines={1}>{courseShortLabel(program).toUpperCase()}</Text>
              </View>
            ) : null}
            <View style={styles.yearBadge}>
              <FontAwesome name="graduation-cap" size={9} color="#9a6100" />
              <Text style={styles.batchText}>{studentYear(student) || activeYear}</Text>
            </View>
          </View>
        </View>
        <View style={styles.profileButton}>
          <FontAwesome name="chevron-right" size={12} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        stickyHeaderIndices={[2]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStudents(); }} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>National University Lipa</Text>
          <Text style={styles.heroTitle}>Student <Text style={styles.gold}>Discovery</Text></Text>
          <Text style={styles.heroSubtitle}>Find classmates, explore other programs, and connect with the NU Lipa community.</Text>
          <View style={styles.pillRow}>
            <View style={styles.statusPill}>
              <FontAwesome name={premium ? 'star' : 'lock'} size={12} color="#fdb813" />
              <Text style={styles.statusPillText}>{premium ? 'Paid - Full Access' : premiumEnabled ? 'Upgrade to Unlock' : 'Discovery Access'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.modeTabsWrap}>
          <View style={styles.modeTabs}>
            {VIEW_MODES.map((mode) => {
              const active = viewMode === mode.key;
              return (
                <TouchableOpacity key={mode.key} style={[styles.modeTab, active && styles.modeTabActive]} onPress={() => setViewMode(mode.key)} activeOpacity={0.88}>
                  <FontAwesome name={mode.icon as any} size={13} color={active ? COLORS.gold : '#6B7896'} />
                  <View style={styles.modeTabCopy}>
                    <Text style={[styles.modeTabLabel, active && styles.modeTabLabelActive]} numberOfLines={1}>{mode.label}</Text>
                    <Text style={[styles.modeTabDesc, active && styles.modeTabDescActive]} numberOfLines={1}>{mode.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterBar}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.groupIcon}>
              <FontAwesome name={activeMode.icon as any} size={14} color="#fdb813" />
            </View>
            <View>
              <Text style={styles.sectionHeading}>{activeMode.label}</Text>
              <Text style={styles.sectionSubheading}>{activeMode.desc}</Text>
            </View>
          </View>
          <View style={styles.searchRow}>
            <FontAwesome name="search" size={14} color="#8fa0bf" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name or student ID..."
              placeholderTextColor="#8fa0bf"
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setFaceMatchedIds(new Set());
              }}
            />
            <TouchableOpacity onPress={handleFaceSearch} disabled={faceSearching}>
              {faceSearching ? <ActivityIndicator color={COLORS.gold} size="small" /> : <FontAwesome name="camera" size={14} color={COLORS.gold} />}
            </TouchableOpacity>
          </View>

          <View style={styles.dropdownRow}>
            {viewMode !== 'batch' && viewMode !== 'section' ? <FilterDropdown label="Dept" value={selectedDeptValue} variant="gold" onPress={() => setFilterSheet('dept')} /> : null}
            {viewMode !== 'batch' && viewMode !== 'section' ? <FilterDropdown label="Course" value={selectedCourseValue} variant="navy" onPress={() => setFilterSheet('course')} /> : null}
            {viewMode !== 'section' ? <FilterDropdown label="Year" value={selectedYearValue} variant="white" onPress={() => setFilterSheet('year')} /> : null}
            {viewMode === 'batch' && yearbookEnabled && activeYear ? (
              <TouchableOpacity style={styles.generateButton} onPress={handleOpenYearbook} disabled={openingYearbook} activeOpacity={0.88}>
                {openingYearbook ? <ActivityIndicator color={COLORS.gold} size="small" /> : <FontAwesome name="book" size={12} color={COLORS.gold} />}
                <Text style={styles.generateButtonText}>Yearbook {activeYear}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Animated.View style={[
            styles.courseChipWrap,
            {
              opacity: courseAnim,
              maxHeight: courseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 48] }),
            },
          ]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>
              <TouchableOpacity style={[styles.courseTab, !course && styles.courseTabActive]} onPress={() => setCourse('')}>
                <Text style={[styles.courseTabText, !course && styles.courseTabTextActive]}>All Courses</Text>
              </TouchableOpacity>
              {courseOptions.map((item) => {
                const active = course === item;
                return (
                  <TouchableOpacity key={item} style={[styles.courseTab, active && styles.courseTabActive]} onPress={() => setCourse(item)}>
                    <Text style={[styles.courseTabText, active && styles.courseTabTextActive]} numberOfLines={1}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>

        <View style={styles.resultPill}>
          <FontAwesome name="graduation-cap" size={13} color="#fdb813" />
          <Text style={styles.resultText}>{filteredStudents.length} {resultLabel}{filteredStudents.length === 1 ? '' : 's'} found</Text>
        </View>

        {!premium && premiumEnabled ? (
          <View style={styles.upgradeBanner}>
            <FontAwesome name="lock" size={18} color="#fdb813" />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeTitle}>Unlock Full Discovery</Text>
              <Text style={styles.upgradeText}>Standard or Premium unlocks full student profiles, gallery access, uploads, and contact details.</Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/payment' as any)}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color="#1d2b4b" style={styles.loading} />
        ) : filteredStudents.length === 0 ? (
          <View style={styles.emptyPanel}>
            <FontAwesome name="search" size={40} color={COLORS.gold} />
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptyText}>
              {error || (viewMode === 'batch' && !activeYear ? 'Set your batch year in your profile to find batchmates.' : 'Try adjusting your filters')}
            </Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.studentList}>
            {filteredStudents.map((student, index) => renderStudentCard(student, index))}
          </View>
        )}
      </ScrollView>

      <BottomSheetFilter
        visible={filterSheet === 'dept'}
        title="Filter by department"
        options={departmentOptions}
        selected={department}
        onSelect={(value) => { setDepartment(value); setCourse(''); setFilterSheet(null); }}
        onApply={() => setFilterSheet(null)}
        onClose={() => setFilterSheet(null)}
      />
      <BottomSheetFilter
        visible={filterSheet === 'course'}
        title="Filter by course"
        options={courseSheetOptions}
        selected={course}
        onSelect={(value) => { setCourse(value); setFilterSheet(null); }}
        onApply={() => setFilterSheet(null)}
        onClose={() => setFilterSheet(null)}
      />
      <BottomSheetFilter
        visible={filterSheet === 'year'}
        title="Filter by year"
        options={yearOptions}
        selected={year}
        onSelect={(value) => { setYear(value); setFilterSheet(null); }}
        onApply={() => setFilterSheet(null)}
        onClose={() => setFilterSheet(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 44 },
  hero: { backgroundColor: COLORS.navy, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, alignItems: 'center' },
  eyebrow: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  gold: { color: COLORS.gold },
  heroSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 8, maxWidth: 320 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  statusPillText: { color: COLORS.gold, fontSize: 11, fontWeight: '900' },
  modeTabsWrap: { marginTop: -20, marginBottom: 10, paddingHorizontal: 12, zIndex: 20 },
  modeTabs: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 7, gap: 7, flexDirection: 'row', flexWrap: 'wrap', shadowColor: '#101828', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  modeTab: { width: '48.95%', minHeight: 50, borderRadius: 12, alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 9 },
  modeTabActive: { backgroundColor: COLORS.navy },
  modeTabCopy: { flex: 1, minWidth: 0 },
  modeTabLabel: { color: '#5F6E88', fontSize: 10, fontWeight: '900' },
  modeTabLabelActive: { color: '#FFFFFF' },
  modeTabDesc: { color: '#9AA5B8', fontSize: 8, fontWeight: '700', marginTop: 2 },
  modeTabDescActive: { color: 'rgba(255,255,255,0.72)' },
  filterBar: { backgroundColor: '#ffffff', borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 9, zIndex: 10, elevation: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  sectionHeading: { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  sectionSubheading: { color: '#8fa0bf', fontSize: 11, fontWeight: '800', marginTop: 1 },
  searchRow: { minHeight: 40, borderRadius: 18, backgroundColor: COLORS.background, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 9 },
  searchInput: { flex: 1, color: COLORS.navy, fontSize: 13, paddingHorizontal: 8 },
  dropdownRow: { flexDirection: 'row', gap: 7 },
  dropdown: { flex: 1, borderRadius: 16, backgroundColor: COLORS.gold, paddingHorizontal: 9, paddingVertical: 7, minHeight: 42 },
  dropdownNavy: { backgroundColor: COLORS.navy },
  dropdownWhite: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: COLORS.border },
  dropdownLabel: { color: COLORS.navy, fontSize: 10, fontWeight: '900' },
  dropdownLabelNavy: { color: '#FFFFFF' },
  dropdownValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  dropdownValue: { flex: 1, minWidth: 0, color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  dropdownValueNavy: { color: COLORS.gold },
  dropdownValueWhite: { color: COLORS.muted },
  generateButton: { flex: 1, minHeight: 42, borderRadius: 16, backgroundColor: COLORS.navy, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  generateButtonText: { color: COLORS.gold, fontSize: 10, fontWeight: '900' },
  courseChipWrap: { overflow: 'hidden', marginTop: 8 },
  courseRow: { gap: 8 },
  courseTab: { maxWidth: 210, height: 32, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  courseTabActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  courseTabText: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  courseTabTextActive: { color: '#FFFFFF' },
  resultPill: { alignSelf: 'center', marginTop: 8, marginBottom: 10, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 0.5, borderColor: COLORS.border },
  resultText: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  upgradeBanner: { marginHorizontal: 18, marginBottom: 18, borderRadius: 16, backgroundColor: '#263187', padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeTitle: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  upgradeText: { color: '#d8dff4', fontSize: 11, marginTop: 2 },
  upgradeButton: { height: 38, borderRadius: 11, backgroundColor: '#fdb813', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  upgradeButtonText: { color: '#102044', fontSize: 11, fontWeight: '900' },
  groupWrap: { paddingHorizontal: 14, gap: 10 },
  departmentGroup: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 10 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.background },
  groupIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  departmentTitle: { color: COLORS.navy, fontSize: 14, fontWeight: '900' },
  departmentMeta: { color: COLORS.muted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  courseGroup: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.background },
  courseTitle: { color: COLORS.gold, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  sectionGroup: { marginTop: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  sectionCount: { borderRadius: 20, backgroundColor: '#EEF0F7', paddingHorizontal: 10, paddingVertical: 3 },
  sectionCountText: { color: COLORS.navy, fontSize: 10, fontWeight: '900' },
  studentList: { paddingHorizontal: 18, paddingBottom: 20 },
  studentCard: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#dbe3ef', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, flexDirection: 'row', alignItems: 'center', padding: 10 },
  studentCardMatched: { borderColor: COLORS.gold, borderWidth: 2, shadowColor: COLORS.gold, shadowOpacity: 0.16 },
  photoArea: { width: 58, height: 58, borderRadius: 16, backgroundColor: COLORS.navy, position: 'relative', overflow: 'hidden' },
  cardPhoto: { width: '100%', height: '100%' },
  initialsArea: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.navy },
  initialsText: { color: COLORS.gold, fontSize: 18, fontWeight: '900' },
  matchBadge: { position: 'absolute', right: 4, top: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 12 },
  studentName: { color: COLORS.navy, fontSize: 14, lineHeight: 18, fontWeight: '900', marginBottom: 3, textTransform: 'capitalize' },
  studentMeta: { color: '#64748b', fontSize: 11, marginBottom: 7 },
  studentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  courseBadge: { maxWidth: 112, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  courseBadgeText: { color: '#3f51b5', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  missingProgramText: { color: '#6B7280', fontSize: 10, fontWeight: '900' },
  yearBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff3c4', borderWidth: 1, borderColor: '#ffe08a', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  batchText: { color: '#9a6100', fontSize: 10, fontWeight: '900' },
  profileButton: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  viewAllButton: { alignItems: 'center', marginTop: 8 },
  viewAllText: { color: COLORS.gold, fontSize: 11, fontWeight: '900' },
  loading: { marginTop: 42 },
  emptyPanel: { marginHorizontal: 20, minHeight: 250, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { color: COLORS.navy, fontSize: 14, fontWeight: '900', marginTop: 16 },
  emptyText: { color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginTop: 8, fontSize: 12 },
  clearFiltersText: { color: COLORS.gold, fontSize: 12, fontWeight: '900', marginTop: 12 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, maxHeight: '82%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 999, backgroundColor: '#D1D5E0', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginBottom: 10 },
  sheetScroll: { maxHeight: 430 },
  sheetOption: { minHeight: 40, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetOptionText: { color: COLORS.navy, fontSize: 13 },
  sheetCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5E0', alignItems: 'center', justifyContent: 'center' },
  sheetCircleActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  sheetApply: { backgroundColor: COLORS.navy, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  sheetApplyText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});