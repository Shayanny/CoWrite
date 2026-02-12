const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeader(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle unauthorized/expired token
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to login
          window.location.pathname = '/';
          return { error: 'Session expired. Please login again.' };
        }
        
        return { error: data.error || 'Something went wrong' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }
}

export const api = new ApiService();