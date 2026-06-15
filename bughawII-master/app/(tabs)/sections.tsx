import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  generateYearbook, getBatches, getErrorMessage,
  imageUrl, searchFace, unwrap,
} from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy:       '#1B2A5E',
  gold:       '#F5A623',
  background: '#F0F2F7',
  card:       '#FFFFFF',
  border:     '#E0E3EC',
  muted:      '#888888',
};

// Data helpers
const batchId         = (b: any) => b?.id || b?.batch_id;
const batchYear       = (b: any) => b?.graduation_year || b?.year || '2025';
const batchCourse     = (b: any) => b?.course || b?.program || 'Graduation batch';
const batchDepartment = (b: any) => b?.department || b?.college || 'Department';
const batchStudents   = (b: any) => b?.students_count ?? b?.student_count ?? b?.total_students ?? 0;
const batchSections   = (b: any) => b?.sections || b?.section_list || b?.section_names || [];
const normalizedBatchSections = (b: any): string[] =>
  Array.from(new Set<string>(
    batchSections(b)
      .map((s: any) => s?.name || s?.section || String(s))
      .filter(Boolean)
  ));
const batchSectionsCount = (b: any) =>
  b?.sections_count ?? b?.section_count ?? normalizedBatchSections(b).length ?? 0;
const batchStudentNames = (b: any) => {
  const students = b?.students || b?.student_list || [];
  return Array.isArray(students)
    ? students.map((s: any) => s?.name || s?.full_name || '').filter(Boolean)
    : [];
};

const studentName     = (s: any) => s?.name || s?.full_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim() || 'Student';
const studentInitials = (s: any) => studentName(s).split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]).join('').toUpperCase() || 'NU';
const studentId       = (s: any) => s?.id || s?.student_id;
const studentUserId   = (s: any) => s?.user_id || s?.account_user_id || s?.user?.id || s?.userAccount?.id;
const studentPhoto    = (s: any) => imageUrl(
  s?.profile_picture || s?.profile_pic || s?.photo_url || s?.photo || s?.avatar ||
  s?.avatar_url || s?.image_url || s?.user?.profile_picture || s?.user?.profile_pic ||
  s?.user?.photo || s?.student?.profile_picture || s?.student?.photo_url ||
  s?.student?.photo || s?.student_record?.photo || s?.studentRecord?.photo,
);
const faceMatchIds  = (m: any) => [m?.student_record_id, m?.student_id, m?.id, m?.user_id, m?.account_user_id].filter(Boolean).map(String);
const studentMatchIds = (s: any) => [studentId(s), studentUserId(s), s?.student_record_id].filter(Boolean).map(String);
const sectionStudents = (s: any) => Array.isArray(s?.students) ? s.students : [];

const groupedBatchSections = (batch: any) => {
  const groups = new Map<string, { department: string; courses: Map<string, any[]> }>();
  (Array.isArray(batch?.sections) ? batch.sections : []).forEach((section: any) => {
    const dept   = section?.department || batchDepartment(batch);
    const course = section?.course     || batchCourse(batch);
    if (!groups.has(dept)) groups.set(dept, { department: dept, courses: new Map() });
    const group = groups.get(dept)!;
    if (!group.courses.has(course)) group.courses.set(course, []);
    group.courses.get(course)!.push(section);
  });
  return Array.from(groups.values()).map((g) => ({
    department:   g.department,
    studentCount: Array.from(g.courses.values()).flat().reduce((n, s) => n + sectionStudents(s).length, 0),
    courses: Array.from(g.courses.entries()).map(([course, sections]) => ({
      course,
      studentCount: sections.reduce((n, s) => n + sectionStudents(s).length, 0),
      sections,
    })),
  }));
};

const flattenBatches = (payload: any) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).flatMap((g: any) => Array.isArray(g) ? g : []);
};

