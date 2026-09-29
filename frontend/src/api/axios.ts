import axios from 'axios';
import toast from 'react-hot-toast'; 

// Create an Axios instance
export const apiClient = axios.create({
  // Since Vite proxy is configured to map '/api' to the backend,
  // relative URLs will automatically be routed correctly.
  baseURL: '/api',
});

// Request interceptor to automatically inject the JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Global Error Handling)
apiClient.interceptors.response.use(
  // 2. If the response is successful (2xx status), just return it
  (response) => response,
  
  // 3. If the response is an error (4xx or 5xx status)
  (error) => {
    // Extract status and message from the backend response safely
    const status = error.response?.status;
    const message = error.response?.data?.message || 'An unexpected network error occurred.';

    // 4. Handle specific HTTP status codes globally
    if (status === 401) {
      // 401 Unauthorized: Token expired or invalid
      toast.error('Session expired. Please login again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      
    } else if (status === 403) {
      // 403 Forbidden: User doesn't have the right role
      toast.error('You do not have permission to perform this action.');
      
    } else {
      // 500 Internal Server Error or 400 Bad Request
      // Show the exact error message sent by our backend
      toast.error(message);
    }

    // 5. Reject the promise so the component (React Query) also knows it failed
    return Promise.reject(error);
  }
);