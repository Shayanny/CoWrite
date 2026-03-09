import { api } from './api';

export interface User {
  username: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

class AuthService {
  async register(data: RegisterRequest) {
    const response = await api.request<{ message: string }>('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  }

  async login(data: LoginRequest) {
    const response = await api.request<AuthResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify({
        username: userData.username,
        email: userData.email,
      }));
    }

    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export const authService = new AuthService();