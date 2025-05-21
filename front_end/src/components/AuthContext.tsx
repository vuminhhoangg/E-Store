import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { authAPI } from '../services/api';
import axios from 'axios';

interface User {
    id: string;
    userName: string;
    phoneNumber: string;
    diaChi: string;
    isAdmin: boolean;
}

interface UserInfo {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    lastActivityUpdate?: number; // Dấu ? để biểu thị optional field
    [key: string]: any; // Nếu cần cho các trường dynamic khác
}

interface AuthContextType {
    isLoggedIn: boolean;
    isAuthenticated: boolean;
    user: User | null;
    adminVerified: boolean;
    verifyAdminOnce: () => Promise<boolean>;
    login: (phoneNumber: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
    refreshSession: () => void;
    getUserProfile: () => Promise<any>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    currentUser?: User | null;
    register: (userData: any) => Promise<any>;
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
    const [adminVerified, setAdminVerified] = useState(false);

    // Hàm lấy thông tin người dùng từ storage
    // Sử dụng biến ngoài để lưu trữ tạm
    let cachedUserInfo: UserInfo | null = null;
    let lastFetchTime = 0;

    const getUserInfoFromStorage = (): UserInfo | null => {
        try {
            // Kiểm tra cache trước (hiệu lực trong 5 giây)
            const now = Date.now();
            if (cachedUserInfo && now - lastFetchTime < 5000) {
                return cachedUserInfo;
            }

            // Kiểm tra cả localStorage và sessionStorage
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
            if (!userInfoStr) {
                console.log('[AuthContext] No user info found in storage');
                return null;
            }

            const userInfo = JSON.parse(userInfoStr) as UserInfo;

            // Kiểm tra tính hợp lệ của dữ liệu
            if (!userInfo.user || !userInfo.accessToken || !userInfo.refreshToken || !userInfo.expiresAt) {
                console.warn('[AuthContext] Invalid user data, logging out');
                logout();
                return null;
            }

            // Đảm bảo isAdmin có giá trị
            if (userInfo.user.isAdmin === undefined) {
                userInfo.user.isAdmin = false;
            }

            // Cập nhật cache
            cachedUserInfo = userInfo;
            lastFetchTime = now;

            return userInfo;
        } catch (error) {
            console.error('[AuthContext] Error parsing user info:', error);
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
                expiresAt: tokenExpiresAt,
                lastActivityUpdate: Date.now() // Thêm thời gian hoạt động cuối cùng khi làm mới token
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
        let isMounted = true;
        let intervalId: number;

        const checkAuthStatus = async () => {
            const userInfo = getUserInfoFromStorage();
            if (!userInfo || !userInfo.user) {
                console.log('Không tìm thấy thông tin đăng nhập trong storage');
                return;
            }

            // Nếu đã đăng nhập rồi thì không cần kiểm tra lại
            if (isLoggedIn) return;

            console.log('Tìm thấy thông tin đăng nhập:', {
                userId: userInfo.user.id,
                userName: userInfo.user.userName,
                tokenExpires: new Date(userInfo.expiresAt).toLocaleString(),
                hasAccessToken: !!userInfo.accessToken,
                hasRefreshToken: !!userInfo.refreshToken,
                expiresIn: Math.floor((userInfo.expiresAt - Date.now()) / 1000 / 60) + ' phút'
            });

            // Thiết lập trạng thái đăng nhập
            if (isMounted) {
                setUser(userInfo.user);
                setIsLoggedIn(true);
                console.log('Khôi phục trạng thái đăng nhập từ storage:', {
                    userName: userInfo.user.userName,
                    isAdmin: userInfo.user.isAdmin
                });
            }

            // Kiểm tra token hết hạn
            const timeToExpire = userInfo.expiresAt - Date.now();
            if (timeToExpire < 5 * 60 * 1000) {
                console.log('Token sắp hết hạn hoặc đã hết hạn, thử làm mới token...');
                try {
                    const refreshSuccess = await handleTokenRefresh();
                    if (!refreshSuccess && timeToExpire <= 0) {
                        console.warn('Token đã hết hạn và không thể làm mới, đăng xuất');
                        if (isMounted) logout();
                        return;
                    }
                } catch (error) {
                    console.error('Lỗi khi làm mới token:', error);
                    if (timeToExpire <= 0 && isMounted) {
                        console.warn('Token đã hết hạn và refresh gặp lỗi, đăng xuất');
                        logout();
                        return;
                    }
                }
            }
        };

        // Chỉ chạy kiểm tra nếu chưa đăng nhập
        if (!isLoggedIn) {
            checkAuthStatus();
        }

        // Thiết lập interval sau khi kiểm tra ban đầu
        intervalId = setInterval(() => {
            const userInfo = getUserInfoFromStorage();
            if (!userInfo) return;

            const timeToExpire = userInfo.expiresAt - Date.now();
            if (timeToExpire < 5 * 60 * 1000) {
                console.log('Token sắp hết hạn, đang làm mới...');
                handleTokenRefresh().catch(console.error);
            }
        }, 5 * 60 * 1000); // 5 phút - giữ nguyên theo yêu cầu

        // Theo dõi hoạt động người dùng
        const updateActivity = () => {
            const now = Date.now();
            if (now - lastActivity > 60 * 1000 && isMounted) { // Nếu đã qua 60 giây kể từ hoạt động cuối
                setLastActivity(now);

                // Tự động làm mới phiên khi có hoạt động
                if (isLoggedIn) {
                    console.log('Người dùng đang hoạt động, làm mới phiên...');
                    refreshSession();
                }
            }
        }

        const activityEvents = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
        activityEvents.forEach(event => window.addEventListener(event, updateActivity));

        return () => {
            isMounted = false;
            clearInterval(intervalId);
            activityEvents.forEach(event => window.removeEventListener(event, updateActivity));
        };
    }, [lastActivity, refreshRetries, isLoggedIn]); // Thêm isLoggedIn vào dependencies

    // Làm mới phiên đăng nhập
    const refreshSession = async () => {
        try {
            const userInfo = getUserInfoFromStorage();
            if (!userInfo) return;

            const now = Date.now();
            const isRemembered = localStorage.getItem('userInfo') !== null;
            const sessionTimeout = isRemembered ? REMEMBER_TIMEOUT : SESSION_TIMEOUT;

            // Kiểm tra xem người dùng có phải admin không
            const isAdmin = userInfo.user?.isAdmin === true;

            // Kiểm tra thời gian từ lần cập nhật cuối
            const shouldUpdateActivity =
                !userInfo.lastActivityUpdate ||
                (now - userInfo.lastActivityUpdate) > (isAdmin ? 30 * 1000 : 60 * 1000); // Giảm thời gian cho admin

            // Kiểm tra token còn bao lâu sẽ hết hạn
            const timeToExpire = userInfo.expiresAt - now;
            const shouldRefreshToken = timeToExpire < 30 * 60 * 1000; // Làm mới token nếu còn dưới 30 phút

            // Chỉ cập nhật khi cần thiết hoặc là admin
            if (shouldUpdateActivity || isAdmin) {
                const updatedUserInfo = {
                    ...userInfo,
                    lastActivityUpdate: now,
                    expiresAt: now + sessionTimeout
                };

                saveUserInfoToStorage(updatedUserInfo, isRemembered);
                console.log('Phiên làm việc đã được làm mới lúc:', new Date(now).toLocaleString());

                // Nếu là admin, thường xuyên xác thực trạng thái admin
                if (isAdmin && !adminVerified) {
                    console.log('Đang xác thực quyền admin...');
                    verifyAdminOnce().catch(console.error);
                }
            }

            // Ưu tiên làm mới token cho admin hoặc khi token sắp hết hạn
            if ((isAdmin && shouldUpdateActivity) || shouldRefreshToken) {
                console.log('Đang làm mới token...');
                await handleTokenRefresh();
            }
        } catch (error) {
            console.error('Session refresh error:', error);
        }
    };

    const login = async (phoneNumber: string, password: string, rememberMe = false) => {
        try {
            // Xóa cache xác thực admin khi đăng nhập mới
            authAPI.clearAdminVerificationCache();

            console.log('Đang gọi API đăng nhập với số điện thoại:', phoneNumber);

            const response = await authAPI.login(phoneNumber, password);
            localStorage.setItem('user_info', JSON.stringify(response.data.user));
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
            // Reset trạng thái xác thực admin khi đăng nhập mới
            setAdminVerified(false);

            // Thiết lập thời gian hết hạn (sử dụng thời gian từ API nếu có, nếu không thì tính dựa trên rememberMe)
            const expireTime = expiresAt ? expiresAt : Date.now() + (rememberMe ? REMEMBER_TIMEOUT : SESSION_TIMEOUT);

            // Ensure isAdmin is defined
            if (user.isAdmin === undefined) {
                console.warn('[AuthContext] isAdmin is undefined in API response, setting default value to false');
                user.isAdmin = false;
            }

            // Lưu thông tin vào localStorage hoặc sessionStorage tùy thuộc vào rememberMe
            const userInfo: UserInfo = {
                user,
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: expireTime
            };

            saveUserInfoToStorage(userInfo, rememberMe);

            console.log(`[AuthContext] Đăng nhập thành công (Ghi nhớ: ${rememberMe ? 'Có' : 'Không'})`);
            console.log('[AuthContext] Phiên hết hạn vào:', new Date(expireTime).toLocaleString());
            console.log('[AuthContext] Thông tin người dùng:', {
                id: user.id,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
                isAdmin: user.isAdmin
            });
            console.log('[AuthContext] AUTH STATE AFTER LOGIN:', {
                isLoggedIn: true,
                user: {
                    id: user.id,
                    userName: user.userName,
                    isAdmin: user.isAdmin
                }
            });

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
            // Reset trạng thái đã xác thực admin
            setAdminVerified(false);
            // Xóa cache xác thực admin
            authAPI.clearAdminVerificationCache();

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
            console.log('Đang đăng ký người dùng mới:', userData);

            const response = await authAPI.register(userData);

            // Kiểm tra phản hồi từ API
            console.log('Phản hồi đăng ký:', response.data);

            // Xử lý khi đăng ký thành công
            if (response.data && response.data.message === 'User registered successfully') {
                console.log('Đăng ký người dùng thành công');
                return response.data; // Trả về dữ liệu để RegisterPage xử lý
            } else {
                const errorMessage = (response.data && response.data.message)
                    ? response.data.message
                    : 'Đăng ký không thành công. Vui lòng thử lại.';
                console.error('Đăng ký thất bại với thông báo:', errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error('Chi tiết lỗi khi đăng ký:', error);

            // Kiểm tra lỗi phản hồi từ API
            if (error.response) {
                console.error('Mã lỗi phản hồi:', error.response.status);
                console.error('Dữ liệu lỗi phản hồi:', error.response.data);

                if (error.response.data && error.response.data.message) {
                    throw new Error(error.response.data.message);
                }
            }

            // Nếu là lỗi từ các bước xử lý trên
            if (error.message) {
                throw error;
            }

            // Lỗi chung
            throw new Error('Đăng ký không thành công. Vui lòng thử lại sau.');
        }
    };

    // Phương thức xác thực quyền admin một lần duy nhất
    const verifyAdminOnce = async (): Promise<boolean> => {
        try {
            console.log('[AuthContext] Đang xác thực quyền admin trên server...');

            // Kiểm tra trong cache trước
            if (adminVerified) {
                console.log('[AuthContext] Admin đã được xác thực trước đó');
                return true;
            }

            const userInfo = getUserInfoFromStorage();
            if (!userInfo || !userInfo.user) {
                console.log('[AuthContext] Không tìm thấy thông tin user trong storage khi xác thực admin');
                return false;
            }

            console.log('[AuthContext] User info khi xác thực admin:', {
                userId: userInfo.user.id,
                userName: userInfo.user.userName,
                isAdmin: userInfo.user.isAdmin,
                token: userInfo.accessToken ? `${userInfo.accessToken.substring(0, 10)}...` : 'không có'
            });

            if (!userInfo.user.isAdmin) {
                console.log('[AuthContext] User không có quyền admin trong dữ liệu local');
                return false;
            }

            // Gọi API để xác thực quyền admin
            console.log('[AuthContext] Gọi API để xác thực quyền admin');
            try {
                const verified = await authAPI.verifyAdmin();
                console.log('[AuthContext] Kết quả xác thực admin từ server:', verified);

                setAdminVerified(verified);
                return verified;
            } catch (error) {
                console.error('[AuthContext] Lỗi khi xác thực admin từ server:', error);
                return false;
            }
        } catch (error) {
            console.error('[AuthContext] Lỗi trong quá trình xác thực admin:', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isLoggedIn,
                isAuthenticated: isLoggedIn,
                user,
                adminVerified,
                verifyAdminOnce,
                login,
                logout,
                refreshSession,
                getUserProfile,
                changePassword,
                currentUser: user,
                register
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook để sử dụng context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
