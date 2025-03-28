import axios from 'axios';
import addressData from '../data/address-data.json';

// Cấu trúc dữ liệu từ API Việt Nam
interface Ward {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    short_codename: string;
}

interface District {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    short_codename: string;
    wards: Ward[];
}

interface Province {
    name: string;
    code: number;
    codename: string;
    division_type: string;
    phone_code: number;
    districts: District[];
}

// API URL cho trường hợp muốn sử dụng API thay vì dữ liệu JSON
const BASE_URL = 'https://vietnam-administrative-division-json-server-swart.vercel.app';

// Tạo axios instance với timeout và retry
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // Tăng timeout lên 15 giây
});

// Thêm interceptor để log requests
api.interceptors.request.use(config => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
});

// Thêm interceptor để log responses
api.interceptors.response.use(
    response => {
        console.log(`[API Response Success] ${response.config.url} - Status: ${response.status}`);
        return response;
    },
    error => {
        console.error(`[API Response Error] ${error.config?.url} - Error: ${error.message}`);
        return Promise.reject(error);
    }
);

// Hàm kiểm tra kết nối tới API
export const checkApiConnection = async () => {
    try {
        const start = Date.now();
        const response = await api.get('/province?_limit=1');
        const duration = Date.now() - start;
        return {
            status: response.status,
            success: true,
            responseTime: duration
        };
    } catch (error) {
        console.error('API connection check failed:', error);
        return {
            status: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

// Tạo một cache lưu trữ dữ liệu đã xử lý
console.log('Pre-processing address data...');

// Chuyển đổi dữ liệu từ API
const processedProvinces = (addressData as Province[]).map(province => ({
    id: province.code.toString(),
    name: province.name,
    level: province.division_type
}));

// Tạo cache quận/huyện
const districtsCache = new Map();
(addressData as Province[]).forEach(province => {
    if (province.districts) {
        const districts = province.districts.map(district => ({
            id: district.code.toString(),
            name: district.name,
            level: district.division_type,
            provinceId: province.code.toString()
        }));
        districtsCache.set(province.code.toString(), districts);
    }
});

// Tạo cache phường/xã
const wardsCache = new Map();
(addressData as Province[]).forEach(province => {
    if (province.districts) {
        province.districts.forEach(district => {
            if (district.wards) {
                const wards = district.wards.map(ward => ({
                    id: ward.code.toString(),
                    name: ward.name,
                    level: ward.division_type,
                    districtId: district.code.toString()
                }));
                wardsCache.set(district.code.toString(), wards);
            }
        });
    }
});

console.log(`Processed ${processedProvinces.length} provinces, ${districtsCache.size} district sets, ${wardsCache.size} ward sets`);

export const addressService = {
    async getProvinces() {
        try {
            console.log('Fetching provinces from local data...');
            return processedProvinces;
        } catch (error) {
            console.error('Error fetching provinces:', error);
            throw error;
        }
    },

    async getDistricts(provinceId: string) {
        try {
            if (!provinceId) throw new Error('ProvinceId is required');
            console.log(`Fetching districts for province ${provinceId} from local data...`);

            const districts = districtsCache.get(provinceId) || [];
            return districts;
        } catch (error) {
            console.error(`Error fetching districts for province ${provinceId}:`, error);
            throw error;
        }
    },

    async getWards(districtId: string) {
        try {
            if (!districtId) throw new Error('DistrictId is required');
            console.log(`Fetching wards for district ${districtId} from local data...`);

            const wards = wardsCache.get(districtId) || [];
            return wards;
        } catch (error) {
            console.error(`Error fetching wards for district ${districtId}:`, error);
            throw error;
        }
    }
}; 