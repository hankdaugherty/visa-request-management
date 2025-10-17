// Development utility for testing session timeout functionality
import { authManager } from './auth';

// Only available in development mode
export const sessionTest = {
  // Simulate token expiry by modifying the token's exp field
  simulateTokenExpiry: (minutesFromNow: number = 1) => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Session test utilities are only available in development mode');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      
      // Set expiry to the specified minutes from now
      const now = Math.floor(Date.now() / 1000);
      payload.exp = now + (minutesFromNow * 60);
      
      // Recreate the token with modified payload
      const newPayload = btoa(JSON.stringify(payload));
      const newToken = `${parts[0]}.${newPayload}.${parts[2]}`;
      
      localStorage.setItem('token', newToken);
      console.log(`Token expiry set to ${minutesFromNow} minutes from now`);
      
      // Restart session monitoring with the new expiry
      authManager.startSessionMonitoring();
    } catch (error) {
      console.error('Error modifying token:', error);
    }
  },

  // Get current token expiry time
  getTokenExpiry: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = payload.exp - now;
      
      return {
        expiresAt: new Date(payload.exp * 1000),
        timeLeftMinutes: Math.floor(timeLeft / 60),
        timeLeftSeconds: timeLeft
      };
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  },

  // Force logout for testing
  forceLogout: () => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Session test utilities are only available in development mode');
      return;
    }
    
    console.log('Forcing logout for testing');
    authManager.logout();
  }
};

// Make it available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).sessionTest = sessionTest;
  console.log('Session test utilities available at window.sessionTest');
  console.log('Usage:');
  console.log('  window.sessionTest.simulateTokenExpiry(1) // Set token to expire in 1 minute');
  console.log('  window.sessionTest.getTokenExpiry() // Check current token expiry');
  console.log('  window.sessionTest.forceLogout() // Force logout');
}
