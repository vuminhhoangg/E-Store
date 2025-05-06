import axios from 'axios';

interface LoginResponse {
    success: boolean;
    message?: string;
    user?: {
        id: string;
        userName: string;
        phoneNumber: string;
        diaChi: string;
        isAdmin: boolean;
    };
    tokens?: {
        accessToken: string;
        refreshToken: string;
    };
    expiresAt?: number;
}

interface TokenResponse {
    success: boolean;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    expiresIn?: number;
}

interface RegisterResponse {
    success: boolean;
    message?: string;
}

interface UserInfo {
    user: any;
    accessToken: string;
    refreshToken: string;
    expiresAt?: number;
}

// Đảm bảo BASE_URL phù hợp với backend
// Kiểm tra và log hostname để debug
console.log('Current hostname:', window.location.hostname);
console.log('Current environment:', import.meta.env.MODE);
const API_URL = import.meta.env.MODE === 'production'
    ? '/api'  // Trong môi trường production, API và frontend nên được phục vụ từ cùng nguồn
    : 'http://localhost:8080/api';  // Trong môi trường development

console.log('Using API URL:', API_URL);

// Thời gian trước khi token hết hạn mà chúng ta nên làm mới (5 phút)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 phút tính bằng milliseconds

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true, // Cho phép gửi cookies
    timeout: 15000, // 15s timeout
});

// Một flag để theo dõi quá trình refresh token
let isRefreshing = false;
// Hàng đợi các request đang chờ refresh token
let refreshSubscribers: ((token: string) => void)[] = [];
// Biến để theo dõi số lần thử refresh token
let refreshRetryCount = 0;
// Số lần thử tối đa
const MAX_REFRESH_RETRIES = 3;

// Hàm thêm request vào hàng đợi
const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Hàm xử lý các request đang chờ sau khi refresh token thành công
const onRefreshed = (accessToken: string) => {
    refreshSubscribers.forEach(callback => callback(accessToken));
    refreshSubscribers = [];
};

// Lấy thông tin user từ storage
const getUserInfo = (): UserInfo | null => {
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (!userInfoStr) return null;

    try {
        return JSON.parse(userInfoStr) as UserInfo;
    } catch (error) {
        console.error('Error parsing userInfo:', error);
        return null;
    }
};

// Cập nhật thông tin user trong storage
const updateUserInfo = (userInfo: UserInfo, rememberMe: boolean = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    // Xóa thông tin cũ từ cả hai storage để tránh trùng lặp
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');

    // Lưu thông tin mới
    storage.setItem('userInfo', JSON.stringify(userInfo));
};

// Hàm để refresh token
const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string, refreshToken: string }> => {
    try {
        console.log("Đang refresh token...");
        const response = await axios.post<TokenResponse>(
            `${API_URL}/auth/refresh-token`,
            { refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000 // Thêm timeout 10 giây
            }
        );

        if (!response.data.success || !response.data.tokens) {
            console.error("Refresh token không thành công:", response.data);
            throw new Error('Invalid response from refresh token endpoint');
        }

        console.log("Refresh token thành công");
        // Reset counter khi refresh thành công
        refreshRetryCount = 0;
        return response.data.tokens;
    } catch (error: any) {
        console.error('Token refresh failed:', error);

        // Chỉ tăng retry count nếu là lỗi mạng hoặc timeout
        if (error.code === 'ECONNABORTED' || !error.response) {
            refreshRetryCount++;
        }

        if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
            console.error(`Đã thử refresh token ${refreshRetryCount} lần không thành công, đăng xuất`);
            // Không gọi logout trực tiếp từ đây, để AuthContext xử lý
            throw new Error('MAX_REFRESH_RETRIES_EXCEEDED');
        }

        throw error;
    }
};

// Hàm kiểm tra token sắp hết hạn
const isTokenExpiringSoon = (userInfo: UserInfo): boolean => {
    if (!userInfo.expiresAt) return false;

    // Kiểm tra nếu token sẽ hết hạn trong khoảng thời gian định trước
    return userInfo.expiresAt - TOKEN_REFRESH_THRESHOLD < Date.now();
};

// Cache cho admin API verification để tránh kiểm tra liên tục
let adminVerificationCache = {
    verified: false,
    timestamp: 0,
    userId: null as string | null,
};

