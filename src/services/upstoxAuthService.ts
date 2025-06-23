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

  async requestReauth(skipBackend: boolean = false): Promise<ReauthResponse> {
    // If skipBackend is true, go directly to manual URL construction
    if (skipBackend) {
      console.log('🔧 Skipping backend, constructing manual Upstox URL directly...');
      return this.constructManualUpstoxUrl();
    }
    try {
      console.log('🔍 Requesting reauth from NestJS:', `${this.baseUrl}/auth/reauth`);
      const response = await axios.get(`${this.baseUrl}/auth/reauth`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('🔍 Reauth response:', response.data);
      console.log('🔍 Response URL:', response.data?.url);
      console.log('🔍 Response URL type:', typeof response.data?.url);
      
      if (!response.data?.url || typeof response.data.url !== 'string') {
        console.error('❌ Invalid URL in reauth response:', response.data);
        throw new Error('Invalid URL received from reauth endpoint');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Reauth request failed:', error);
      console.error('Error response:', error.response?.data);
      
      // Fallback: use manual URL construction since NestJS is simpler
      console.log('🔄 Fallback to manual URL construction...');
      return this.constructManualUpstoxUrl();
    }
  }

  private constructManualUpstoxUrl(): ReauthResponse {
    console.log('🔧 Constructing manual Upstox URL...');
    
    try {
      // Manual Upstox OAuth URL construction
      // This is based on the standard Upstox OAuth flow
      const clientId = 'a12d2378-2e10-4c02-98d9-6c8e76321a32'; // From your .env
      const redirectUri = encodeURIComponent(`${this.baseUrl}/auth/callback`);
      const responseType = 'code';
      const state = encodeURIComponent(JSON.stringify({
        timestamp: Date.now(),
        manual: true
      }));
      
      const manualUpstoxUrl = `https://api.upstox.com/v2/login/authorization/dialog?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&state=${state}`;
      
      console.log('🔧 Constructed manual Upstox URL:', manualUpstoxUrl);
      
      return {
        url: manualUpstoxUrl,
        message: 'Redirecting to Upstox authentication (manual fallback)'
      };
    } catch (manualError) {
      console.error('❌ Manual URL construction failed:', manualError);
      
      // Final fallback - redirect to account setup page
      return {
        url: '/account/new',
        message: 'Please set up your account manually'
      };
    }
  }

  redirectToUpstoxAuth(authUrl: string): void {
    console.log('🔄 Attempting redirect with URL:', authUrl);
    console.log('🔍 URL type:', typeof authUrl);
    console.log('🔍 URL stringified:', JSON.stringify(authUrl));
    console.log('📍 Current location:', window.location.pathname);
    
    // Validate the URL
    if (!authUrl || typeof authUrl !== 'string') {
      console.error('❌ Invalid auth URL provided:', authUrl);
      alert('Error: Invalid authentication URL received. Please try refreshing the page.');
      return;
    }
    
    // Check if it's a relative URL (starts with /) or absolute URL
    let isRelativeUrl = authUrl.startsWith('/');
    
    if (!isRelativeUrl) {
      // Additional validation to ensure it's a proper absolute URL
      try {
        new URL(authUrl);
      } catch (urlError) {
        console.error('❌ URL validation failed:', urlError);
        alert('Error: Invalid authentication URL format. Please try refreshing the page.');
        return;
      }
    }
    
    // Store current location to redirect back after auth
    localStorage.setItem('redirectAfterAuth', window.location.pathname);
    console.log('💾 Stored redirect path:', window.location.pathname);
    
    // Add a small delay to ensure logs are visible
    setTimeout(() => {
      console.log('🚀 Executing redirect to:', authUrl);
      window.location.href = authUrl;
    }, 100);
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

  // Debug function to test redirect manually
  async testRedirect(): Promise<void> {
    console.log('🧪 Testing redirect functionality...');
    try {
      const reauthResponse = await this.requestReauth();
      console.log('✅ Got reauth response:', reauthResponse);
      this.redirectToUpstoxAuth(reauthResponse.url);
    } catch (error) {
      console.error('❌ Test redirect failed:', error);
      throw error;
    }
  }
}

export const upstoxAuthService = new UpstoxAuthService();

// Add global debug function for testing
declare global {
  interface Window {
    testUpstoxRedirect: () => Promise<void>;
    debugUpstoxAuth: () => Promise<void>;
  }
}

window.testUpstoxRedirect = () => upstoxAuthService.testRedirect();

// Add debug function to check API endpoints
window.debugUpstoxAuth = async () => {
  console.log('🧪 Testing Upstox auth endpoints...');
  
  try {
    console.log('Testing /auth/reauth...');
    const reauthResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/auth/reauth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    const reauthData = await reauthResponse.json();
    console.log('Reauth response:', reauthData);
  } catch (error) {
    console.error('Reauth test failed:', error);
  }
  
  try {
    console.log('Testing /auth/upstox...');
    const upstoxResponse = await fetch(`${process.env.REACT_APP_BASE_URL}/auth/upstox`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    const upstoxData = await upstoxResponse.json();
    console.log('Upstox auth response:', upstoxData);
  } catch (error) {
    console.error('Upstox auth test failed:', error);
  }
  
  try {
    console.log('Testing trading accounts fetch...');
    const accountsResponse = await fetch(`${process.env.REACT_APP_ST_BASE_URL}/trading-accounts?filters[account_type]=live&filters[isLinkedWithBrokerAccount]=true&populate=demo_account`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    const accountsData = await accountsResponse.json();
    console.log('Trading accounts response:', accountsData);
  } catch (error) {
    console.error('Trading accounts test failed:', error);
  }
};