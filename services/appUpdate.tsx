import DeviceInfo from 'react-native-device-info';
import { Linking, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

const UPDATE_MANIFEST_URL = 'http://103.94.238.252:8182/releases/latest.json';
const UPDATE_FETCH_TIMEOUT_MS = 15000;

export type AppUpdateManifest = {
  versionCode: number;
  versionName: string;
  mandatory: boolean;
  apkUrl: string;
  sha256?: string;
  releaseDate?: string;
  notes?: string;
};

export type AppUpdateCheckResult = {
  manifest: AppUpdateManifest | null;
  failed: boolean;
};

export type DownloadUpdateResult =
  | { status: 'opened-download-location' }
  | { status: 'downloaded-no-installer' }
  | { status: 'failed-network' }
  | { status: 'failed-other' };

const openDownloadedApkLocation = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await Linking.sendIntent('android.intent.action.VIEW_DOWNLOADS');
    return true;
  } catch {
    return false;
  }
};

const toNumber = (value: string | number | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildManifestRequestUrl = () => {
  const separator = UPDATE_MANIFEST_URL.includes('?') ? '&' : '?';
  return `${UPDATE_MANIFEST_URL}${separator}t=${Date.now()}`;
};

const fetchLatestManifest = async (): Promise<{
  manifest: Partial<AppUpdateManifest> | null;
  failed: boolean;
}> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPDATE_FETCH_TIMEOUT_MS);

  try {
    const requestUrl = buildManifestRequestUrl();
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.info('[AppUpdate] Manifest request failed', {
        status: response.status,
        statusText: response.statusText,
      });
      return { manifest: null, failed: true };
    }

    const manifest = (await response.json()) as Partial<AppUpdateManifest>;
    console.info('[AppUpdate] Manifest fetched', {
      versionCode: manifest?.versionCode,
      versionName: manifest?.versionName,
      mandatory: manifest?.mandatory,
    });

    return { manifest, failed: false };
  } catch (error: any) {
    const message = String(error?.message || 'Unknown error');
    console.info('[AppUpdate] Manifest request exception', { message });
    return { manifest: null, failed: true };
  } finally {
    clearTimeout(timeout);
  }
};

export const checkAppUpdate = async (): Promise<AppUpdateManifest | null> => {
  try {
    const { manifest, failed } = await fetchLatestManifest();
    if (failed || !manifest) {
      return null;
    }

    const latestVersionCode = toNumber(manifest.versionCode);
    const currentVersionCode = toNumber(DeviceInfo.getBuildNumber());

    console.info('[AppUpdate] Comparing version', {
      currentVersionCode,
      latestVersionCode,
    });

    if (!latestVersionCode || latestVersionCode <= currentVersionCode) {
      return null;
    }

    if (!manifest.apkUrl || !manifest.versionName) {
      return null;
    }

    return {
      versionCode: latestVersionCode,
      versionName: manifest.versionName,
      mandatory: Boolean(manifest.mandatory),
      apkUrl: manifest.apkUrl,
      sha256: manifest.sha256,
      releaseDate: manifest.releaseDate,
      notes: manifest.notes,
    };
  } catch {
    return null;
  }
};

export const checkAppUpdateWithStatus =
  async (): Promise<AppUpdateCheckResult> => {
    try {
      const { manifest, failed } = await fetchLatestManifest();
      if (failed || !manifest) {
        return { manifest: null, failed: true };
      }

      const latestVersionCode = toNumber(manifest.versionCode);
      const currentVersionCode = toNumber(DeviceInfo.getBuildNumber());

      console.info('[AppUpdate] Comparing version (status)', {
        currentVersionCode,
        latestVersionCode,
      });

      if (!latestVersionCode || latestVersionCode <= currentVersionCode) {
        return { manifest: null, failed: false };
      }

      if (!manifest.apkUrl || !manifest.versionName) {
        return { manifest: null, failed: true };
      }

      return {
        manifest: {
          versionCode: latestVersionCode,
          versionName: manifest.versionName,
          mandatory: Boolean(manifest.mandatory),
          apkUrl: manifest.apkUrl,
          sha256: manifest.sha256,
          releaseDate: manifest.releaseDate,
          notes: manifest.notes,
        },
        failed: false,
      };
    } catch {
      return { manifest: null, failed: true };
    }
  };

export const downloadUpdateApk = async (
  manifest: AppUpdateManifest,
  onProgress?: (percent: number) => void,
): Promise<DownloadUpdateResult> => {
  if (Platform.OS !== 'android') {
    return { status: 'failed-other' };
  }

  try {
    console.info('[AppUpdate] Download update started', {
      versionName: manifest.versionName,
      versionCode: manifest.versionCode,
    });
    onProgress?.(0);

    const fileName =
      manifest.apkUrl.split('/').pop() ||
      `PlanToday-v${manifest.versionName}.apk`;

    const task = ReactNativeBlobUtil.config({
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        mediaScannable: true,
        title: fileName,
        description: `Mengunduh update ${manifest.versionName}`,
        mime: 'application/vnd.android.package-archive',
      },
    }).fetch('GET', manifest.apkUrl);

    task.progress({ interval: 150 }, (received, total) => {
      if (!total || total <= 0) {
        return;
      }

      const percent = Math.min(
        100,
        Math.max(0, Math.round((received / total) * 100)),
      );
      onProgress?.(percent);
    });

    const response = await task;
    onProgress?.(100);

    const downloadedPath =
      typeof response?.path === 'function' ? response.path() : '';

    if (downloadedPath) {
      console.info('[AppUpdate] Download finished', { downloadedPath });
      const openedLocation = await openDownloadedApkLocation();

      if (openedLocation) {
        return { status: 'opened-download-location' };
      }

      return { status: 'downloaded-no-installer' };
    }

    // Download manager may finish without a resolvable path on some devices.
    return { status: 'downloaded-no-installer' };
  } catch (error: any) {
    const message = String(error?.message || '').toLowerCase();
    const isNetworkError =
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('unable to resolve host') ||
      message.includes('failed to connect') ||
      message.includes('connection');

    console.info('[AppUpdate] Download failed', {
      message: String(error?.message || 'Unknown error'),
      isNetworkError,
    });

    return { status: isNetworkError ? 'failed-network' : 'failed-other' };
  }
};
