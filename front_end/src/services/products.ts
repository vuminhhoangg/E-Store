import api from "./api";

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
    getTopProducts: (category = '', limit = 8) => {
        return api.get(`/products/top?category=${category}&limit=${limit}`)
            .then(response => {
                console.log('API Response:', response.data);
                return response;
            })
            .catch(error => {
                console.error('Error fetching top products:', error);
                throw error;
            });
    }
};