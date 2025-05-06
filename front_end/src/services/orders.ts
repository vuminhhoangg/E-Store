import api from './api';
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
    notes?: string;
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
    createOrder: async (orderData: OrderData) => {
        try {
            console.log('Sending order data to API:', orderData);
            const response = await api.post('/orders', orderData, { headers: headers() });
            console.log('API response:', JSON.stringify(response.data, null, 2));

            // Kiểm tra cấu trúc response
            if (response.data) {
                if (response.data.data && response.data.data._id) {
                    console.log('Order ID from response:', response.data.data._id);
                } else if (response.data._id) {
                    console.log('Order ID directly from response:', response.data._id);
                    // Chuẩn hóa dữ liệu trả về để phù hợp với cấu trúc mong muốn
                    response.data = {
                        success: true,
                        data: response.data
                    };
                } else {
                    console.warn('Response does not contain order ID as expected:', response.data);
                }
            } else {
                console.error('Invalid response format from create order API');
            }

            return response;
        } catch (error: any) {
            console.error('Error creating order:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error headers:', error.response?.headers);
            throw error;
        }
    },

    getOrderById: async (orderId: string) => {
        try {
            console.log('Gọi API lấy thông tin đơn hàng với ID:', orderId);
            const response = await api.get(`/orders/${orderId}`, { headers: headers() });
            console.log('Phản hồi API đơn hàng:', JSON.stringify(response.data, null, 2));

            // Kiểm tra cấu trúc phản hồi
            if (response.data && (response.data.data || (response.data.success && response.data.data))) {
                console.log('Tìm thấy thông tin đơn hàng:', response.data.data ? 'OK' : 'Không có dữ liệu');
            } else {
                console.warn('Cấu trúc phản hồi API đơn hàng không như mong đợi:', response.data);
            }

            return response;
        } catch (error: any) {
            console.error('Lỗi khi lấy thông tin đơn hàng:', error);
            console.error('Chi tiết lỗi:', error.response?.data);
            console.error('Mã lỗi:', error.response?.status);
            throw error;
        }
    },

    getUserOrders: async () => {
        const response = await api.get('/orders/user', { headers: headers() });
        return response.data;
    },

    updatePaymentStatus: async (orderId: string, paymentData: { isPaid: boolean; paymentResult?: any }) => {
        const response = await api.put(`/orders/${orderId}/pay`, paymentData, { headers: headers() });
        return response.data;
    },

    getAllOrders: async (page = 1, limit = 10) => {
        const response = await api.get(`/orders/admin?page=${page}&limit=${limit}`, { headers: headers() });
        return response.data;
    },

    updateDeliveryStatus: async (orderId: string, status: string) => {
        const response = await api.put(`/orders/${orderId}/delivery`, { status }, { headers: headers() });
        return response.data;
    },

    startWarranty: async (orderId: string) => {
        const response = await api.put(`/orders/${orderId}/warranty/start`, {}, { headers: headers() });
        return response.data;
    },

    getWarrantyInfo: async (serialNumber: string) => {
        const response = await api.get(`/warranty/${serialNumber}`, { headers: headers() });
        return response.data;
    },

    createWarrantyClaim: async (orderItemId: string, data: { description: string; status: string; images?: string[] }) => {
        const response = await api.post(`/warranty/claims/${orderItemId}`, data, { headers: headers() });
        return response.data;
    },

    updateWarrantyStatus: async (claimId: string, status: string, notes?: string) => {
        const response = await api.put(`/warranty/claims/${claimId}`, { status, notes }, { headers: headers() });
        return response.data;
    },

    getAllWarrantyClaims: async (page = 1, limit = 10, status?: string) => {
        let url = `/warranty/claims?page=${page}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        const response = await api.get(url, { headers: headers() });
        return response.data;
    },
}