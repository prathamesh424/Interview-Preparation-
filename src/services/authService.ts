
import { User } from "@/types";

// Simulated authentication - in a real app, this would connect to a backend
const LOCAL_STORAGE_KEY = 'interviewAce_auth';

const fakeAuthDelay = () => new Promise(resolve => setTimeout(resolve, 800));

export const authService = {
  async register(email: string, password: string, name: string): Promise<User> {
    await fakeAuthDelay();
    
    // Validate input
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }
    
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    
    // In a real app, this would make an API call to register the user
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name,
    };

    // Store in localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      user,
      token: `fake_token_${Date.now()}`
    }));

    return user;
  },

  async login(email: string, password: string): Promise<User> {
    await fakeAuthDelay();
    
    // Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    
    // In a real app, this would make an API call to authenticate the user
    // For now, we'll just check if the email ends with @example.com for demo purposes
    if (!email.endsWith('@example.com') && !email.includes('@')) {
      throw new Error('Invalid email format. Try with an @example.com email for demo.');
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
    };

    // Store in localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      user,
      token: `fake_token_${Date.now()}`
    }));

    return user;
  },

  logout(): void {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Redirect to home page
    window.location.href = "/";
  },

  getCurrentUser(): User | null {
    const authData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!authData) return null;
    
    try {
      const { user } = JSON.parse(authData);
      return user;
    } catch (e) {
      console.error("Error parsing auth data:", e);
      // If there's an error, clear the corrupted data
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
};