// Xóa cache khi đăng xuất hoặc đăng nhập
export const clearAdminVerificationCache = () => {
    adminVerificationCache = {
        verified: false,
        timestamp: 0,
        userId: null,
    };
};

// Thời gian cache có hiệu lực (15 phút)
const ADMIN_VERIFICATION_CACHE_DURATION = 15 * 60 * 1000;

// Hàm để chủ động làm mới token nếu sắp hết hạn
const refreshTokenIfNeeded = async (): Promise<string | null> => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.refreshToken) return null;

    // Kiểm tra cache nếu là admin
    if (userInfo.user?.isAdmin && adminVerificationCache.verified &&
        adminVerificationCache.userId === userInfo.user.id &&
        Date.now() - adminVerificationCache.timestamp < ADMIN_VERIFICATION_CACHE_DURATION) {
        console.log('[API] Sử dụng cache xác thực admin');
        return userInfo.accessToken;
    }

    // Nếu đang trong quá trình refresh token, hoặc token chưa sắp hết hạn
    if (isRefreshing || !isTokenExpiringSoon(userInfo)) {
        return userInfo.accessToken;
    }

    try {
        isRefreshing = true;
        console.log("Token sắp hết hạn, tiến hành refresh token...");
        const tokens = await refreshAccessToken(userInfo.refreshToken);

        // Cập nhật token mới vào storage
        const updatedUserInfo = {
            ...userInfo,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: Date.now() + 15 * 60 * 1000 // 15 phút
        };

        const isRemembered = localStorage.getItem('userInfo') !== null;
        updateUserInfo(updatedUserInfo, isRemembered);

        onRefreshed(tokens.accessToken);
        return tokens.accessToken;
    } catch (error) {
        console.error('Failed to proactively refresh token:', error);
        return userInfo.accessToken;
    } finally {
        isRefreshing = false;
    }
};

// Interceptor cho request
api.interceptors.request.use((config) => {
    // Log request details
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        config.params ? `Params: ${JSON.stringify(config.params)}` : '');

    // Lấy token từ localStorage hoặc sessionStorage
    const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (userInfoStr) {
        try {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo.accessToken) {
                config.headers.Authorization = `Bearer ${userInfo.accessToken}`;
            }
        } catch (error) {
            console.error('Error parsing userInfo:', error);
        }
    }
    return config;
}, (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
});