// Bottom-sheet filter
function BottomSheetFilter({ visible, title = 'Filter', options, selected, onSelect, onApply, onClose }: {
  visible: boolean; title?: string;
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void; onApply: () => void; onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const active = selected === opt.value;
              return (
                <TouchableOpacity key={opt.value} style={styles.sheetOption} onPress={() => onSelect(opt.value)} activeOpacity={0.84}>
                  <Text style={styles.sheetOptionText}>{opt.label}</Text>
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

// Breadcrumb
function Breadcrumb({ department, course, section, onResetDept, onResetCourse }: {
  department: string | null; course: string | null; section: string | null;
  onResetDept: () => void; onResetCourse: () => void;
}) {
  if (!department) return null;
  return (
    <View style={styles.breadcrumb}>
      <TouchableOpacity onPress={onResetDept}>
        <Text style={styles.breadcrumbLink}>All Depts</Text>
      </TouchableOpacity>
      <Text style={styles.breadcrumbSep}>/</Text>
      {course ? (
        <>
          <TouchableOpacity onPress={onResetCourse}>
            <Text style={styles.breadcrumbLink}>{department}</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSep}>/</Text>
        </>
      ) : (
        <Text style={styles.breadcrumbCurrent}>{department}</Text>
      )}
      {course && (
        section ? (
          <>
            <TouchableOpacity onPress={() => onResetCourse()}>
              <Text style={styles.breadcrumbLink}>{course}</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSep}>/</Text>
            <Text style={styles.breadcrumbCurrent}>Section {section}</Text>
          </>
        ) : (
          <Text style={styles.breadcrumbCurrent}>{course}</Text>
        )
      )}
    </View>
  );
}

// Department card (drill level 0)
function DepartmentCard({ name, studentCount, courses, onPress }: {
  name: string; studentCount: number;
  courses: { course: string; sections: any[] }[];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.drillCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.drillCardRow}>
        <View style={[styles.drillIcon, { backgroundColor: COLORS.navy }]}>
          <FontAwesome name="institution" size={16} color={COLORS.gold} />
        </View>
        <View style={styles.drillCardMeta}>
          <Text style={styles.drillCardTitle}>{name}</Text>
          <Text style={styles.drillCardSub}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} · {studentCount} students
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={COLORS.border} />
      </View>
      {/* Course preview pills */}
      <View style={styles.previewPillRow}>
        {courses.slice(0, 3).map((c) => (
          <View key={c.course} style={styles.previewPill}>
            <Text style={styles.previewPillText} numberOfLines={1}>{c.course}</Text>
          </View>
        ))}
        {courses.length > 3 && (
          <View style={[styles.previewPill, styles.previewPillMore]}>
            <Text style={styles.previewPillMoreText}>+{courses.length - 3} more</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Course card (drill level 1)
function CourseCard({ name, studentCount, sections, onPress }: {
  name: string; studentCount: number; sections: any[]; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.drillCard} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.drillCardRow}>
        <View style={[styles.drillIcon, { backgroundColor: '#eef2ff' }]}>
          <FontAwesome name="graduation-cap" size={14} color="#3347d8" />
        </View>
        <View style={styles.drillCardMeta}>
          <Text style={[styles.drillCardTitle, { color: '#3347d8' }]}>{name}</Text>
          <Text style={styles.drillCardSub}>
            {sections.length} section{sections.length !== 1 ? 's' : ''} · {studentCount} students
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={COLORS.border} />
      </View>
      {/* Section preview pills */}
      <View style={styles.previewPillRow}>
        {sections.slice(0, 5).map((s: any) => (
          <View key={String(s?.id || s?.name)} style={styles.previewPill}>
            <Text style={styles.previewPillText}>{s?.name || 'Section'}</Text>
          </View>
        ))}
        {sections.length > 5 && (
          <View style={[styles.previewPill, styles.previewPillMore]}>
            <Text style={styles.previewPillMoreText}>+{sections.length - 5}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Section card (drill level 2)
function SectionCard({ section, onPress }: { section: any; onPress: () => void }) {
  const students = sectionStudents(section);
  const preview  = students.slice(0, 6);
  return (
    <TouchableOpacity style={[styles.drillCard, styles.sectionCard]} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.drillCardRow}>
        <View style={[styles.drillIcon, { backgroundColor: '#eef2ff' }]}>
          <FontAwesome name="cube" size={13} color="#3347d8" />
        </View>
        <View style={styles.drillCardMeta}>
          <Text style={styles.drillCardTitle}>Section {section?.name || 'Section'}</Text>
          <Text style={styles.drillCardSub}>{students.length} student{students.length !== 1 ? 's' : ''}</Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={COLORS.border} />
      </View>
      {/* Avatar preview */}
      <View style={styles.avatarPreviewRow}>
        {preview.map((s: any, i: number) => {
          const photo = studentPhoto(s);
          return (
            <View key={String(studentId(s) || i)} style={[styles.avatarPreviewItem, i > 0 && { marginLeft: -8 }]}>
              {photo
                ? <Image source={photo} style={styles.avatarPreviewImg} contentFit="cover" />
                : <Text style={styles.avatarPreviewInitials}>{studentInitials(s)}</Text>}
            </View>
          );
        })}
        {students.length > 6 && (
          <View style={[styles.avatarPreviewItem, styles.avatarPreviewMore, { marginLeft: -8 }]}>
            <Text style={styles.avatarPreviewMoreText}>+{students.length - 6}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Student card (drill level 3)
function StudentCard({ student, batchYearVal, router }: { student: any; batchYearVal: string; router: any }) {
  const photo = studentPhoto(student);
  return (
    <TouchableOpacity
      style={styles.detailStudentCard}
      activeOpacity={0.88}
      onPress={() => router.push({
        pathname: '/student/[id]',
        params: {
          id: String(studentId(student)),
          source: 'discovery',
          ...(studentUserId(student) ? { userId: String(studentUserId(student)) } : {}),
        },
      } as any)}
    >
      <View style={styles.detailStudentAvatar}>
        {photo
          ? <Image source={photo} style={styles.detailStudentAvatarImage} contentFit="cover" />
          : <Text style={styles.detailStudentInitials}>{studentInitials(student)}</Text>}
      </View>
      <View style={styles.detailStudentCopy}>
        <Text style={styles.detailStudentName} numberOfLines={1}>{studentName(student)}</Text>
        <Text style={styles.detailStudentMeta} numberOfLines={1}>Batch {batchYearVal}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Main screen
export default function SectionsScreen() {
  const router = useRouter();
  const [batches,      setBatches]      = useState<any[]>([]);
  const [query,        setQuery]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Drill state (inside batch detail)
  const [drillDept,    setDrillDept]    = useState<string | null>(null);
  const [drillCourse,  setDrillCourse]  = useState<string | null>(null);
  const [drillSection, setDrillSection] = useState<string | null>(null);

  // Drill level: 0=depts, 1=courses, 2=sections, 3=students
  const drillLevel = drillSection ? 3 : drillCourse ? 2 : drillDept ? 1 : 0;

  // Search & face inside detail
  const [detailQuery,        setDetailQuery]        = useState('');
  const [detailFaceMatchedIds, setDetailFaceMatchedIds] = useState<Set<string>>(new Set());
  const [detailFaceSearching,  setDetailFaceSearching]  = useState(false);

  // Batch list filter
  const [activeDepartment, setActiveDepartment] = useState('All Departments');
  const [deptSheetOpen,    setDeptSheetOpen]    = useState(false);

  const directoryEnabled = true;

  const loadData = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);
      const payload = await getBatches();
      setBatches(flattenBatches(payload));
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load academic batches.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => { loadData(); }, [loadData]);

  const departmentFilters = useMemo(() => {
    const depts = Array.from(new Set(batches.map(batchDepartment).filter(Boolean)));
    return ['All Departments', ...depts];
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter((b) => {
      const byDept = activeDepartment === 'All Departments' || batchDepartment(b) === activeDepartment;
      const text   = `${batchYear(b)} ${batchCourse(b)} ${batchDepartment(b)} ${normalizedBatchSections(b).join(' ')} ${batchStudentNames(b).join(' ')}`.toLowerCase();
      return byDept && (!q || text.includes(q));
    });
  }, [activeDepartment, batches, query]);

  const handleOpenYearbook = async (batch: any) => {
    const id = batchId(batch);
    if (!id) { Alert.alert('Yearbook unavailable', 'This batch does not have a yearbook yet.'); return; }
    await generateYearbook(id).catch(() => null);
    router.push({ pathname: '/yearbook', params: { batchId: String(id), view: '1' } } as any);
  };

  const openBatchDetail = (batch: any) => {
    setDetailQuery('');
    setDetailFaceMatchedIds(new Set());
    setDrillDept(null);
    setDrillCourse(null);
    setDrillSection(null);
    setSelectedBatch(batch);
  };

  const resetDrill = () => { setDrillDept(null); setDrillCourse(null); setDrillSection(null); };
  const resetToCourse = () => { setDrillCourse(null); setDrillSection(null); };

  const handleDetailFaceSearch = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to search by face.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const form  = new FormData();
    form.append('face_image', { uri: asset.uri, name: asset.fileName || 'face.jpg', type: asset.mimeType || 'image/jpeg' } as any);
    try {
      setDetailFaceSearching(true);
      const payload = await searchFace(form);
      const matches = payload?.matches || payload?.data?.matches || [];
      const ids = new Set<string>(matches.flatMap(faceMatchIds));
      setDetailFaceMatchedIds(ids);
      if (!ids.size) Alert.alert('No face match', 'No matching student was found in this batch.');
    } catch (err: any) {
      Alert.alert('Face search failed', getErrorMessage(err, 'Unable to run face search.'));
    } finally {
      setDetailFaceSearching(false);
    }
  };

  // Batch list item
  const renderBatch = ({ item }: { item: any }) => {
    const sections     = normalizedBatchSections(item);
    const preview      = sections.slice(0, 3);
    const moreCount    = Math.max(0, sections.length - preview.length);
    return (
      <View style={styles.batchCard}>
        <View style={styles.batchTop}>
          <Text style={styles.batchYearTitle}>{batchYear(item)}</Text>
          <Text style={styles.batchWatermark}>{batchYear(item)}</Text>
        </View>
        <Text style={styles.batchTitle} numberOfLines={2}>{batchCourse(item)}</Text>
        <Text style={styles.departmentText}>{batchDepartment(item)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome name="users" size={12} color={COLORS.muted} />
            <Text style={styles.countText}>{batchStudents(item)} students</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="graduation-cap" size={12} color={COLORS.muted} />
            <Text style={styles.countText}>{batchSectionsCount(item)} sections</Text>
          </View>
        </View>
        <View style={styles.sectionsPreview}>
          <View style={styles.sectionPillRow}>
            {(preview.length ? preview : ['No sections yet']).map((s: string) => (
              <View key={s} style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>{s}</Text>
              </View>
            ))}
            {moreCount > 0 && (
              <View style={[styles.sectionPill, styles.sectionPillMore]}>
                <Text style={styles.sectionPillMoreText}>+{moreCount} more</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.actionRow}>
          {directoryEnabled ? (
            <TouchableOpacity style={styles.batchmateButton} onPress={() => openBatchDetail(item)}>
              <Text style={styles.batchmateText}>View Batchmates →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.directoryDisabledPill}>
              <FontAwesome name="lock" size={11} color="#475569" />
              <Text style={styles.directoryDisabledText}>Directory disabled</Text>
            </View>
          )}
          <TouchableOpacity style={styles.generateButton} onPress={() => handleOpenYearbook(item)}>
            <FontAwesome name="book" size={12} color="#fdb813" />
            <Text style={styles.generateText}>Open Yearbook - {batchYear(item)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Batch detail (drill-down view)
  const renderBatchDetail = () => {
    const detailSearch = detailQuery.trim().toLowerCase();
    const faceActive   = detailFaceMatchedIds.size > 0;

    // Full grouped data
    const allGroups = groupedBatchSections(selectedBatch);

    // Filter students within a section
    const filterStudents = (students: any[]) =>
      students.filter((s) => {
        const nameMatch = `${studentName(s)} ${studentId(s) || ''}`.toLowerCase().includes(detailSearch);
        const textMatch = !detailSearch || nameMatch;
        const faceMatch = !faceActive || studentMatchIds(s).some((id) => detailFaceMatchedIds.has(id));
        return textMatch && faceMatch;
      });

    // Level 0: Department cards
    const renderDepartments = () => (
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        {faceActive && renderFaceBanner()}
        <Text style={styles.drillHint}>Select a department</Text>
        {allGroups
          .filter((g) => !detailSearch || g.department.toLowerCase().includes(detailSearch))
          .map((g) => (
            <DepartmentCard
              key={g.department}
              name={g.department}
              studentCount={g.studentCount}
              courses={g.courses}
              onPress={() => setDrillDept(g.department)}
            />
          ))}
        {allGroups.length === 0 && renderEmpty()}
      </ScrollView>
    );

    // Level 1: Course cards for active department
    const renderCourses = () => {
      const deptGroup = allGroups.find((g) => g.department === drillDept);
      const courses   = deptGroup?.courses ?? [];
      return (
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {renderSearchBar()}
          {faceActive && renderFaceBanner()}
          <View style={styles.drillSectionHeader}>
            <View style={[styles.drillIcon, { backgroundColor: COLORS.navy }]}>
              <FontAwesome name="institution" size={14} color={COLORS.gold} />
            </View>
            <View>
              <Text style={styles.drillSectionTitle}>{drillDept}</Text>
              <Text style={styles.drillSectionSub}>Select a course</Text>
            </View>
          </View>
          {courses
            .filter((c) => !detailSearch || c.course.toLowerCase().includes(detailSearch))
            .map((c) => (
              <CourseCard
                key={c.course}
                name={c.course}
                studentCount={c.studentCount}
                sections={c.sections}
                onPress={() => setDrillCourse(c.course)}
              />
            ))}
          {courses.length === 0 && renderEmpty()}
        </ScrollView>
      );
    };

    // Level 2: Section cards for active course
    const renderSections = () => {
      const deptGroup   = allGroups.find((g) => g.department === drillDept);
      const courseGroup = deptGroup?.courses.find((c) => c.course === drillCourse);
      const sections    = courseGroup?.sections ?? [];
      return (
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {renderSearchBar()}
          {faceActive && renderFaceBanner()}
          <View style={styles.drillSectionHeader}>
            <View style={[styles.drillIcon, { backgroundColor: '#eef2ff' }]}>
              <FontAwesome name="graduation-cap" size={14} color="#3347d8" />
            </View>
            <View>
              <Text style={[styles.drillSectionTitle, { color: '#3347d8' }]}>{drillCourse}</Text>
              <Text style={styles.drillSectionSub}>Select a section</Text>
            </View>
          </View>
          <View style={styles.sectionGrid}>
            {sections
              .filter((s: any) => !detailSearch || String(s?.name || '').toLowerCase().includes(detailSearch))
              .map((s: any) => (
                <SectionCard
                  key={String(s?.id || s?.name)}
                  section={s}
                  onPress={() => setDrillSection(s?.name || 'Section')}
                />
              ))}
          </View>
          {sections.length === 0 && renderEmpty()}
        </ScrollView>
      );
    };

    // Level 3: Students for active section
    const renderStudents = () => {
      const deptGroup   = allGroups.find((g) => g.department === drillDept);
      const courseGroup = deptGroup?.courses.find((c) => c.course === drillCourse);
      const section     = courseGroup?.sections.find((s: any) => (s?.name || 'Section') === drillSection);
      const students    = filterStudents(sectionStudents(section));

      return (
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {renderSearchBar()}
          {faceActive && renderFaceBanner()}
          <View style={styles.drillSectionHeader}>
            <View style={[styles.drillIcon, { backgroundColor: '#eef2ff' }]}>
              <FontAwesome name="cube" size={13} color="#3347d8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.drillSectionTitle}>Section {drillSection}</Text>
              <Text style={styles.drillSectionSub}>{drillCourse}</Text>
            </View>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{students.length} students</Text>
            </View>
          </View>
          <View style={styles.studentGrid}>
            {students.map((s: any) => (
              <StudentCard
                key={String(studentId(s) || studentName(s))}
                student={s}
                batchYearVal={batchYear(selectedBatch)}
                router={router}
              />
            ))}
          </View>
          {students.length === 0 && renderEmpty()}
        </ScrollView>
      );
    };

    // Shared sub-renders
    const renderSearchBar = () => (
      <View style={styles.detailSearchShell}>
        <FontAwesome name="search" size={14} color="#94a3b8" />
        <TextInput
          style={styles.detailSearchInput}
          placeholder="Search…"
          placeholderTextColor="#94a3b8"
          value={detailQuery}
          onChangeText={(v) => { setDetailQuery(v); setDetailFaceMatchedIds(new Set()); }}
        />
        {detailQuery ? (
          <TouchableOpacity style={styles.detailSearchClear} onPress={() => setDetailQuery('')} activeOpacity={0.8}>
            <FontAwesome name="times" size={12} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.detailSearchCamera} onPress={handleDetailFaceSearch} disabled={detailFaceSearching} activeOpacity={0.82}>
          {detailFaceSearching
            ? <ActivityIndicator color={COLORS.gold} size="small" />
            : <FontAwesome name="camera" size={14} color={COLORS.gold} />}
        </TouchableOpacity>
      </View>
    );

    const renderFaceBanner = () => (
      <View style={styles.faceBanner}>
        <Text style={styles.faceBannerText}>{detailFaceMatchedIds.size} face match{detailFaceMatchedIds.size === 1 ? '' : 'es'} found</Text>
        <TouchableOpacity onPress={() => setDetailFaceMatchedIds(new Set())}>
          <Text style={styles.faceBannerClear}>Clear</Text>
        </TouchableOpacity>
      </View>
    );

    const renderEmpty = () => (
      <View style={styles.emptyPanel}>
        <FontAwesome name="users" size={38} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No Results</Text>
        <Text style={styles.emptyText}>Try adjusting your search.</Text>
      </View>
    );

    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar style="light" />

        {/* Hero */}
        <View style={styles.detailHero}>
          <TouchableOpacity
            style={styles.detailBack}
            onPress={() => {
              if (drillLevel > 0) {
                // Back up one drill level
                if (drillSection) { setDrillSection(null); return; }
                if (drillCourse)  { setDrillCourse(null);  return; }
                if (drillDept)    { setDrillDept(null);    return; }
              }
              setDetailQuery('');
              setSelectedBatch(null);
            }}
          >
            <FontAwesome name="chevron-left" size={18} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.detailEyebrow}>National University Lipa</Text>
          <Text style={styles.detailTitle}>
            Your <Text style={styles.heroGold}>Batchmates</Text>
          </Text>
          <Text style={styles.detailSubtitle}>
            Batch {batchYear(selectedBatch)} · {batchStudents(selectedBatch)} students · {batchSectionsCount(selectedBatch)} sections
          </Text>
          <TouchableOpacity style={styles.detailYearbookButton} onPress={() => handleOpenYearbook(selectedBatch)}>
            <FontAwesome name="book" size={12} color={COLORS.gold} />
            <Text style={styles.detailYearbookText}>Open Yearbook {batchYear(selectedBatch)}</Text>
          </TouchableOpacity>
        </View>

        {/* Breadcrumb */}
        <Breadcrumb
          department={drillDept}
          course={drillCourse}
          section={drillSection}
          onResetDept={resetDrill}
          onResetCourse={resetToCourse}
        />

        {/* Drill content */}
        {drillLevel === 0 && renderDepartments()}
        {drillLevel === 1 && renderCourses()}
        {drillLevel === 2 && renderSections()}
        {drillLevel === 3 && renderStudents()}
      </SafeAreaView>
    );
  };

  // Batch list screen
  if (selectedBatch) return renderBatchDetail();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={filteredBatches}
        keyExtractor={(item, i) => String(batchId(item) || i)}
        renderItem={renderBatch}
        ListHeaderComponent={(
          <>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>National University Lipa</Text>
              <Text style={styles.heroTitle}>Academic Batches</Text>
              <Text style={styles.heroSubtitle}>Browse batches by department, course, section, and students.</Text>
              <View style={styles.searchShell}>
                <FontAwesome name="search" size={15} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students, sections, courses..."
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                />
                <View style={styles.searchCamera}>
                  <FontAwesome name="camera" size={14} color={COLORS.gold} />
                </View>
              </View>
            </View>

            <View style={styles.filterBar}>
              <View style={styles.filterLabelRow}>
                <FontAwesome name="institution" size={11} color={COLORS.gold} />
                <Text style={styles.filterLabel}>Filter by department</Text>
              </View>
              <TouchableOpacity style={styles.departmentDropdown} onPress={() => setDeptSheetOpen(true)}>
                <View>
                  <Text style={styles.dropdownLabel}>Department</Text>
                  <Text style={styles.dropdownValue}>{activeDepartment}</Text>
                </View>
                <FontAwesome name="chevron-down" size={11} color={COLORS.navy} />
              </TouchableOpacity>
            </View>

            <View style={styles.batchSummary}>
              <View style={styles.batchSummaryIcon}>
                <FontAwesome name="institution" size={15} color="#fdb813" />
              </View>
              <Text style={styles.batchSummaryText}>
                {filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}
              </Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 34 }} />
            : (
              <View style={styles.emptyPanel}>
                <FontAwesome name="graduation-cap" size={38} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Batches Found</Text>
                <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
              </View>
            )
        }
        ListFooterComponent={<View style={{ height: 110 }} />}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      />
      <BottomSheetFilter
        visible={deptSheetOpen}
        title="Filter by department"
        options={departmentFilters.map((d) => ({ label: d, value: d }))}
        selected={activeDepartment}
        onSelect={(v) => { setActiveDepartment(v); setDeptSheetOpen(false); }}
        onApply={() => setDeptSheetOpen(false)}
        onClose={() => setDeptSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 0 },

  // Hero
  hero:         { backgroundColor: COLORS.navy, padding: 20, paddingTop: 54, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  heroEyebrow:  { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  heroTitle:    { color: '#ffffff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  heroGold:     { color: COLORS.gold },
  heroSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 18, textAlign: 'center' },

  // Search bar
  searchShell:  { width: '100%', minHeight: 42, borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  searchInput:  { flex: 1, color: COLORS.navy, fontSize: 13, marginLeft: 10 },
  searchCamera: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 },

  // Filter bar
  filterBar:          { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  filterLabelRow:     { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  filterLabel:        { color: COLORS.muted, fontSize: 10, textTransform: 'uppercase', fontWeight: '900' },
  departmentDropdown: { minHeight: 46, borderRadius: 20, backgroundColor: COLORS.gold, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownLabel:      { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  dropdownValue:      { color: COLORS.navy, fontSize: 11, fontWeight: '800', marginTop: 2 },

  // Batch summary
  batchSummary:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginBottom: 18 },
  batchSummaryIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  batchSummaryText: { color: '#64748b', fontSize: 13, fontWeight: '900', backgroundColor: '#eef2ff', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },

  // Batch card
  batchCard:      { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, marginHorizontal: 14, marginBottom: 12, padding: 16 },
  batchTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchYearTitle: { color: COLORS.navy, fontSize: 22, fontWeight: '900' },
  batchWatermark: { color: COLORS.gold, fontSize: 48, fontWeight: '900', opacity: 0.15, position: 'absolute', right: 0, top: -16 },
  batchTitle:     { color: COLORS.navy, fontSize: 15, lineHeight: 20, fontWeight: '900', marginTop: 4 },
  departmentText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  statsRow:       { marginTop: 8, flexDirection: 'row', gap: 16 },
  statItem:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText:      { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  sectionsPreview: { backgroundColor: '#F7F8FB', borderRadius: 10, padding: 10, marginTop: 10 },
  sectionPillRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectionPill:     { backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  sectionPillText: { color: COLORS.navy, fontSize: 11, fontWeight: '800' },
  sectionPillMore: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  sectionPillMoreText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  actionRow:       { flexDirection: 'row', gap: 8, alignItems: 'stretch', marginTop: 12 },
  batchmateButton: { flex: 1, minHeight: 40, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: COLORS.navy, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  batchmateText:   { color: COLORS.navy, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  directoryDisabledPill: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, borderRadius: 10 },
  directoryDisabledText: { color: '#475569', fontSize: 11, fontWeight: '900' },
  generateButton: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.navy, paddingHorizontal: 10, borderRadius: 10 },
  generateText:   { color: '#FFFFFF', fontSize: 12, fontWeight: '900', textAlign: 'center' },

  // Detail hero
  detailHero:          { backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 26, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  detailBack:          { position: 'absolute', left: 16, top: 48, width: 44, height: 44, borderRadius: 15, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  detailEyebrow:       { color: 'rgba(255,255,255,0.42)', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  detailTitle:         { color: '#ffffff', fontSize: 27, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  detailSubtitle:      { color: 'rgba(255,255,255,0.66)', fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  detailYearbookButton: { marginTop: 16, minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,184,19,0.7)', paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  detailYearbookText:  { color: COLORS.gold, fontSize: 11, fontWeight: '900' },
  detailContent:       { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 150 },

  // Search in detail
  detailSearchShell:  { minHeight: 48, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbe4f0', flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6, marginBottom: 14 },
  detailSearchInput:  { flex: 1, minWidth: 0, color: COLORS.navy, fontSize: 13, fontWeight: '800', marginLeft: 10 },
  detailSearchClear:  { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  detailSearchCamera: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,166,35,0.12)' },

  // Face banner
  faceBanner:     { marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,166,35,0.35)', backgroundColor: 'rgba(245,166,35,0.12)', paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faceBannerText: { color: '#9a6100', fontSize: 12, fontWeight: '900' },
  faceBannerClear: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },

  // Breadcrumb
  breadcrumb:       { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 4, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  breadcrumbLink:    { color: '#3347d8', fontSize: 11, fontWeight: '900' },
  breadcrumbSep:     { color: COLORS.muted, fontSize: 11 },
  breadcrumbCurrent: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },

  // Drill cards (shared shell)
  drillCard:     { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  drillCardRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drillIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  drillCardMeta: { flex: 1 },
  drillCardTitle: { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  drillCardSub:  { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },

  // Preview pills inside drill cards
  previewPillRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  previewPill:       { backgroundColor: '#f8fafc', borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, maxWidth: 140 },
  previewPillText:   { color: COLORS.navy, fontSize: 10, fontWeight: '800' },
  previewPillMore:   { backgroundColor: '#eef2ff', borderColor: '#eef2ff' },
  previewPillMoreText: { color: '#3347d8', fontSize: 10, fontWeight: '900' },

  // Avatar preview in section card
  avatarPreviewRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  avatarPreviewItem:     { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  avatarPreviewImg:      { width: '100%', height: '100%' },
  avatarPreviewInitials: { color: COLORS.gold, fontSize: 10, fontWeight: '900' },
  avatarPreviewMore:     { backgroundColor: '#eef2ff' },
  avatarPreviewMoreText: { color: '#3347d8', fontSize: 10, fontWeight: '900' },

  // Drill level headers
  drillHint:          { color: COLORS.muted, fontSize: 11, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  drillSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  drillSectionTitle:  { color: COLORS.navy, fontSize: 15, fontWeight: '900' },
  drillSectionSub:    { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },

  // Section list
  sectionGrid: { width: '100%' },
  sectionCard: { width: '100%' },

  // Student grid
  studentGrid:    { gap: 8 },
  sectionCountBadge: { borderRadius: 999, backgroundColor: '#eef2ff', paddingHorizontal: 9, paddingVertical: 4 },
  sectionCountText:  { color: '#3347d8', fontSize: 9, fontWeight: '900' },

  // Student card
  detailStudentCard:        { minHeight: 62, borderRadius: 12, borderWidth: 1, borderColor: '#dbe4f0', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 10 },
  detailStudentAvatar:      { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  detailStudentAvatarImage: { width: '100%', height: '100%' },
  detailStudentInitials:    { color: COLORS.gold, fontSize: 14, fontWeight: '900' },
  detailStudentCopy:        { flex: 1, minWidth: 0 },
  detailStudentName:        { color: '#071b3d', fontSize: 13, fontWeight: '900' },
  detailStudentMeta:        { color: '#8fa0bf', fontSize: 10, fontWeight: '800', marginTop: 2 },

  // Empty / error
  errorText:  { color: '#dc2626', textAlign: 'center', marginBottom: 14 },
  emptyPanel: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 54, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900', marginTop: 16 },
  emptyText:  { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginTop: 6 },

  // Bottom sheet
  sheetOverlay:      { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:             { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, maxHeight: '82%' },
  sheetHandle:       { width: 36, height: 4, borderRadius: 999, backgroundColor: '#D1D5E0', alignSelf: 'center', marginBottom: 12 },
  sheetTitle:        { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginBottom: 10 },
  sheetScroll:       { maxHeight: 420 },
  sheetOption:       { minHeight: 40, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetOptionText:   { color: COLORS.navy, fontSize: 13 },
  sheetCircle:       { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5E0', alignItems: 'center', justifyContent: 'center' },
  sheetCircleActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  sheetApply:        { backgroundColor: COLORS.navy, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  sheetApplyText:    { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
