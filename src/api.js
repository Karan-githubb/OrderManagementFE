import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://ordermanagementbe.pythonanywhere.com',
});

api.interceptors.request.use((config) => {
    // Ensure all requests go through /api prefix if not already present
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(`${api.defaults.baseURL}/api/accounts/token/refresh/`, {
                        refresh: refreshToken,
                    });
                    localStorage.setItem('access_token', response.data.access);
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
