import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';

interface User {
    id: string;
    userName: string;
    phoneNumber: string;
    diaChi: string;
}

interface UserInfo {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

interface AuthContextType {
    isLoggedIn: boolean;
    user: User | null;
    login: (phoneNumber: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
    refreshSession: () => void;
    getUserProfile: () => Promise<any>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    currentUser?: User | null;
    register: (userData: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Thời gian hết hạn mặc định (30 phút cho session bình thường)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 phút
// Thời gian hết hạn cho "Ghi nhớ đăng nhập" (30 ngày)
const REMEMBER_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 ngày
// Khoảng thời gian kiểm tra phiên đăng nhập
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 phút
// Số lần thử lại tối đa khi refresh token thất bại
const MAX_REFRESH_RETRIES = 3;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [lastActivity, setLastActivity] = useState<number>(Date.now());
    const [refreshRetries, setRefreshRetries] = useState(0);

    // Hàm lấy thông tin người dùng từ storage
    const getUserInfoFromStorage = (): UserInfo | null => {
        try {
            // Kiểm tra cả localStorage và sessionStorage
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
            if (!userInfoStr) return null;

            const userInfo = JSON.parse(userInfoStr) as UserInfo;

            // Kiểm tra tính hợp lệ của dữ liệu
            if (!userInfo.user || !userInfo.accessToken || !userInfo.refreshToken || !userInfo.expiresAt) {
                console.warn('Dữ liệu người dùng không hợp lệ, đăng xuất');
                logout();
                return null;
            }

            return userInfo;
        } catch (error) {
            console.error('Error parsing user info from storage:', error);
            logout();
            return null;
        }
    };

    // Hàm lưu thông tin người dùng vào storage
    const saveUserInfoToStorage = (userInfo: UserInfo, rememberMe: boolean) => {
        try {
            // Xóa dữ liệu cũ trước để tránh lưu cả hai nơi
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('userInfo');

            // Lưu vào localStorage nếu rememberMe = true, ngược lại lưu vào sessionStorage
            if (rememberMe) {
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
            } else {
                sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
            }
        } catch (error) {
            console.error('Error saving user info to storage:', error);
        }
    };

    // Xử lý refresh token
    const handleTokenRefresh = async () => {
        const userInfo = getUserInfoFromStorage();
        if (!userInfo) return false;

        try {
            const refreshResponse = await authAPI.refreshToken(userInfo.refreshToken);
            if (!refreshResponse) return false;

            const isRemembered = localStorage.getItem('userInfo') !== null;
            const tokenExpiresAt = refreshResponse.expiresIn || Date.now() + (isRemembered ? REMEMBER_TIMEOUT : SESSION_TIMEOUT);

            const updatedUserInfo = {
                ...userInfo,
                accessToken: refreshResponse.accessToken,
                refreshToken: refreshResponse.refreshToken,
                expiresAt: tokenExpiresAt
            };

            saveUserInfoToStorage(updatedUserInfo, isRemembered);
            setRefreshRetries(0); // Reset số lần thử lại
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Tăng số lần thử lại
            setRefreshRetries(prev => prev + 1);

            if (refreshRetries >= MAX_REFRESH_RETRIES) {
                console.error('Maximum refresh retries reached, logging out...');
                logout();
                return false;
            }

            return false;
        }
    };

    // Kiểm tra trạng thái đăng nhập khi component mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            const userInfo = getUserInfoFromStorage();
            if (!userInfo || !userInfo.user) {
                console.log('Không tìm thấy thông tin đăng nhập trong storage');
                return;
            }

            console.log('Tìm thấy thông tin đăng nhập:', {
                userId: userInfo.user.id,
                userName: userInfo.user.userName,
                tokenExpires: new Date(userInfo.expiresAt).toLocaleString(),
                hasAccessToken: !!userInfo.accessToken,
                hasRefreshToken: !!userInfo.refreshToken
            });

            // Kiểm tra thời gian hết hạn
            if (userInfo.expiresAt < Date.now()) {
                console.log('Phiên đăng nhập đã hết hạn, thử làm mới token...');

                const refreshSuccess = await handleTokenRefresh();
                if (!refreshSuccess) {
                    console.log('Làm mới token thất bại, đăng xuất');
                    logout();
                    return;
                }

                console.log('Làm mới token thành công, cập nhật phiên đăng nhập');
            }

            // Kiểm tra thời gian không hoạt động
            const inactiveTime = Date.now() - lastActivity;
            const isRemembered = localStorage.getItem('userInfo') !== null;
            const maxInactiveTime = isRemembered ? REMEMBER_TIMEOUT : SESSION_TIMEOUT;

            if (inactiveTime > maxInactiveTime) {
                console.log('Phiên đăng nhập không hoạt động quá lâu, đăng xuất');
                logout();
                return;
            }

            setUser(userInfo.user);
            setIsLoggedIn(true);
            console.log('Đã thiết lập trạng thái đăng nhập thành công');
        };

        checkAuthStatus();

        // Kiểm tra phiên đăng nhập định kỳ
        const intervalId = setInterval(checkAuthStatus, SESSION_CHECK_INTERVAL);

        // Theo dõi hoạt động người dùng
        const updateActivity = () => setLastActivity(Date.now());
        window.addEventListener('click', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('touchstart', updateActivity);
        window.addEventListener('scroll', updateActivity);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('touchstart', updateActivity);
            window.removeEventListener('scroll', updateActivity);
        };
    }, [lastActivity, refreshRetries]);

