// API URL cho môi trường phát triển và sản xuất
export const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : 'https://api.yourwebsite.com';

// Các cấu hình khác
export const APP_CONFIG = {
    APP_NAME: 'E-Store',
    CURRENCY: 'VND',
    TAX_RATE: 0.1, // 10%
    IMAGE_BASE_URL: `${API_URL}/uploads`,
    PAGINATION_LIMIT: 12,
    ADMIN_PREFIX: '/admin',
    AUTH_TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_info',
    CART_KEY: 'cart',
    DEFAULT_AVATAR: '/images/default-avatar.png'
}; 