import axios from 'axios';
import toast from 'react-hot-toast';

// Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // Прямой URL, без proxy
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Таймаут 10 секунд
});

// Перехватчик запросов - автоматически добавляет access-токен в заголовки
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log('Request:', config.method.toUpperCase(), config.url); // Для отладки
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Переменная для отслеживания процесса обновления токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Перехватчик ответов
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url); // Для отладки
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('Response error:', error.response?.status, error.response?.data); // Для отладки

    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('http://localhost:3000/api/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Показываем уведомление об ошибке
    if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Сервер не отвечает. Проверьте, запущен ли бэкенд на порту 3000');
    } else if (!error.response) {
      toast.error('Нет соединения с сервером. Проверьте, запущен ли бэкенд');
    }

    return Promise.reject(error);
  }
);

// API методы
export const authAPI = {
  register: (userData) => {
    console.log('Registering user:', userData.email); // Для отладки
    return apiClient.post('/auth/register', userData);
  },
  login: (credentials) => {
    console.log('Logging in:', credentials.email); // Для отладки
    return apiClient.post('/auth/login', credentials);
  },
  getMe: () => {
    console.log('Getting current user'); // Для отладки
    return apiClient.get('/auth/me');
  },
};

export const productsAPI = {
  getAll: () => apiClient.get('/products'),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (productData) => apiClient.post('/products', productData),
  update: (id, productData) => apiClient.put(`/products/${id}`, productData),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export default apiClient;