// Authentication utilities for token management and auto-logout
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export class AuthManager {
  private static instance: AuthManager;
  private logoutCallback?: () => void;
  private sessionTimeoutWarningCallback?: (timeLeft: number) => void;
  private warningShown = false;
  private warningTimeoutId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Set callback functions for logout and session warnings
  setCallbacks(logoutCallback: () => void, sessionTimeoutWarningCallback?: (timeLeft: number) => void) {
    this.logoutCallback = logoutCallback;
    this.sessionTimeoutWarningCallback = sessionTimeoutWarningCallback;
  }

  // Check if token exists and is valid
  isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = this.parseToken(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  }

  // Parse JWT token and return payload
  parseToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  // Get time until token expires (in seconds)
  getTimeUntilExpiry(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;

    try {
      const payload = this.parseToken(token);
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch (error) {
      return 0;
    }
  }

  // Get time until token expires (in minutes)
  getTimeUntilExpiryMinutes(): number {
    return Math.floor(this.getTimeUntilExpiry() / 60);
  }

  // Start session timeout monitoring
  startSessionMonitoring(): void {
    this.stopSessionMonitoring(); // Clear any existing monitoring

    if (!this.isTokenValid()) {
      console.log('Token invalid, logging out');
      this.logout();
      return;
    }

    const timeUntilExpiry = this.getTimeUntilExpiry();
    console.log(`Starting session monitoring. Time until expiry: ${Math.floor(timeUntilExpiry / 60)} minutes`);
    
    // Show warning 5 minutes before expiry
    const warningTime = 5 * 60; // 5 minutes in seconds
    const warningDelay = Math.max(0, timeUntilExpiry - warningTime) * 1000;

    if (warningDelay > 0) {
      console.log(`Session warning will show in ${Math.floor(warningDelay / 1000 / 60)} minutes`);
      this.warningTimeoutId = setTimeout(() => {
        this.showSessionWarning();
      }, warningDelay);
    } else if (timeUntilExpiry > 0) {
      // If less than 5 minutes left, show warning immediately
      console.log('Less than 5 minutes left, showing warning immediately');
      this.showSessionWarning();
    }

    // Set up auto-logout
    const logoutDelay = timeUntilExpiry * 1000;
    if (logoutDelay > 0) {
      console.log(`Auto-logout will occur in ${Math.floor(logoutDelay / 1000 / 60)} minutes`);
      setTimeout(() => {
        this.logout();
      }, logoutDelay);
    }
  }

  // Stop session monitoring
  stopSessionMonitoring(): void {
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    this.warningShown = false;
  }

  // Show session timeout warning
  private showSessionWarning(): void {
    if (this.warningShown) return;
    
    this.warningShown = true;
    const timeLeft = this.getTimeUntilExpiryMinutes();
    
    if (this.sessionTimeoutWarningCallback) {
      this.sessionTimeoutWarningCallback(timeLeft);
    } else {
      // Fallback to browser alert
      alert(`Your session will expire in ${timeLeft} minutes. Please save your work and refresh the page to continue.`);
    }
  }

  // Handle 401 errors from API requests
  handleUnauthorized(): void {
    console.log('Handling unauthorized access - token expired or invalid');
    this.logout();
  }

  // Logout user and clear session
  logout(): void {
    console.log('Logging out user due to session expiry');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    // Stop monitoring
    this.stopSessionMonitoring();
    
    // Call logout callback
    if (this.logoutCallback) {
      this.logoutCallback();
    }
  }

  // Refresh session monitoring (call this after successful API requests)
  refreshSessionMonitoring(): void {
    if (this.isTokenValid()) {
      this.startSessionMonitoring();
    } else {
      this.logout();
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // Get user role
  getUserRole(): string | null {
    if (!this.isAuthenticated()) return null;
    return localStorage.getItem('userRole');
  }

  // Get user ID
  getUserId(): string | null {
    if (!this.isAuthenticated()) return null;
    return localStorage.getItem('userId');
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();
