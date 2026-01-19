import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosResponse } from "axios";
import api, { setAuthToken } from "./api";

/* ================= TYPES ================= */

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  trips_generated?: number;
  budget?: number; // 0=Economy, 1=Mid, 2=Luxury
  pace?: string;
  interests?: string[];
  auto_sync_data?: boolean;
  train_ai?: boolean;
  smart_suggestions?: boolean;
  share_stats?: boolean;
  profile_visibility?: string;
  analytics_cookies?: boolean;
  marketing_cookies?: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

/* ================= SERVICE TYPE ================= */

interface AuthServiceType {
  register: (data: RegisterData) => Promise<AuthResponse>;
  login: (data: LoginData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getUser: () => Promise<User | null>;
  getToken: () => Promise<string | null>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (data: ResetPasswordData) => Promise<any>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  deleteAccount: () => Promise<any>;
}

interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

/* ================= HELPERS ================= */

const updateLoginHistory = async (email: string) => {
  try {
    const history = await AsyncStorage.getItem("loginHistory");
    const accounts = history ? JSON.parse(history) : [];
    if (!accounts.includes(email)) {
      accounts.push(email);
      await AsyncStorage.setItem("loginHistory", JSON.stringify(accounts));
    }
  } catch (e) {
    console.error("Failed to update login history", e);
  }
};

/* ================= SERVICE ================= */

const AuthService: AuthServiceType = {
  // FORGOT PASSWORD
  forgotPassword: async (email) => {
    return api.post("/forgot-password", { email });
  },

  // RESET PASSWORD
  resetPassword: async (data) => {
    return api.post("/reset-password", data);
  },

  // REGISTER
  register: async (data) => {
    const response: AxiosResponse<AuthResponse> = await api.post(
      "/register",
      data
    );

    await AsyncStorage.setItem("userInfo", JSON.stringify(response.data));
    await setAuthToken(response.data.token);
    await updateLoginHistory(response.data.user.email);

    return response.data;
  },

  // LOGIN
  login: async (data) => {
    const response: AxiosResponse<AuthResponse> = await api.post(
      "/login",
      data
    );

    await AsyncStorage.setItem("userInfo", JSON.stringify(response.data));
    await setAuthToken(response.data.token);
    await updateLoginHistory(response.data.user.email);

    return response.data;
  },

  // LOGOUT
  logout: async () => {
    await AsyncStorage.removeItem("userInfo");
    await setAuthToken(null);
  },

  // GET USER
  getUser: async () => {
    try {
      const response = await api.get('/user');
      const storedData = await AsyncStorage.getItem("userInfo");
      if (storedData) {
        const { token } = JSON.parse(storedData);
        await AsyncStorage.setItem("userInfo", JSON.stringify({ user: response.data, token }));
      }
      return response.data;
    } catch {
      const data = await AsyncStorage.getItem("userInfo");
      if (!data) return null;
      try {
        return JSON.parse(data).user;
      } catch {
        return null;
      }
    }
  },

  // UPDATE PROFILE
  updateProfile: async (data) => {
    const response = await api.put('/user', data);
    const storedData = await AsyncStorage.getItem("userInfo");
    if (storedData) {
      const { token } = JSON.parse(storedData);
      await AsyncStorage.setItem("userInfo", JSON.stringify({ user: response.data, token }));
    }
    return response.data;
  },

  // DELETE ACCOUNT
  deleteAccount: async () => {
    const response = await api.delete('/user');
    return response.data;
  },

  // GET TOKEN
  getToken: async () => {
    const data = await AsyncStorage.getItem("userInfo");
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      return parsed?.token ?? null;
    } catch {
      return null;
    }
  },
};

export default AuthService;
