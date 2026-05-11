import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_REMEMBER_ME = 'auth.remember_me';
const KEY_REMEMBERED_USERNAME = 'auth.remembered_username';

export async function getRememberMe(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(KEY_REMEMBER_ME);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setRememberMe(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_REMEMBER_ME, value ? '1' : '0');
  } catch {}
}

export async function getRememberedUsername(): Promise<string> {
  try {
    const value = await AsyncStorage.getItem(KEY_REMEMBERED_USERNAME);
    return String(value || '').trim();
  } catch {
    return '';
  }
}

export async function setRememberedUsername(username: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_REMEMBERED_USERNAME, String(username || '').trim());
  } catch {}
}

export async function clearRememberedUsername(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY_REMEMBERED_USERNAME);
  } catch {}
}

