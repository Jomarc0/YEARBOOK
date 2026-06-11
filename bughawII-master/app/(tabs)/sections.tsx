import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { generateYearbook, getBatches, getErrorMessage, imageUrl, searchFace, unwrap } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#1B2A5E',
  gold: '#F5A623',
  background: '#F0F2F7',
  card: '#FFFFFF',
  border: '#E0E3EC',
  muted: '#888888',
};

const batchId = (batch: any) => batch?.id || batch?.batch_id;
const batchYear = (batch: any) => batch?.graduation_year || batch?.year || '2025';
const batchCourse = (batch: any) => batch?.course || batch?.program || 'Graduation batch';
const batchDepartment = (batch: any) => batch?.department || batch?.college || 'Department';
const batchStudents = (batch: any) => batch?.students_count ?? batch?.student_count ?? batch?.total_students ?? 0;
const batchSections = (batch: any) => batch?.sections || batch?.section_list || batch?.section_names || [];
const normalizedBatchSections = (batch: any): string[] => Array.from(new Set<string>(batchSections(batch).map((section: any) => section?.name || section?.section || String(section)).filter(Boolean)));
const batchSectionsCount = (batch: any) => batch?.sections_count ?? batch?.section_count ?? normalizedBatchSections(batch).length ?? 0;
const batchStudentNames = (batch: any) => {
  const students = batch?.students || batch?.student_list || [];
  return Array.isArray(students) ? students.map((student: any) => student?.name || student?.full_name || '').filter(Boolean) : [];
};
const studentName = (student: any) => student?.name || student?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Student';
const studentInitials = (student: any) => studentName(student).split(' ').filter(Boolean).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase() || 'NU';
const studentId = (student: any) => student?.id || student?.student_id;
const studentUserId = (student: any) => student?.user_id || student?.account_user_id || student?.user?.id || student?.userAccount?.id;
const studentPhoto = (student: any) => imageUrl(
  student?.profile_picture ||
  student?.profile_pic ||
  student?.photo_url ||
  student?.photo ||
  student?.avatar ||
  student?.avatar_url ||
  student?.image_url ||
  student?.user?.profile_picture ||
  student?.user?.profile_pic ||
  student?.user?.photo ||
  student?.student?.profile_picture ||
  student?.student?.photo_url ||
  student?.student?.photo ||
  student?.student_record?.photo ||
  student?.studentRecord?.photo,
);
const faceMatchIds = (match: any) => [
  match?.student_record_id,
  match?.student_id,
  match?.id,
  match?.user_id,
  match?.account_user_id,
].filter(Boolean).map(String);
const studentMatchIds = (student: any) => [
  studentId(student),
  studentUserId(student),
  student?.student_record_id,
].filter(Boolean).map(String);
const sectionStudents = (section: any) => Array.isArray(section?.students) ? section.students : [];
const groupedBatchSections = (batch: any) => {
  const groups = new Map<string, { department: string; courses: Map<string, any[]> }>();

  (Array.isArray(batch?.sections) ? batch.sections : []).forEach((section: any) => {
    const department = section?.department || batchDepartment(batch);
    const course = section?.course || batchCourse(batch);
    if (!groups.has(department)) groups.set(department, { department, courses: new Map() });
    const group = groups.get(department)!;
    if (!group.courses.has(course)) group.courses.set(course, []);
    group.courses.get(course)!.push(section);
  });

  return Array.from(groups.values()).map((group) => ({
    department: group.department,
    studentCount: Array.from(group.courses.values()).flat().reduce((sum, section) => sum + sectionStudents(section).length, 0),
    courses: Array.from(group.courses.entries()).map(([course, sections]) => ({
      course,
      studentCount: sections.reduce((sum, section) => sum + sectionStudents(section).length, 0),
      sections,
    })),
  }));
};

const flattenBatches = (payload: any) => {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).flatMap((group: any) => Array.isArray(group) ? group : []);
};

