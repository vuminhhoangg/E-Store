export interface User {
    id?: string;
    userName?: string;
    phoneNumber?: string;
    diaChi?: string;
    token?: string;
    rememberMe?: boolean;
    isAdmin?: boolean;
}

export interface RegisterData {
    userName: string;
    phoneNumber: string;
    password: string;
    diaChi: string;
}

export interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (phoneNumber: string, password: string, rememberMe: boolean) => Promise<User>;
    register: (userData: RegisterData) => Promise<User>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<string>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
    getUserProfile: () => Promise<User>;
    updateUserProfile: (userData: Partial<User>) => Promise<User>;
    removeDevice: (deviceId: string) => Promise<any>;
}

export function useAuth(): AuthContextType; 