import axios from 'axios';

interface LoginResponse {
    success: boolean;
    message?: string;
    user?: {
        id: string;
        userName: string;
        phoneNumber: string;
        diaChi: string;
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
// Nếu backend chạy trên localhost port 8080, đây là URL đúng:
const API_URL = 'http://localhost:8080/api';

// Thời gian trước khi token hết hạn mà chúng ta nên làm mới (2 phút)
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 phút tính bằng milliseconds

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10s timeout
});

// Một flag để theo dõi quá trình refresh token
let isRefreshing = false;
// Hàng đợi các request đang chờ refresh token
let refreshSubscribers: ((token: string) => void)[] = [];

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
        const response = await axios.post<TokenResponse>(
            `${API_URL}/auth/refresh-token`,
            { refreshToken },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if (!response.data.success || !response.data.tokens) {
            throw new Error('Invalid response from refresh token endpoint');
        }

        return response.data.tokens;
    } catch (error) {
        console.error('Token refresh failed:', error);
        authAPI.logout();
        throw error;
    }
};

// Hàm kiểm tra token sắp hết hạn
const isTokenExpiringSoon = (userInfo: UserInfo): boolean => {
    if (!userInfo.expiresAt) return false;

    // Kiểm tra nếu token sẽ hết hạn trong 2 phút tới
    return userInfo.expiresAt - TOKEN_REFRESH_THRESHOLD < Date.now();
};

// Hàm để chủ động làm mới token nếu sắp hết hạn
const refreshTokenIfNeeded = async (): Promise<string | null> => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.refreshToken) return null;

    // Nếu đang trong quá trình refresh token, hoặc token chưa sắp hết hạn
    if (isRefreshing || !isTokenExpiringSoon(userInfo)) {
        return userInfo.accessToken;
    }

    try {
        isRefreshing = true;
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

// Chèn token vào header của các request
api.interceptors.request.use(
    async (config) => {
        // Chủ động refresh token nếu sắp hết hạn
        const accessToken = await refreshTokenIfNeeded();

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Xử lý refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        // Nếu là lỗi 401 (Unauthorized) và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Nếu đang refresh token, thêm request vào hàng đợi
            if (isRefreshing) {
                return new Promise(resolve => {
                    subscribeTokenRefresh(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axios(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const userInfo = getUserInfo();
                if (!userInfo || !userInfo.refreshToken) {
                    throw new Error('No valid refresh token found');
                }

                const isRemembered = localStorage.getItem('userInfo') !== null;

                // Gọi API để refresh token
                const tokens = await refreshAccessToken(userInfo.refreshToken);

                // Cập nhật token mới vào storage
                const updatedUserInfo = {
                    ...userInfo,
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: Date.now() + 15 * 60 * 1000 // 15 phút
                };

                updateUserInfo(updatedUserInfo, isRemembered);

                // Thông báo cho các request đang chờ
                onRefreshed(tokens.accessToken);

                // Thêm token mới vào header và thử lại request
                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                // Nếu refresh token thất bại, xóa thông tin user và chuyển về trang login
                console.error('Failed to refresh token:', refreshError);
                authAPI.logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Trường hợp lỗi 403 (Forbidden) - tài khoản đã bị khóa
        if (error.response?.status === 403) {
            authAPI.logout();
            // Thêm thông báo lỗi cụ thể
            window.alert('Tài khoản của bạn đã bị khóa hoặc không có quyền truy cập. Vui lòng liên hệ quản trị viên.');
        }

        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (phoneNumber: string, password: string) => {
        try {
            console.log('Gửi yêu cầu đăng nhập với số điện thoại:', phoneNumber);
            const response = await api.post<LoginResponse>('/auth/login', { phoneNumber, password });

            console.log('Phản hồi đăng nhập:', response.data);

            // Nếu login thành công và có token, thêm thời gian hết hạn vào thông tin lưu trữ
            if (response.data.success && response.data.tokens && response.data.user) {
                const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút
                const userInfo = {
                    user: response.data.user,
                    accessToken: response.data.tokens.accessToken,
                    refreshToken: response.data.tokens.refreshToken,
                    expiresAt
                };
                // Thông tin này sẽ được lưu thông qua phương thức login trong AuthContext
                return {
                    ...response,
                    data: {
                        ...response.data,
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

export const productAPI = {
    getProducts: (keyword = '', pageNumber = '') => {
        return api.get(`/products?keyword=${keyword}&pageNumber=${pageNumber}`);
    },
    getProductById: (id: string) => {
        return api.get(`/products/${id}`);
    },
    createProduct: (productData: any) => {
        return api.post('/products', productData);
    },
    updateProduct: (id: string, productData: any) => {
        return api.put(`/products/${id}`, productData);
    },
    deleteProduct: (id: string) => {
        return api.delete(`/products/${id}`);
    },
};

export default api; 