// Interceptor cho response
api.interceptors.response.use(
    (response) => {
        // Log response status and data briefly
        console.log(`[API Response] ${response.status} ${response.config.url}`,
            response.data ? `Success: ${response.data.success}` : '');
        return response;
    },
    async (error) => {
        // Log detailed error information
        console.error(`[API Error] ${error.config?.url || 'Unknown URL'}:`, {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            code: error.response?.data?.code || error.code
        });

        const originalRequest = error.config;

        // Nếu lỗi là 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
                if (userInfoStr) {
                    const userInfo = JSON.parse(userInfoStr);
                    if (userInfo.refreshToken) {
                        // Thử refresh token
                        const response = await api.post('/auth/refresh-token', {
                            refreshToken: userInfo.refreshToken
                        });

                        if (response.data.success) {
                            // Cập nhật token mới
                            const newUserInfo = {
                                ...userInfo,
                                accessToken: response.data.tokens.accessToken,
                                refreshToken: response.data.tokens.refreshToken
                            };

                            // Lưu lại thông tin mới
                            if (localStorage.getItem('userInfo')) {
                                localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
                            } else {
                                sessionStorage.setItem('userInfo', JSON.stringify(newUserInfo));
                            }

                            // Thử lại request ban đầu
                            originalRequest.headers.Authorization = `Bearer ${newUserInfo.accessToken}`;
                            return api(originalRequest);
                        }
                    }
                }
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                // Nếu refresh token thất bại, đăng xuất
                localStorage.removeItem('userInfo');
                sessionStorage.removeItem('userInfo');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Hàm xác thực admin và cache kết quả
export const verifyAdmin = async (): Promise<boolean> => {
    try {
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.user?.isAdmin) {
            console.log('[API] Không tìm thấy thông tin admin');
            return false;
        }

        // Kiểm tra cache
        if (adminVerificationCache.verified &&
            adminVerificationCache.userId === userInfo.user.id &&
            Date.now() - adminVerificationCache.timestamp < ADMIN_VERIFICATION_CACHE_DURATION) {
            console.log('[API] Sử dụng cache xác thực admin');
            return true;
        }

        // Refresh token nếu cần
        const token = await refreshTokenIfNeeded();
        if (!token) {
            console.error('[API] Không thể lấy token mới');
            return false;
        }

        // Gọi API xác thực admin
        const response = await api.get('/auth/verify-admin', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data.success) {
            // Lưu vào cache
            adminVerificationCache = {
                verified: true,
                timestamp: Date.now(),
                userId: userInfo.user.id
            };
            console.log('[API] Đã xác thực admin và cache kết quả');
            return true;
        }

        return false;
    } catch (error: any) {
        console.error('[API] Lỗi khi xác thực admin:', error);
        // Xóa cache nếu có lỗi
        clearAdminVerificationCache();

        // Nếu là lỗi 403 (Forbidden), người dùng không có quyền admin
        if (error.response?.status === 403) {
            console.log('[API] Người dùng không có quyền admin');
            return false;
        }

        return false;
    }
};

export const authAPI = {
    verifyAdmin: verifyAdmin,
    clearAdminVerificationCache: clearAdminVerificationCache,
    login: async (phoneNumber: string, password: string) => {
        try {
            console.log('Gửi yêu cầu đăng nhập với số điện thoại:', phoneNumber);
            const response = await api.post<LoginResponse>('/auth/login', { phoneNumber, password });

            console.log('Phản hồi đăng nhập:', response.data);

            // Nếu login thành công và có token, thêm thời gian hết hạn vào thông tin lưu trữ
            if (response.data.success && response.data.tokens && response.data.user) {
                const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút

                // Đảm bảo trường isAdmin tồn tại
                const user = {
                    ...response.data.user,
                    isAdmin: response.data.user.isAdmin !== undefined ? response.data.user.isAdmin : false
                };

                const userInfo = {
                    user,
                    accessToken: response.data.tokens.accessToken,
                    refreshToken: response.data.tokens.refreshToken,
                    expiresAt
                };
                // Thông tin này sẽ được lưu thông qua phương thức login trong AuthContext
                return {
                    ...response,
                    data: {
                        ...response.data,
                        user,
                        expiresAt
                    }
                };
            }
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },
    register: async (userData: {
        userName: string;
        phoneNumber: string;
        password: string;
        diaChi: string;
    }) => {
        try {
            console.log('Sending register request with data:', {
                ...userData,
                password: '[HIDDEN]' // Không hiển thị mật khẩu trong log
            });

            const response = await api.post<RegisterResponse>('/auth/register', userData);
            console.log('Register response:', response.data);

            // Kiểm tra cấu trúc phản hồi
            if (response.data) {
                if (response.data.success === true) {
                    console.log('Registration successful with server confirmation');
                } else if (response.data.message) {
                    console.log(`Registration response contains message: ${response.data.message}`);
                } else {
                    console.log('Registration response has unexpected structure:', response.data);
                }
            } else {
                console.warn('Registration response is empty or null');
            }

            return response;
        } catch (error: any) {
            console.error('Registration error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Nếu có response từ server, ném lỗi với message từ server
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            // Nếu không, ném lỗi với message mặc định
            throw error;
        }
    },
    logout: (refreshToken?: string) => {
        // Xóa dữ liệu từ cả hai storage
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('userInfo');

        // Gọi API vô hiệu hóa token nếu có
        if (refreshToken) {
            try {
                return api.post('/auth/logout', { refreshToken });
            } catch (error) {
                console.error('Error invalidating token:', error);
            }
        }

        // Thêm logic chuyển hướng người dùng đến trang đăng nhập
        window.location.href = '/login';
    },
    refreshToken: async (refreshToken: string) => {
        try {
            const response = await api.post<TokenResponse>('/auth/refresh-token', { refreshToken });
            if (response.data && response.data.success && response.data.tokens) {
                return {
                    accessToken: response.data.tokens.accessToken,
                    refreshToken: response.data.tokens.refreshToken,
                    expiresIn: response.data.expiresIn || (Date.now() + 15 * 60 * 1000)
                };
            }
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('Error refreshing token:', error);
            throw error;
        }
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        try {
            const response = await api.post('/auth/change-password', { currentPassword, newPassword });
            return response.data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }
};

export default api; 