function BottomSheetFilter({ visible, title = 'Filter', options, selected, onSelect, onApply, onClose }: {
  visible: boolean;
  title?: string;
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

export default function SectionsScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [detailQuery, setDetailQuery] = useState('');
  const [detailDepartment, setDetailDepartment] = useState('All Departments');
  const [detailCourse, setDetailCourse] = useState('All Courses');
  const [detailSection, setDetailSection] = useState('All Sections');
  const [detailFilterSheet, setDetailFilterSheet] = useState<null | 'department' | 'course' | 'section'>(null);
  const [detailFaceMatchedIds, setDetailFaceMatchedIds] = useState<Set<string>>(new Set());
  const [detailFaceSearching, setDetailFaceSearching] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState('All Departments');
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const directoryEnabled = true;
  const loadData = useCallback(async () => {
    try {
      setError('');
      if (!refreshing) setLoading(true);

      const batchPayload = await getBatches();
      setBatches(flattenBatches(batchPayload));
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Unable to load academic batches.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const departmentFilters = useMemo(() => {
    const departments = Array.from(new Set(batches.map(batchDepartment).filter(Boolean)));
    return ['All Departments', ...departments];
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter((batch) => {
      const byDepartment = activeDepartment === 'All Departments' || batchDepartment(batch) === activeDepartment;
      const text = `${batchYear(batch)} ${batchCourse(batch)} ${batchDepartment(batch)} ${normalizedBatchSections(batch).join(' ')} ${batchStudentNames(batch).join(' ')}`.toLowerCase();
      return byDepartment && (!q || text.includes(q));
    });
  }, [activeDepartment, batches, query]);

  const handleOpenYearbook = async (batch: any) => {
    const id = batchId(batch);
    if (!id) {
      Alert.alert('Yearbook unavailable', 'This batch does not have a yearbook yet.');
      return;
    }

    await generateYearbook(id).catch(() => null);
    router.push({
      pathname: '/yearbook',
      params: { batchId: String(id), view: '1' },
    } as any);
  };

  const openBatchDetail = (batch: any) => {
    setDetailQuery('');
    setDetailDepartment('All Departments');
    setDetailCourse('All Courses');
    setDetailSection('All Sections');
    setDetailFaceMatchedIds(new Set());
    setDetailFilterSheet(null);
    setSelectedBatch(batch);
  };

  const handleDetailFaceSearch = async () => {
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
      name: asset.fileName || 'section-face-search.jpg',
      type: asset.mimeType || 'image/jpeg',
    } as any);

    try {
      setDetailFaceSearching(true);
      const payload = await searchFace(form);
      const matches = payload?.matches || payload?.data?.matches || [];
      const ids = new Set<string>(matches.flatMap(faceMatchIds));
      setDetailFaceMatchedIds(ids);
      if (!ids.size) {
        Alert.alert('No face match', 'No matching student was found in this batch.');
      }
    } catch (requestError: any) {
      Alert.alert('Face search failed', getErrorMessage(requestError, 'Unable to run face search.'));
    } finally {
      setDetailFaceSearching(false);
    }
  };

  const renderBatch = ({ item }: { item: any }) => {
    const sections = normalizedBatchSections(item);
    const previewSections = sections.slice(0, 3);
    const moreSections = Math.max(0, sections.length - previewSections.length);

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
            {(previewSections.length ? previewSections : ['No sections yet']).map((section: string) => (
              <View key={section} style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>{section}</Text>
              </View>
            ))}
            {moreSections ? (
              <View style={[styles.sectionPill, styles.sectionPillMore]}>
                <Text style={styles.sectionPillMoreText}>+{moreSections} more</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actionRow}>
          {directoryEnabled ? (
            <TouchableOpacity
              style={styles.batchmateButton}
              onPress={() => openBatchDetail(item)}
            >
              <Text style={styles.batchmateText}>View Batchmates →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.directoryDisabledPill}>
              <FontAwesome name="lock" size={11} color="#475569" />
              <Text style={styles.directoryDisabledText}>Directory disabled</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => handleOpenYearbook(item)}
          >
            <FontAwesome name="book" size={12} color="#fdb813" />
            <Text style={styles.generateText}>Open Yearbook - {batchYear(item)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBatchDetail = () => {
    const detailSearch = detailQuery.trim().toLowerCase();
    const baseGroups = groupedBatchSections(selectedBatch);
    const detailDepartmentOptions = ['All Departments', ...baseGroups.map((group) => group.department)];
    const detailCourseOptions = ['All Courses', ...Array.from(new Set(baseGroups.flatMap((group) => group.courses.map((courseGroup) => courseGroup.course))))];
    const detailSectionOptions = ['All Sections', ...Array.from(new Set(baseGroups.flatMap((group) => group.courses.flatMap((courseGroup) => courseGroup.sections.map((section: any) => section?.name || 'Section')))))];
    const faceActive = detailFaceMatchedIds.size > 0;
    const groups = groupedBatchSections(selectedBatch).map((departmentGroup) => {
      const departmentMatches = String(departmentGroup.department || '').toLowerCase().includes(detailSearch);
      const selectedDepartmentMatch = detailDepartment === 'All Departments' || departmentGroup.department === detailDepartment;
      if (!selectedDepartmentMatch) return { ...departmentGroup, courses: [] };

      const courses = departmentGroup.courses.map((courseGroup) => {
        const courseMatches = String(courseGroup.course || '').toLowerCase().includes(detailSearch);
        const selectedCourseMatch = detailCourse === 'All Courses' || courseGroup.course === detailCourse;
        if (!selectedCourseMatch) return { ...courseGroup, sections: [] };

        const sections = courseGroup.sections.map((section: any) => {
          const sectionName = section?.name || 'Section';
          const sectionMatches = String(sectionName).toLowerCase().includes(detailSearch);
          const selectedSectionMatch = detailSection === 'All Sections' || sectionName === detailSection;
          if (!selectedSectionMatch) return { ...section, students: [] };

          const filteredStudents = sectionStudents(section).filter((student: any) => {
            const studentMatches = `${studentName(student)} ${studentId(student) || ''}`.toLowerCase().includes(detailSearch);
            const textMatch = !detailSearch || departmentMatches || courseMatches || sectionMatches || studentMatches;
            const faceMatch = !faceActive || studentMatchIds(student).some((id) => detailFaceMatchedIds.has(id));
            return textMatch && faceMatch;
          });

          return { ...section, students: filteredStudents };
        }).filter((section: any) => sectionStudents(section).length);

        return { ...courseGroup, sections };
      }).filter((courseGroup) => courseGroup.sections.length);

      return { ...departmentGroup, courses };
    }).filter((departmentGroup) => departmentGroup.courses.length);

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.detailHero}>
          <TouchableOpacity style={styles.detailBack} onPress={() => { setDetailQuery(''); setSelectedBatch(null); }}>
            <FontAwesome name="chevron-left" size={18} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.detailEyebrow}>National University Lipa</Text>
          <Text style={styles.detailTitle}>Your <Text style={styles.heroGold}>Batchmates</Text></Text>
          <Text style={styles.detailSubtitle}>Batch {batchYear(selectedBatch)} - {batchStudents(selectedBatch)} students - {batchSectionsCount(selectedBatch)} sections</Text>
          <TouchableOpacity style={styles.detailYearbookButton} onPress={() => handleOpenYearbook(selectedBatch)}>
            <FontAwesome name="book" size={12} color={COLORS.gold} />
            <Text style={styles.detailYearbookText}>Open Yearbook {batchYear(selectedBatch)}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailSearchShell}>
            <FontAwesome name="search" size={14} color="#94a3b8" />
            <TextInput
              style={styles.detailSearchInput}
              placeholder="Search department, course, section, or student"
              placeholderTextColor="#94a3b8"
              value={detailQuery}
              onChangeText={(value) => {
                setDetailQuery(value);
                setDetailFaceMatchedIds(new Set());
              }}
            />
            {detailQuery ? (
              <TouchableOpacity style={styles.detailSearchClear} onPress={() => setDetailQuery('')} activeOpacity={0.8}>
                <FontAwesome name="times" size={12} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.detailSearchCamera} onPress={handleDetailFaceSearch} disabled={detailFaceSearching} activeOpacity={0.82}>
              {detailFaceSearching ? <ActivityIndicator color={COLORS.gold} size="small" /> : <FontAwesome name="camera" size={14} color={COLORS.gold} />}
            </TouchableOpacity>
          </View>
          <View style={styles.detailFilterRow}>
            <TouchableOpacity style={[styles.detailFilterButton, styles.detailFilterDepartment]} onPress={() => setDetailFilterSheet('department')}>
              <View style={styles.detailFilterCopy}>
                <Text style={[styles.detailFilterLabel, styles.detailFilterDepartmentLabel]}>Department</Text>
                <Text style={[styles.detailFilterValue, styles.detailFilterDepartmentValue]} numberOfLines={1}>{detailDepartment}</Text>
              </View>
              <FontAwesome name="chevron-down" size={11} color={COLORS.navy} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.detailFilterButton, styles.detailFilterCourse]} onPress={() => setDetailFilterSheet('course')}>
              <View style={styles.detailFilterCopy}>
                <Text style={[styles.detailFilterLabel, styles.detailFilterCourseLabel]}>Course</Text>
                <Text style={[styles.detailFilterValue, styles.detailFilterCourseValue]} numberOfLines={1}>{detailCourse}</Text>
              </View>
              <FontAwesome name="chevron-down" size={11} color={COLORS.gold} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.detailFilterButton, styles.detailFilterSection]} onPress={() => setDetailFilterSheet('section')}>
              <View style={styles.detailFilterCopy}>
                <Text style={[styles.detailFilterLabel, styles.detailFilterSectionLabel]}>Section</Text>
                <Text style={[styles.detailFilterValue, styles.detailFilterSectionValue]} numberOfLines={1}>{detailSection}</Text>
              </View>
              <FontAwesome name="chevron-down" size={11} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          {faceActive ? (
            <View style={styles.faceBanner}>
              <Text style={styles.faceBannerText}>{detailFaceMatchedIds.size} face match{detailFaceMatchedIds.size === 1 ? '' : 'es'} found</Text>
              <TouchableOpacity onPress={() => setDetailFaceMatchedIds(new Set())}>
                <Text style={styles.faceBannerClear}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {groups.length ? groups.map((departmentGroup) => (
            <View key={departmentGroup.department} style={styles.departmentGroupCard}>
              <View style={styles.departmentHeader}>
                <View style={styles.departmentIcon}>
                  <FontAwesome name="institution" size={14} color={COLORS.gold} />
                </View>
                <View>
                  <Text style={styles.departmentTitle}>{departmentGroup.department}</Text>
                  <Text style={styles.departmentMeta}>{departmentGroup.studentCount} students</Text>
                </View>
              </View>

              {departmentGroup.courses.map((courseGroup) => (
                <View key={courseGroup.course} style={styles.courseGroupCard}>
                  <View style={styles.courseHeader}>
                    <FontAwesome name="graduation-cap" size={12} color={COLORS.gold} />
                    <Text style={styles.courseTitle}>{courseGroup.course}</Text>
                  </View>

                  {courseGroup.sections.map((section: any) => {
                    const students = sectionStudents(section);
                    return (
                      <View key={String(section?.id || section?.name)} style={styles.detailSectionCard}>
                        <View style={styles.detailSectionHeader}>
                          <View style={styles.detailSectionTitleRow}>
                            <FontAwesome name="cube" size={10} color={COLORS.gold} />
                            <Text style={styles.detailSectionTitle}>Section {section?.name || 'Section'}</Text>
                          </View>
                          <View style={styles.sectionCountBadge}>
                            <Text style={styles.sectionCountText}>{students.length} students</Text>
                          </View>
                        </View>

                        <View style={styles.studentGrid}>
                          {students.map((student: any) => {
                            const photo = studentPhoto(student);
                            return (
                              <TouchableOpacity
                                key={String(studentId(student) || studentName(student))}
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
                                  {photo ? (
                                    <Image source={photo} style={styles.detailStudentAvatarImage} contentFit="cover" />
                                  ) : (
                                    <Text style={styles.detailStudentInitials}>{studentInitials(student)}</Text>
                                  )}
                                </View>
                                <View style={styles.detailStudentCopy}>
                                  <Text style={styles.detailStudentName} numberOfLines={1}>{studentName(student)}</Text>
                                  <Text style={styles.detailStudentMeta} numberOfLines={1}>Batch {batchYear(selectedBatch)}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )) : (
            <View style={styles.emptyPanel}>
              <FontAwesome name="users" size={38} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Batchmates Found</Text>
              <Text style={styles.emptyText}>This batch has no sections or students yet.</Text>
            </View>
          )}
        </ScrollView>
        <BottomSheetFilter
          visible={detailFilterSheet === 'department'}
          title="Filter by department"
          options={detailDepartmentOptions.map((department) => ({ label: department, value: department }))}
          selected={detailDepartment}
          onSelect={(value) => { setDetailDepartment(value); setDetailFilterSheet(null); }}
          onApply={() => setDetailFilterSheet(null)}
          onClose={() => setDetailFilterSheet(null)}
        />
        <BottomSheetFilter
          visible={detailFilterSheet === 'course'}
          title="Filter by course"
          options={detailCourseOptions.map((course) => ({ label: course, value: course }))}
          selected={detailCourse}
          onSelect={(value) => { setDetailCourse(value); setDetailFilterSheet(null); }}
          onApply={() => setDetailFilterSheet(null)}
          onClose={() => setDetailFilterSheet(null)}
        />
        <BottomSheetFilter
          visible={detailFilterSheet === 'section'}
          title="Filter by section"
          options={detailSectionOptions.map((section) => ({ label: section, value: section }))}
          selected={detailSection}
          onSelect={(value) => { setDetailSection(value); setDetailFilterSheet(null); }}
          onApply={() => setDetailFilterSheet(null)}
          onClose={() => setDetailFilterSheet(null)}
        />
      </SafeAreaView>
    );
  };

  if (selectedBatch) {
    return renderBatchDetail();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <FlatList
        data={filteredBatches}
        keyExtractor={(item, index) => String(batchId(item) || index)}
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
              <Text style={styles.batchSummaryText}>{filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}</Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator color="#1d2b4b" style={{ marginTop: 34 }} /> : (
          <View style={styles.emptyPanel}>
            <FontAwesome name="graduation-cap" size={38} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Batches Found</Text>
            <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
          </View>
        )}
        ListFooterComponent={<View style={{ height: 110 }} />}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      />
      <BottomSheetFilter
        visible={deptSheetOpen}
        title="Filter by department"
        options={departmentFilters.map((department) => ({ label: department, value: department }))}
        selected={activeDepartment}
        onSelect={(value) => { setActiveDepartment(value); setDeptSheetOpen(false); }}
        onApply={() => setDeptSheetOpen(false)}
        onClose={() => setDeptSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 0 },
  hero: { backgroundColor: COLORS.navy, padding: 20, paddingTop: 54, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  heroEyebrow: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  heroGold: { color: COLORS.gold },
  heroSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 18, textAlign: 'center' },
  searchShell: { width: '100%', minHeight: 42, borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  searchInput: { flex: 1, color: COLORS.navy, fontSize: 13, marginLeft: 10 },
  searchCamera: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  departmentRow: { gap: 8, paddingRight: 22 },
  departmentPill: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  departmentPillActive: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  departmentPillText: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '900' },
  departmentPillTextActive: { color: '#1d2b4b' },
  filterBar: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  filterLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  filterLabel: { color: COLORS.muted, fontSize: 10, textTransform: 'uppercase', fontWeight: '900' },
  departmentDropdown: { minHeight: 46, borderRadius: 20, backgroundColor: COLORS.gold, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownLabel: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  dropdownValue: { color: COLORS.navy, fontSize: 11, fontWeight: '800', marginTop: 2 },
  statsRow: { marginTop: 8, flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  batchSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, marginBottom: 18 },
  batchSummaryIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  batchSummaryText: { color: '#64748b', fontSize: 13, fontWeight: '900', backgroundColor: '#eef2ff', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  batchCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, marginHorizontal: 14, marginBottom: 12, padding: 16 },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchYearTitle: { color: COLORS.navy, fontSize: 22, fontWeight: '900' },
  batchWatermark: { color: COLORS.gold, fontSize: 48, fontWeight: '900', opacity: 0.15, position: 'absolute', right: 0, top: -16 },
  batchIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1d2b4b', alignItems: 'center', justifyContent: 'center' },
  yearPill: { backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 },
  yearPillText: { color: '#64748b', fontSize: 12, fontWeight: '900' },
  batchTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  batchTitle: { color: COLORS.navy, fontSize: 15, lineHeight: 20, fontWeight: '900', marginTop: 4 },
  batchYearGold: { color: '#fdb813', fontSize: 23, fontWeight: '900' },
  departmentText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  sectionsPreview: { backgroundColor: '#F7F8FB', borderRadius: 10, padding: 10, marginTop: 10 },
  sectionPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectionPill: { backgroundColor: '#FFFFFF', borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  sectionPillText: { color: COLORS.navy, fontSize: 11, fontWeight: '800' },
  sectionPillMore: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  sectionPillMoreText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch', marginTop: 12 },
  batchmateButton: { flex: 1, minHeight: 40, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: COLORS.navy, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  batchmateText: { color: COLORS.navy, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  directoryDisabledPill: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, borderRadius: 10 },
  directoryDisabledText: { color: '#475569', fontSize: 11, fontWeight: '900' },
  generateButton: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.navy, paddingHorizontal: 10, borderRadius: 10 },
  generateText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  detailHero: { backgroundColor: COLORS.navy, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 26, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  detailBack: { position: 'absolute', left: 16, top: 48, width: 44, height: 44, borderRadius: 15, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  detailEyebrow: { color: 'rgba(255,255,255,0.42)', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  detailTitle: { color: '#ffffff', fontSize: 27, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  detailSubtitle: { color: 'rgba(255,255,255,0.66)', fontSize: 12, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  detailYearbookButton: { marginTop: 16, minHeight: 38, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,184,19,0.7)', paddingHorizontal: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  detailYearbookText: { color: COLORS.gold, fontSize: 11, fontWeight: '900' },
  detailContent: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 120 },
  detailSearchShell: { minHeight: 48, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbe4f0', flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6, marginBottom: 14 },
  detailSearchInput: { flex: 1, minWidth: 0, color: COLORS.navy, fontSize: 13, fontWeight: '800', marginLeft: 10 },
  detailSearchClear: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  detailSearchCamera: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,166,35,0.12)' },
  detailFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  detailFilterButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: '#dbe4f0', backgroundColor: '#ffffff', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  detailFilterCopy: { flex: 1, minWidth: 0 },
  detailFilterLabel: { color: '#94a3b8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 3 },
  detailFilterValue: { color: COLORS.navy, fontSize: 11, fontWeight: '900' },
  detailFilterDepartment: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  detailFilterDepartmentLabel: { color: COLORS.navy },
  detailFilterDepartmentValue: { color: COLORS.navy },
  detailFilterCourse: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  detailFilterCourseLabel: { color: '#FFFFFF' },
  detailFilterCourseValue: { color: COLORS.gold },
  detailFilterSection: { backgroundColor: '#FFFFFF', borderColor: COLORS.border },
  detailFilterSectionLabel: { color: COLORS.navy },
  detailFilterSectionValue: { color: COLORS.muted },
  faceBanner: { marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,166,35,0.35)', backgroundColor: 'rgba(245,166,35,0.12)', paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faceBannerText: { color: '#9a6100', fontSize: 12, fontWeight: '900' },
  faceBannerClear: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  departmentGroupCard: { backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 16 },
  departmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  departmentIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' },
  departmentTitle: { color: COLORS.navy, fontSize: 17, fontWeight: '900' },
  departmentMeta: { color: '#8fa0bf', fontSize: 11, fontWeight: '800', marginTop: 2 },
  courseGroupCard: { backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#edf2f7', padding: 10, marginTop: 10 },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  courseTitle: { color: '#3347d8', fontSize: 13, fontWeight: '900', flex: 1 },
  detailSectionCard: { backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#edf2f7', padding: 10, marginBottom: 10 },
  detailSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  detailSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  detailSectionTitle: { color: COLORS.navy, fontSize: 12, fontWeight: '900' },
  sectionCountBadge: { borderRadius: 999, backgroundColor: '#eef2ff', paddingHorizontal: 9, paddingVertical: 4 },
  sectionCountText: { color: '#3347d8', fontSize: 9, fontWeight: '900' },
  studentGrid: { gap: 8 },
  detailStudentCard: { minHeight: 62, borderRadius: 12, borderWidth: 1, borderColor: '#dbe4f0', backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 10 },
  detailStudentAvatar: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  detailStudentAvatarImage: { width: '100%', height: '100%' },
  detailStudentInitials: { color: COLORS.gold, fontSize: 14, fontWeight: '900' },
  detailStudentCopy: { flex: 1, minWidth: 0 },
  detailStudentName: { color: '#071b3d', fontSize: 13, fontWeight: '900' },
  detailStudentMeta: { color: '#8fa0bf', fontSize: 10, fontWeight: '800', marginTop: 2 },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 14 },
  emptyPanel: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 54, alignItems: 'center' },
  emptyTitle: { color: '#1d2b4b', fontSize: 18, fontWeight: '900', marginTop: 16 },
  emptyText: { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginTop: 6 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26, maxHeight: '82%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 999, backgroundColor: '#D1D5E0', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { color: COLORS.navy, fontSize: 13, fontWeight: '900', marginBottom: 10 },
  sheetScroll: { maxHeight: 420 },
  sheetOption: { minHeight: 40, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: COLORS.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetOptionText: { color: COLORS.navy, fontSize: 13 },
  sheetCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D1D5E0', alignItems: 'center', justifyContent: 'center' },
  sheetCircleActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  sheetApply: { backgroundColor: COLORS.navy, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  sheetApplyText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
