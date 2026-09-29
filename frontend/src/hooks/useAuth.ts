import { useMutation } from '@tanstack/react-query';
import { login, type LoginCredentials } from '../api/auth.api';

export const useLogin = () => {
    return useMutation({
        mutationFn: (credentials: LoginCredentials) => login(credentials),
        onSuccess: (data) => {
            // When login is successful, we save the token in LocalStorage
      // Note: In a real enterprise app, we might use HttpOnly cookies for better security
            localStorage.setItem('token', data.token);

            // We also save the user details (like role) so we can show/hide UI elements
            localStorage.setItem('user', JSON.stringify(data.user));
        },
    });
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Reload the page to clear any cached data in memory
    window.location.href = '/login'; // use hard reset and clear react-query cache  
};