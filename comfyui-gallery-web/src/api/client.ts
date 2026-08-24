import axios from 'axios';

// 同域反代:dev 走 Vite proxy,/prod 走 Nginx 反代 /api → 后端
export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qan_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 时清除失效凭证
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      localStorage.removeItem('qan_token');
      localStorage.removeItem('qan_user');
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err: unknown): string {
  const anyErr = err as { response?: { data?: { error?: string } } };
  return anyErr?.response?.data?.error ?? '请求失败,请稍后再试';
}

/** 需登录的私有文件下载:经 axios 携带 JWT 取 blob,再触发浏览器下载 */
export async function downloadFile(url: string, fileName: string): Promise<void> {
  const res = await api.get<Blob>(url, { responseType: 'blob' });
  const blob = new Blob([res.data]);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
