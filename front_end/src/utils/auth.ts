import { APP_CONFIG } from '../config';

interface User {
    _id: string;
    userName: string;
    email: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    isAdmin: boolean;
}

// Lấy token xác thực từ localStorage
export const getAuthToken = (): string | null => {
    return localStorage.getItem(APP_CONFIG.AUTH_TOKEN_KEY);
};

// Lưu token xác thực vào localStorage
export const setAuthToken = (token: string): void => {
    localStorage.setItem(APP_CONFIG.AUTH_TOKEN_KEY, token);
};

// Xóa token xác thực khỏi localStorage
export const removeAuthToken = (): void => {
    localStorage.removeItem(APP_CONFIG.AUTH_TOKEN_KEY);
};

// Lấy thông tin người dùng hiện tại từ localStorage
export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(APP_CONFIG.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};

// Lưu thông tin người dùng vào localStorage
export const setCurrentUser = (user: User): void => {
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(user));
};

// Xóa thông tin người dùng khỏi localStorage
export const removeCurrentUser = (): void => {
    localStorage.removeItem(APP_CONFIG.USER_KEY);
};

// Kiểm tra xem người dùng đã đăng nhập chưa
export const isLoggedIn = (): boolean => {
    return !!getAuthToken();
};

// Kiểm tra xem người dùng có quyền quản trị viên không
export const isAdmin = (): boolean => {
    const user = getCurrentUser();
    return !!user && user.isAdmin;
};

// Đăng xuất - xóa token và thông tin người dùng
export const logout = (): void => {
    removeAuthToken();
    removeCurrentUser();
};

// Tạo UserType để export
export type { User }; 