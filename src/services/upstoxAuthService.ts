import axios from 'axios';

export interface TokenStatusResponse {
  valid: boolean;
  error?: string;
  action?: string;
}

export interface ReauthResponse {
  url: string;
  message: string;
}

class UpstoxAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:3005';
  }

  async checkTokenStatus(): Promise<TokenStatusResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/auth/token-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return error.response.data;
      }
      throw error;
    }
  }

  async requestReauth(): Promise<ReauthResponse> {
    const response = await axios.post(`${this.baseUrl}/auth/reauth`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }

  redirectToUpstoxAuth(authUrl: string): void {
    // Store current location to redirect back after auth
    localStorage.setItem('redirectAfterAuth', window.location.pathname);
    window.location.href = authUrl;
  }

  handleSuccessfulAuth(): void {
    // Check if we need to redirect back to a specific page
    const redirectPath = localStorage.getItem('redirectAfterAuth');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterAuth');
      window.location.href = redirectPath;
    } else {
      // Reload the current page to refresh with new token
      window.location.reload();
    }
  }
}

export const upstoxAuthService = new UpstoxAuthService();