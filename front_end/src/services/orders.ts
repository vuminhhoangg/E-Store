import axios from 'axios';
import { API_URL } from '../config';
import { getAuthToken } from '../utils/auth';

const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
});

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    warrantyPeriodMonths: number;
}

interface ShippingAddress {
    fullName: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    phone: string;
    email: string;
}

interface OrderData {
    userId: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    itemsPrice: number;
    shippingPrice: number;
    totalPrice: number;
    notes?: string;
    isPaid: boolean;
    paidAt: Date | null;
    warrantyStartDate: Date | null;
}

export const orderAPI = {
    // Tạo đơn hàng mới
    createOrder: async (orderData: OrderData) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/orders`,
                orderData,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Lấy thông tin đơn hàng theo ID
    getOrderById: async (orderId: string) => {
        try {
            const response = await axios.get(
                `${API_URL}/api/orders/${orderId}`,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Lấy tất cả đơn hàng của người dùng hiện tại
    getUserOrders: async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/orders/user`,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Cập nhật trạng thái thanh toán
    updatePaymentStatus: async (orderId: string, paymentData: { isPaid: boolean; paymentResult?: any }) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/orders/${orderId}/pay`,
                paymentData,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // (Admin) Lấy tất cả đơn hàng
    getAllOrders: async (page = 1, limit = 10) => {
        try {
            const response = await axios.get(
                `${API_URL}/api/orders/admin?page=${page}&limit=${limit}`,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // (Admin) Cập nhật trạng thái giao hàng
    updateDeliveryStatus: async (orderId: string, status: string) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/orders/${orderId}/delivery`,
                { status },
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // (Admin) Bắt đầu bảo hành
    startWarranty: async (orderId: string) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/orders/${orderId}/warranty/start`,
                {},
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Lấy thông tin bảo hành của sản phẩm
    getWarrantyInfo: async (serialNumber: string) => {
        try {
            const response = await axios.get(
                `${API_URL}/api/warranty/${serialNumber}`,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // (Admin) Tạo yêu cầu bảo hành
    createWarrantyClaim: async (orderItemId: string, data: {
        description: string;
        status: string;
        images?: string[];
    }) => {
        try {
            const response = await axios.post(
                `${API_URL}/api/warranty/claims/${orderItemId}`,
                data,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // (Admin) Cập nhật trạng thái bảo hành
    updateWarrantyStatus: async (claimId: string, status: string, notes?: string) => {
        try {
            const response = await axios.put(
                `${API_URL}/api/warranty/claims/${claimId}`,
                { status, notes },
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },

    // (Admin) Lấy tất cả yêu cầu bảo hành
    getAllWarrantyClaims: async (page = 1, limit = 10, status?: string) => {
        try {
            let url = `${API_URL}/api/warranty/claims?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }
            const response = await axios.get(
                url,
                { headers: headers() }
            );
            return response;
        } catch (error) {
            throw error;
        }
    },
}; 