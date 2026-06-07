import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { acceptConsent, fetchCurrentUser, forgotPassword, getAppConfig, getConsentStatus, getErrorMessage, login, resetPassword, saveToken, sendOtp, STORAGE_BASE_URL, unwrap, verifyOtp, verifyResetOtp } from '../lib/api';

const emptyOtp = ['', '', '', '', '', ''];

export default function Login() {
  const router = useRouter();
  const otpRefs = useRef([]);
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(emptyOtp);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [appConfig, setAppConfig] = useState(null);

  const yearbookName = appConfig?.yearbook_name || 'Sinag-Bughaw Digital Yearbook';
  const brandName = (yearbookName.replace(/\s*Digital Yearbook/i, '') || 'Sinag-Bughaw').toUpperCase();
  const schoolName = appConfig?.school_name || 'NU Lipa';

  useEffect(() => {
    let active = true;

    getAppConfig()
      .then((response) => {
        if (active) setAppConfig(unwrap(response));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      await sendOtp(email.trim());
      setStep('otp');
      setOtp(emptyOtp);
      setTimeout(() => otpRefs.current[0]?.focus?.(), 150);
    } catch (error) {
      Alert.alert('Login failed', getErrorMessage(error, 'Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
        throw new Error('Google sign-in failed. Please try again.');
      }

      await saveToken(token);
      await fetchCurrentUser();
      const consent = await getConsentStatus().catch(() => ({ accepted: true }));
      if (consent?.accepted === false) {
        setShowConsent(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      Alert.alert('Google sign-in failed', getErrorMessage(error, 'Unable to sign in with Google.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus?.();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete code', 'Please enter all 6 OTP digits.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(email.trim(), code);
      await fetchCurrentUser();
      const consent = await getConsentStatus().catch(() => ({ accepted: true }));
      if (consent?.accepted === false) {
        setShowConsent(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      setOtp(emptyOtp);
      otpRefs.current[0]?.focus?.();
      Alert.alert('Verification failed', getErrorMessage(error, 'Invalid or expired OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConsent = async () => {
    if (!consentChecked) {
      Alert.alert('Consent required', 'Please confirm that you understand and accept the privacy policy.');
      return;
    }

    try {
      setLoading(true);
      await acceptConsent('1.0');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Consent failed', getErrorMessage(error, 'Unable to save your consent.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await sendOtp(email.trim());
      setOtp(emptyOtp);
      Alert.alert('OTP sent', 'A new code has been sent to your email.');
    } catch (error) {
      Alert.alert('Resend failed', getErrorMessage(error, 'Unable to resend OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const startPasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your email address first.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setOtp(emptyOtp);
      setStep('resetOtp');
      setTimeout(() => otpRefs.current[0]?.focus?.(), 150);
      Alert.alert('Reset code sent', 'Check your email for the reset OTP.');
    } catch (error) {
      Alert.alert('Reset failed', getErrorMessage(error, 'Unable to send reset OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyPasswordResetOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete code', 'Please enter all 6 OTP digits.');
      return;
    }

    try {
      setLoading(true);
      await verifyResetOtp(email.trim(), code);
      setStep('resetPassword');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setOtp(emptyOtp);
      otpRefs.current[0]?.focus?.();
      Alert.alert('Verification failed', getErrorMessage(error, 'Invalid or expired reset OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async () => {
    const code = otp.join('');
    if (!newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password mismatch', 'New password and confirmation must match.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        email: email.trim(),
        otp: code,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setStep('form');
      setPassword('');
      setOtp(emptyOtp);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password updated', 'You can now sign in with your new password.');
    } catch (error) {
      Alert.alert('Reset failed', getErrorMessage(error, 'Unable to reset your password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false, title: 'Login' }} />
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.brandKicker}>{brandName}</Text>
            <View style={styles.iconContainer}>
              <FontAwesome name={step === 'otp' ? 'envelope-open-o' : 'lock'} size={30} color="#1d2b4b" />
            </View>
            <Text style={styles.title}>{showConsent ? 'Privacy Agreement' : step === 'otp' || step === 'resetOtp' ? 'Check Your Email' : step === 'resetPassword' ? 'Create New Password' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>
              {showConsent
                ? 'Review and accept the privacy notice to continue.'
                : step === 'otp'
                  ? `Enter the 6-digit code sent to ${email}.`
                  : step === 'resetOtp'
                    ? `Enter the reset code sent to ${email}.`
                    : step === 'resetPassword'
                      ? `Choose a new password for your ${brandName} account.`
                  : `Sign in to your ${brandName} account.`}
            </Text>
          </View>

          {showConsent ? (
            <View style={styles.consentCard}>
              <Text style={styles.consentTitle}>Data Privacy Act of 2012</Text>
              <Text style={styles.consentText}>
                {schoolName} may process your name, photograph, course, academic details, and uploaded content for the {yearbookName}. Your data is stored securely and used only for yearbook platform features.
              </Text>
              <TouchableOpacity style={styles.checkRow} onPress={() => setConsentChecked((value) => !value)}>
                <FontAwesome name={consentChecked ? 'check-square' : 'square-o'} size={20} color="#1d2b4b" />
                <Text style={styles.checkText}>I have read and accept the Privacy Policy.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleAcceptConsent} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'I Accept and Continue'}</Text>
              </TouchableOpacity>
            </View>
          ) : step === 'form' ? (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="envelope-o" size={18} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="you@nu-lipa.edu.ph" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#C7C7CC" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="key" size={18} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#C7C7CC" />
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Sign In'}</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={loading}>
                <FontAwesome name="google" size={17} color="#3f51b5" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton} onPress={startPasswordReset} disabled={loading}>
                <Text style={styles.footerLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          ) : step === 'resetPassword' ? (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NEW PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="key" size={18} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholderTextColor="#C7C7CC" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome name="lock" size={18} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor="#C7C7CC" />
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={submitPasswordReset} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Reset Password'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton} onPress={() => setStep('form')}>
                <Text style={styles.footerLink}>Back to login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(index, value)}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.button} onPress={step === 'resetOtp' ? verifyPasswordResetOtp : handleVerifyOtp} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Verifying...' : step === 'resetOtp' ? 'Verify Reset Code' : 'Verify and Sign In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={step === 'resetOtp' ? startPasswordReset : handleResend} disabled={loading}>
                <Text style={styles.secondaryButtonText}>Resend Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton} onPress={() => setStep('form')}>
                <Text style={styles.footerLink}>Back to login</Text>
              </TouchableOpacity>
            </View>
          )}

          {!showConsent && step === 'form' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.footerLink}>Register</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 42, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  brandKicker: { color: '#fdb813', backgroundColor: '#1d2b4b', overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 18 },
  iconContainer: { width: 78, height: 78, backgroundColor: '#eef2ff', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 28, fontWeight: '900', color: '#1d2b4b', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
  form: { flex: 1 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, minHeight: 58, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  button: { minHeight: 58, backgroundColor: '#1d2b4b', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  secondaryButton: { minHeight: 54, backgroundColor: '#FFFFFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#1d2b4b' },
  secondaryButtonText: { color: '#1d2b4b', fontWeight: 'bold' },
  textButton: { alignItems: 'center', padding: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  googleButton: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  googleButtonText: { color: '#1d2b4b', fontSize: 14, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 34 },
  footerText: { fontSize: 14, color: '#8E8E93', marginRight: 4 },
  footerLink: { fontSize: 14, fontWeight: 'bold', color: '#1d2b4b' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpInput: { width: 46, height: 54, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 14, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  otpInputFilled: { borderColor: '#1d2b4b', backgroundColor: '#eef2ff' },
  consentCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  consentTitle: { color: '#1d2b4b', fontSize: 17, fontWeight: 'bold', marginBottom: 10 },
  consentText: { color: '#4A4A4A', fontSize: 14, lineHeight: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  checkText: { flex: 1, marginLeft: 10, color: '#1C1C1E', fontSize: 13, lineHeight: 19 },
});
