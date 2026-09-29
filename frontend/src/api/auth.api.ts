import axios from 'axios';
import type { ApiResponse, User } from '../types/incident';

// Define the shape of the data we send to the backend
export interface LoginCredentials {
  email: string;
  password: string;
}

// Define the shape of the data we get back from the backend upon successful login
export interface LoginResponseData {
  user: User;
  token: string;
}

const API_URL = '/api/auth';

/**
 * Authenticate user and get JWT token
 * @param credentials - Email and password
 * @returns User data and JWT token
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponseData> => {
  // We send a POST request with the credentials in the body
  const response = await axios.post<ApiResponse<LoginResponseData>>(`${API_URL}/login`, credentials);
  return response.data.data;
};