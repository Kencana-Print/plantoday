/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuth } from '../../context/authContext';
import { checkAppUpdateWithStatus } from '../../services/appUpdate';
import { THEME } from '../theme';
import {
  clearRememberedUsername,
  getRememberedUsername,
  getRememberMe,
  setRememberedUsername,
  setRememberMe as persistRememberMe,
} from '../../services/rememberMeStorage';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appVersion, setAppVersion] = useState('Versi -');
  const [updateStatus, setUpdateStatus] = useState<
    'checking' | 'latest' | 'update_available' | 'failed_check'
  >('checking');
  const [latestVersionLabel, setLatestVersionLabel] = useState<string | null>(
    null,
  );
  const [rememberMe, setRememberMe] = useState(false);

  const { setUser, setToken } = useAuth();

  const canLogin = useMemo(() => {
    return username.trim().length > 0 && password.length > 0 && !loading;
  }, [username, password, loading]);

  useEffect(() => {
    const checkDevice = async () => {
      try {
        const rememberFlag = await getRememberMe();
        setRememberMe(rememberFlag);

        // Remember Me hanya aktif saat checkbox true.
        // Jika false, jangan lakukan autofill username sama sekali.
        if (!rememberFlag) {
          setUsername('');
          return;
        }

        const rememberedUsername = await getRememberedUsername();
        if (rememberedUsername) {
          setUsername(rememberedUsername);
          return;
        }

        const deviceId = await DeviceInfo.getAndroidId();
        const res = await api.post('/check-device', { deviceId });
        if (res.data?.success && res.data?.username) {
          const resolvedUsername = String(res.data.username).trim();
          setUsername(resolvedUsername);
          await setRememberedUsername(resolvedUsername);
        }
      } catch {}
    };
    checkDevice();
  }, []);

  useEffect(() => {
    const localVersion = DeviceInfo.getVersion();
    const localBuild = DeviceInfo.getBuildNumber();
    setAppVersion(`Versi ${localVersion} (build ${localBuild})`);

    const checkUpdateStatus = async () => {
      setUpdateStatus('checking');
      setLatestVersionLabel(null);

      try {
        const { manifest: updateManifest, failed } =
          await checkAppUpdateWithStatus();

        if (failed) {
          setUpdateStatus('failed_check');
          return;
        }

        if (updateManifest) {
          setUpdateStatus('update_available');
          setLatestVersionLabel(
            `Versi terbaru ${updateManifest.versionName} (build ${updateManifest.versionCode})`,
          );
          return;
        }

        setUpdateStatus('latest');
      } catch {
        setUpdateStatus('failed_check');
      }
    };

    checkUpdateStatus();

    const unsubscribeFocus = navigation.addListener('focus', () => {
      checkUpdateStatus();
    });

    return unsubscribeFocus;
  }, [navigation]);

  const updateStatusText = useMemo(() => {
    switch (updateStatus) {
      case 'checking':
        return 'Memeriksa pembaruan aplikasi...';
      case 'latest':
        return 'Aplikasi sudah versi terbaru';
      case 'update_available':
        return latestVersionLabel
          ? `Update tersedia • ${latestVersionLabel}`
          : 'Update tersedia';
      case 'failed_check':
      default:
        return 'Gagal memeriksa pembaruan';
    }
  }, [latestVersionLabel, updateStatus]);

  const handleLogin = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const deviceId = await DeviceInfo.getAndroidId();
      const versiApp = `V. ${DeviceInfo.getVersion()}`;
      const res = await api.post('/login', {
        username: username.trim(),
        password,
        deviceId,
        versiApp,
      });

      if (!res.data?.success) {
        Toast.show({
          type: 'glassError',
          text1: 'Login Gagal',
          text2: res.data.message,
        });
        return;
      }

      const normalizedUsername = username.trim();
      await persistRememberMe(rememberMe);
      if (rememberMe) {
        await setRememberedUsername(normalizedUsername);
      } else {
        await clearRememberedUsername();
      }

      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Gagal koneksi ke server';
      Toast.show({
        type: 'glassError',
        text1: 'Sistem Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[THEME.bgTop, THEME.bgBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Svg width={240} height={55} viewBox="0 0 240 55">
              <Defs>
                <SvgGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#4F46E5" />
                  <Stop offset="100%" stopColor="#06B6D4" />
                </SvgGradient>
              </Defs>
              <SvgText
                fill="url(#loginGrad)"
                fontSize="40"
                fontWeight="900"
                letterSpacing="0.6"
                x="25"
                y="42"
              >
                PlanToday
              </SvgText>
            </Svg>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>LOGIN</Text>

            {/* Username */}
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="..."
                placeholderTextColor={THEME.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="***"
                placeholderTextColor={THEME.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                style={styles.input}
                editable={!loading}
                returnKeyType="done"
              />

              <TouchableOpacity
                onPress={() => setShowPass(v => !v)}
                activeOpacity={0.85}
                disabled={loading}
              >
                <MaterialIcons
                  name={showPass ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={THEME.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.rememberWrap}
              onPress={() => setRememberMe(v => !v)}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View
                style={[styles.checkbox, rememberMe && styles.checkboxActive]}
              >
                {rememberMe ? <Text style={styles.checkboxTick}>✓</Text> : null}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canLogin}
              activeOpacity={0.9}
              style={{ marginTop: 8, opacity: canLogin ? 1 : 0.65 }}
            >
              <LinearGradient
                colors={[THEME.primary, THEME.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.footerLink}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.footerText}>
                Belum punya akun?{' '}
                <Text style={styles.footerLinkBold}>Register</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.bottomNote}>{appVersion}</Text>
            <Text
              style={[
                styles.updateStatusNote,
                updateStatus === 'update_available' &&
                  styles.updateStatusAvailable,
                updateStatus === 'failed_check' && styles.updateStatusFailed,
              ]}
            >
              {updateStatusText}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 54 : 10,
    paddingBottom: 24,
  },

  /* Header */
  header: { alignItems: 'center', marginBottom: 18 },
  appTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: 0.6,
  },

  formCard: {
    backgroundColor: THEME.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: THEME.line,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  formTitle: {
    color: THEME.muted,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  label: {
    color: THEME.muted,
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  /* Input */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.soft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.line,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 45,
  },

  input: { flex: 1, color: THEME.ink, fontSize: 16, fontWeight: '600' },

  showBtnText: {
    color: THEME.muted,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.4,
  },

  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: -2,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },

  checkboxTick: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },

  rememberText: {
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Primary button */
  loginButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  footerLink: { marginTop: 14, alignItems: 'center' },
  footerText: { color: THEME.muted, fontSize: 13, fontWeight: '500' },
  footerLinkBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: THEME.ink,
  },

  bottomNote: {
    marginTop: 18,
    textAlign: 'center',
    color: 'rgba(100,116,139,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },

  updateStatusNote: {
    marginTop: 6,
    textAlign: 'center',
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '500',
  },

  updateStatusAvailable: {
    color: '#B45309',
  },

  updateStatusFailed: {
    color: THEME.danger,
  },
});
