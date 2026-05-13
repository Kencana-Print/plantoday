import axios from 'axios';

export const PUBLIC_API_ORIGIN = 'http://103.94.238.252:3005'; //server produksi
// export const PUBLIC_API_ORIGIN = 'http://10.0.2.2:3001'; // lokal android emulator
export const PUBLIC_IMAGE_READ_ORIGIN = 'http://103.94.238.252:8182';
export const PUBLIC_IMAGE_UPLOAD_ORIGIN = 'http://103.94.238.252:8080';
export const PUBLIC_IMAGE_BASE_PATH = '/images/mintaharga';
const RELEASE_API_BASE_URL = `${PUBLIC_API_ORIGIN}/api`;
const DEV_API_BASE_URL = `${PUBLIC_API_ORIGIN}/api`;
const ACTIVE_API_BASE_URL = __DEV__ ? DEV_API_BASE_URL : RELEASE_API_BASE_URL;

const API = axios.create({
  baseURL: ACTIVE_API_BASE_URL,
  timeout: 30000,
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const inFlightMutationKeys = new Set<string>();

const safeSerialize = (value: unknown) => {
  try {
    return JSON.stringify(value || {});
  } catch {
    return String(value || '');
  }
};

const buildRequestKey = (config: any) => {
  const method = String(config?.method || 'get').toLowerCase();
  const url = String(config?.url || '');
  const params = safeSerialize(config?.params);
  const data = safeSerialize(config?.data);
  return `${method}|${url}|${params}|${data}`;
};

API.interceptors.request.use(
  config => {
    const requestConfig = config as any;
    const method = String(requestConfig?.method || 'get').toLowerCase();
    const skipDedupe = Boolean(requestConfig?.skipDedupe);

    if (!MUTATING_METHODS.has(method) || skipDedupe) {
      return requestConfig;
    }

    const requestKey = buildRequestKey(requestConfig);
    if (inFlightMutationKeys.has(requestKey)) {
      const duplicateError: any = new Error(
        'Permintaan sedang diproses. Mohon tunggu.',
      );
      duplicateError.isDuplicateRequest = true;
      duplicateError.config = requestConfig;
      return Promise.reject(duplicateError);
    }

    inFlightMutationKeys.add(requestKey);
    requestConfig.__mutationRequestKey = requestKey;
    return requestConfig;
  },
  error => Promise.reject(error),
);

API.interceptors.response.use(
  response => {
    const key = (response?.config as any)?.__mutationRequestKey;
    if (key) {
      inFlightMutationKeys.delete(key);
    }
    return response;
  },
  error => {
    const key = (error?.config as any)?.__mutationRequestKey;
    if (key) {
      inFlightMutationKeys.delete(key);
    }
    return Promise.reject(error);
  },
);

export default API;
