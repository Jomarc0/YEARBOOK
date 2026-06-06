import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { acceptConsent, fetchCurrentUser, getErrorMessage, register, saveToken, sendOtp, STORAGE_BASE_URL, verifyOtp, verifyStudent } from '../lib/api';

const SCHOOLS = [
  { key: 'SACE', courses: ['Bachelor of Science in Architecture', 'Bachelor of Science in Civil Engineering', 'Bachelor of Science in Computer Science', 'Bachelor of Science in Information Technology', 'Bachelor of Multimedia Arts'] },
  { key: 'SAHS', courses: ['Bachelor of Science in Nursing', 'Bachelor of Science in Medical Technology', 'Bachelor of Science in Psychology'] },
  { key: 'SABM', courses: ['Bachelor of Science in Accountancy', 'Bachelor of Science in Business Administration - Financial Management', 'Bachelor of Science in Business Administration - Marketing Management', 'Bachelor of Science in Tourism Management'] },
  { key: 'SGS', courses: ['Master in Management'] },
  { key: 'SHS', courses: ['ABM', 'STEM', 'HUMSS'] },
];

const COURSES = SCHOOLS.flatMap((school) => school.courses);
const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = Array.from({ length: CURRENT_YEAR + 5 - 1990 + 1 }, (_, index) => String(CURRENT_YEAR + 5 - index));
const emptyOtp = ['', '', '', '', '', ''];

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    email: '',
    course: '',
    graduation_year: '',
    password: '',
    password_confirmation: '',
  });
  const [verifyState, setVerifyState] = useState('idle');
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [otp, setOtp] = useState(emptyOtp.join(''));
  const [consentChecked, setConsentChecked] = useState(true);
  const [loading, setLoading] = useState(false);

  const intent = verifyState === 'found' ? 'graduate' : 'browse';

  const batchPreview = useMemo(() => form.graduation_year ? `Batch ${form.graduation_year}` : 'Select batch', [form.graduation_year]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'graduation_year' ? { batch: value } : {}),
    }));

    if (['first_name', 'last_name', 'student_id'].includes(field)) {
      setVerifyState('idle');
      setVerifiedStudent(null);
    }
  };

  const handleVerifyStudent = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.student_id.trim()) {
      Alert.alert('Identity required', 'Enter first name, last name, and student ID before verifying.');
      return;
    }

    try {
      setVerifyState('loading');
      const payload = await verifyStudent({
        student_no: form.student_id.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });

      if (payload?.found) {
        setVerifyState('found');
        setVerifiedStudent(payload.student);
        setForm((current) => ({
          ...current,
          email: current.email || payload.student?.email || '',
          course: current.course || payload.student?.course || '',
          graduation_year: current.graduation_year || String(payload.student?.graduation_year || ''),
        }));
      } else {
        setVerifyState('not_found');
        setVerifiedStudent(null);
        Alert.alert('No yearbook match', payload?.message || 'You can still register as a browse account.');
      }
    } catch (error) {
      setVerifyState('idle');
      Alert.alert('Verification failed', getErrorMessage(error, 'Unable to verify student record.'));
    }
  };

  const validate = () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.student_id.trim()) return 'First name, last name, and student ID are required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!form.course) return 'Course is required.';
    if (!form.graduation_year) return 'Batch year is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.password_confirmation) return 'Passwords do not match.';
    if (!consentChecked) return 'Privacy consent is required.';
    return '';
  };

  const handleRegister = async () => {
    const message = validate();
    if (message) {
      Alert.alert('Check your form', message);
      return;
    }

    try {
      setLoading(true);
      await register({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        student_id: form.student_id.trim(),
        email: form.email.trim(),
        graduation_year: Number(form.graduation_year),
        batch: form.graduation_year,
        intent,
        consent_accepted: true,
      });
      await sendOtp(form.email.trim());
      setStep('otp');
      setOtp('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Registration failed', getErrorMessage(error, 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!consentChecked) {
      Alert.alert('Privacy consent required', 'Please accept the Privacy Policy before continuing with Google.');
      return;
    }

    try {
      setLoading(true);
      const redirectUri = Linking.createURL('/sso/callback');
      const authUrl = `${STORAGE_BASE_URL}/auth/google/redirect?client=mobile&redirect_uri=${encodeURIComponent(redirectUri)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success' || !result.url) return;

      const parsed = Linking.parse(result.url);
      const token = parsed.queryParams?.token;
      const error = parsed.queryParams?.error;

      if (error || !token || Array.isArray(token)) {
        throw new Error('Google sign-up failed. Please try again.');
      }

      await saveToken(token);
      await fetchCurrentUser();
      await acceptConsent('1.0').catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Google sign-up failed', getErrorMessage(error, 'Unable to continue with Google.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Incomplete code', 'Please enter the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(form.email.trim(), otp);
      await acceptConsent('1.0').catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Account verified', 'You can now continue to your yearbook.');
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Verification failed', getErrorMessage(error, 'Invalid or expired OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const cycleCourse = () => {
    const currentIndex = COURSES.indexOf(form.course);
    updateField('course', COURSES[(currentIndex + 1) % COURSES.length]);
  };

  const cycleBatch = () => {
    const currentIndex = BATCH_YEARS.indexOf(form.graduation_year);
    updateField('graduation_year', BATCH_YEARS[(currentIndex + 1) % BATCH_YEARS.length]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, title: 'Register' }} />
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brandKicker}>SINAG-BUGHAW</Text>
            <View style={styles.iconContainer}>
              <FontAwesome name={step === 'otp' ? 'envelope-open-o' : 'user-plus'} size={30} color="#1d2b4b" />
            </View>
            <Text style={styles.title}>{step === 'otp' ? 'Verify Your Email' : 'Create Your Account'}</Text>
            <Text style={styles.subtitle}>
              {step === 'otp'
                ? `Enter the 6-digit code sent to ${form.email}.`
                : 'We will check your yearbook record and link your graduate profile when found.'}
            </Text>
          </View>

          {step === 'otp' ? (
            <View style={styles.formCard}>
              <Text style={styles.label}>VERIFICATION CODE</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome name="shield" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="123456" value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify and Continue'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => sendOtp(form.email.trim())} disabled={loading}>
                <Text style={styles.secondaryButtonText}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.identityCard}>
                <Text style={styles.cardTitle}>IDENTITY</Text>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>FIRST NAME</Text>
                    <TextInput style={styles.boxInput} value={form.first_name} onChangeText={(value) => updateField('first_name', value)} placeholder="Juan" />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>LAST NAME</Text>
                    <TextInput style={styles.boxInput} value={form.last_name} onChangeText={(value) => updateField('last_name', value)} placeholder="Dela Cruz" />
                  </View>
                </View>
                <Text style={styles.label}>STUDENT ID</Text>
                <TextInput style={styles.boxInput} value={form.student_id} onChangeText={(value) => updateField('student_id', value)} placeholder="2021-00123" />

                <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyStudent} disabled={verifyState === 'loading'}>
                  <FontAwesome name={verifyState === 'found' ? 'graduation-cap' : 'search'} size={14} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>{verifyState === 'loading' ? 'Checking...' : verifyState === 'found' ? 'Graduate Match Found' : 'Verify Yearbook Record'}</Text>
                </TouchableOpacity>

                {verifiedStudent ? (
                  <Text style={styles.matchText}>{verifiedStudent.first_name} {verifiedStudent.last_name} - {verifiedStudent.course}</Text>
                ) : verifyState === 'not_found' ? (
                  <Text style={styles.browseText}>No match found. This will create a browse account.</Text>
                ) : null}
              </View>

              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome name="envelope-o" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="student@nu-lipa.edu.ph" value={form.email} onChangeText={(value) => updateField('email', value)} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <Text style={styles.label}>COURSE / PROGRAM</Text>
              <TouchableOpacity style={styles.selector} onPress={cycleCourse}>
                <Text style={[styles.selectorText, !form.course && styles.placeholderText]}>{form.course || 'Tap to select course'}</Text>
                <FontAwesome name="refresh" size={14} color="#1d2b4b" />
              </TouchableOpacity>

              <Text style={styles.label}>BATCH</Text>
              <TouchableOpacity style={styles.selector} onPress={cycleBatch}>
                <Text style={[styles.selectorText, !form.graduation_year && styles.placeholderText]}>{batchPreview}</Text>
                <FontAwesome name="refresh" size={14} color="#1d2b4b" />
              </TouchableOpacity>

              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome name="lock" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="At least 8 characters" value={form.password} onChangeText={(value) => updateField('password', value)} secureTextEntry />
              </View>

              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome name="lock" size={18} color="#8E8E93" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Re-enter password" value={form.password_confirmation} onChangeText={(value) => updateField('password_confirmation', value)} secureTextEntry />
              </View>

              <TouchableOpacity style={styles.checkRow} onPress={() => setConsentChecked((value) => !value)}>
                <FontAwesome name={consentChecked ? 'check-square' : 'square-o'} size={20} color="#1d2b4b" />
                <Text style={styles.checkText}>I accept the Privacy Policy under RA 10173.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Create My Account'}</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign up with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup} disabled={loading}>
                <FontAwesome name="google" size={17} color="#3f51b5" />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'form' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fe' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 38, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  brandKicker: { color: '#fdb813', backgroundColor: '#1d2b4b', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 18 },
  iconContainer: { width: 76, height: 76, backgroundColor: '#eef2ff', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 27, fontWeight: '900', color: '#1d2b4b', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 21 },
  form: { flex: 1 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  identityCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 18, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 3 },
  cardTitle: { color: '#1d2b4b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 8, marginTop: 10, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, minHeight: 58, paddingHorizontal: 16, marginBottom: 8 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  boxInput: { backgroundColor: '#f4f7fe', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, minHeight: 52, paddingHorizontal: 14, fontSize: 15, color: '#1C1C1E' },
  verifyButton: { backgroundColor: '#1d2b4b', borderRadius: 14, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  verifyButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  matchText: { color: '#16803C', fontSize: 12, fontWeight: '700', marginTop: 10 },
  browseText: { color: '#8E8E93', fontSize: 12, marginTop: 10 },
  selector: { minHeight: 58, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  selectorText: { flex: 1, color: '#1C1C1E', fontSize: 14, marginRight: 10 },
  placeholderText: { color: '#C7C7CC' },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  checkText: { flex: 1, marginLeft: 10, color: '#1C1C1E', fontSize: 13, lineHeight: 19 },
  button: { minHeight: 58, backgroundColor: '#1d2b4b', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  buttonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  googleButton: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  googleButtonText: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  secondaryButton: { minHeight: 54, backgroundColor: '#FFFFFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#1d2b4b' },
  secondaryButtonText: { color: '#1d2b4b', fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: '#8E8E93', marginRight: 4 },
  footerLink: { fontSize: 14, fontWeight: 'bold', color: '#1d2b4b' },
});
