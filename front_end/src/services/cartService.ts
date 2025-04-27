import api from './api';

export interface CartItem {
    product: any;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export interface Cart {
    _id: string;
    user: string;
    cartItems: CartItem[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

export const cartAPI = {
    // Lấy giỏ hàng của người dùng hiện tại
    getCart: async () => {
        const response = await api.get('/cart');
        return response.data;
    },

    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (productId: string, quantity: number = 1) => {
        const response = await api.post('/cart', { productId, quantity });
        return response.data;
    },

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    updateCartItem: async (productId: string, quantity: number) => {
        console.log(`Updating cart item with ID: ${productId} to quantity: ${quantity}`);
        const response = await api.put(`/cart/${productId}`, { quantity });
        return response.data;
    },

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (productId: string) => {
        const response = await api.delete(`/cart/${productId}`);
        return response.data;
    },

    // Xóa toàn bộ giỏ hàng
    clearCart: async () => {
        const response = await api.delete('/cart');
        return response.data;
    }
};
