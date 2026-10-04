import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useLoginGateStore } from '@/lib/viewer';
import { getGuestAccess } from '@/lib/access';
import { suppressErrorToasts } from '@/components/ui/Toast';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string>;
}

const rawClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const GUEST_BLOCKED_CODE = 'GUEST_BLOCKED';

function isReadRequest(method?: string) {
  const m = (method || 'get').toLowerCase();
  return m === 'get' || m === 'head' || m === 'options';
}

rawClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  // Khách: mọi thao tác ghi (tạo/sửa/xoá bản ghi) đều yêu cầu đăng nhập.
  if (!isReadRequest(config.method) && !config.url?.startsWith('/auth/')) {
    suppressErrorToasts();
    useLoginGateStore.getState().openGate('tiếp tục thao tác này');
    const blocked: ApiError = {
      status: 401,
      code: GUEST_BLOCKED_CODE,
      message: 'Vui lòng đăng nhập để tiếp tục.',
    };
    return Promise.reject(blocked);
  }

  // Trang cá nhân đang hiển thị dạng làm mờ cho khách → mock trả dữ liệu mẫu.
  if (typeof window !== 'undefined' && getGuestAccess(window.location.pathname) === 'member') {
    config.headers['X-Demo-Sample'] = '1';
  }
  return config;
});

rawClient.interceptors.response.use(
  (response) => {
    // If response format is { data: T }, unwrap it
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<{ error?: { code?: string; message?: string; details?: Record<string, string> } }>) => {
    if ((error as unknown as ApiError).code === GUEST_BLOCKED_CODE) {
      return Promise.reject(error);
    }
    const status = error.response?.status || 500;
    const errorData = error.response?.data?.error;
    const apiError: ApiError = {
      status,
      code: errorData?.code || 'UNKNOWN_ERROR',
      message: errorData?.message || error.message || 'Đã có lỗi xảy ra',
      details: errorData?.details,
    };
    return Promise.reject(apiError);
  }
);

export interface ApiClientInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

export const apiClient = rawClient as unknown as ApiClientInstance;
