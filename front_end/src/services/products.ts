import api from "./api";

export const productAPI = {
    getProducts: (keyword = '', pageNumber = '') => {
        return api.get(`/products?keyword=${keyword}&page=${pageNumber}`);
    },
    getAllProducts: () => {
        return api.get('/products?page=0');
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
    getTopProducts: async (category = '', limit = 8) => {
        try {
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (limit) params.append('limit', limit.toString());

            const url = `/products/top?${params}`;
            console.log('Calling top products API:', url);

            const response = await api.get(url);
            return response;
        } catch (error) {
            console.error('Error fetching top products:', error);
            throw error;
        }
    }
};