    // Làm mới phiên đăng nhập
    const refreshSession = async () => {
        const userInfo = getUserInfoFromStorage();
        if (!userInfo) return;

        try {
            // Nếu token sắp hết hạn (còn dưới 5 phút), thử làm mới token
            const timeToExpire = userInfo.expiresAt - Date.now();
            if (timeToExpire < 5 * 60 * 1000) {
                console.log('Token sắp hết hạn, thử làm mới token...');
                await handleTokenRefresh();
                return;
            }

            const isRemembered = localStorage.getItem('userInfo') !== null;

            // Cập nhật thời gian hoạt động cuối cùng
            setLastActivity(Date.now());

            // Cập nhật thời gian hết hạn
            const newExpiresAt = Date.now() + (isRemembered ? REMEMBER_TIMEOUT : SESSION_TIMEOUT);

            const updatedUserInfo = {
                ...userInfo,
                expiresAt: newExpiresAt
            };

            saveUserInfoToStorage(updatedUserInfo, isRemembered);

            console.log('Session refreshed, new expiry:', new Date(newExpiresAt).toLocaleString());
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    };


    const login = async (phoneNumber: string, password: string, rememberMe = false) => {
        try {
            console.log('Đang gọi API đăng nhập với số điện thoại:', phoneNumber);

            const response = await authAPI.login(phoneNumber, password);
            console.log('Phản hồi từ API đăng nhập:', response.data);

            // Kiểm tra phản hồi từ API
            if (!response?.data?.success) {
                console.error('Đăng nhập thất bại:', response?.data?.message);
                throw new Error(response?.data?.message || 'Đăng nhập không thành công');
            }

            const { success, user, tokens, expiresAt } = response.data;

            // Kiểm tra dữ liệu người dùng và token
            if (!success || !user || !tokens?.accessToken || !tokens?.refreshToken) {
                console.error('Dữ liệu không hợp lệ từ API đăng nhập:', response.data);
                throw new Error('Đăng nhập không thành công: Dữ liệu không hợp lệ');
            }

            // Lưu thông tin người dùng và token vào state
            setUser(user);
            setIsLoggedIn(true);
            setLastActivity(Date.now());

            // Thiết lập thời gian hết hạn (sử dụng thời gian từ API nếu có, nếu không thì tính dựa trên rememberMe)
            const expireTime = expiresAt ? expiresAt : Date.now() + (rememberMe ? REMEMBER_TIMEOUT : SESSION_TIMEOUT);

            // Lưu thông tin vào localStorage hoặc sessionStorage tùy thuộc vào rememberMe
            const userInfo: UserInfo = {
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: expireTime
            };

            saveUserInfoToStorage(userInfo, rememberMe);

            console.log(`Đăng nhập thành công (Ghi nhớ: ${rememberMe ? 'Có' : 'Không'})`);
            console.log('Phiên hết hạn vào:', new Date(expireTime).toLocaleString());

            // Reset refresh retries khi đăng nhập thành công
            setRefreshRetries(0);
        } catch (error: any) {
            console.error('Lỗi đăng nhập chi tiết:', error);
            if (error.response?.data) {
                console.error('Thông tin lỗi từ server:', error.response.data);
            }
            throw new Error(error.response?.data?.message || error.message || 'Đăng nhập thất bại');
        }
    };


    const logout = () => {
        try {
            // Lấy refresh token trước khi xóa thông tin người dùng
            const userInfo = getUserInfoFromStorage();

            // Xóa thông tin người dùng khỏi state
            setUser(null);
            setIsLoggedIn(false);

            // Xóa thông tin từ cả localStorage và sessionStorage
            localStorage.removeItem('userInfo');
            sessionStorage.removeItem('userInfo');

            // Gọi API để vô hiệu hóa token ở server (nếu có refresh token)
            if (userInfo && userInfo.refreshToken) {
                // Không đợi kết quả vì đây là hành động "fire and forget"
                authAPI.logout(userInfo.refreshToken || '').catch(err => {
                    console.error('Error during logout API call:', err);
                });
            }

            console.log('User logged out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Hàm lấy thông tin người dùng
    const getUserProfile = async () => {
        try {
            // Đọc thông tin người dùng từ storage
            const userInfo = getUserInfoFromStorage();
            if (!userInfo || !userInfo.user) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            // Trả về thông tin người dùng
            return userInfo.user;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    };

    // Hàm đổi mật khẩu
    const changePassword = async (currentPassword: string, newPassword: string) => {
        try {
            const userInfo = getUserInfoFromStorage();
            if (!userInfo || !userInfo.user) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            // Gọi API đổi mật khẩu
            const response = await authAPI.changePassword(currentPassword, newPassword);

            if (!response.success) {
                throw new Error(response.message || 'Đổi mật khẩu không thành công');
            }

            // Đăng xuất sau khi đổi mật khẩu thành công
            setTimeout(() => {
                logout();
            }, 3000); // Đợi 3 giây để người dùng thấy thông báo thành công

            return response;
        } catch (error: any) {
            console.error('Error changing password:', error);
            throw new Error(error.message || 'Đã xảy ra lỗi khi đổi mật khẩu');
        }
    };

    // Hàm đăng ký người dùng mới

    const register = async (userData: any) => {
        try {
            console.log('Registering new user:', userData);

            const response = await authAPI.register(userData);

            console.log('Registration response:', response.data);

            if (response.data.success) {
                console.log('User registered successfully');
                return; // Chỉ trả về void, không trả về data
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error: any) {
            console.error('Registration error:', error.response?.data || error.message);
            throw error;
        }
    };


    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            user,
            login,
            logout,
            refreshSession,
            getUserProfile,
            changePassword,
            currentUser: user,
            register
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook để sử dụng context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};