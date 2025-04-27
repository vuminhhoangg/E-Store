import api from "./api";

export const warrantyAPI = {
    // Lấy danh sách yêu cầu bảo hành
    getWarranty: async () => {
        const response = await api.get('/warranty');
        return response.data;
    },

    // Tạo yêu cầu bảo hành mới
    createWarranty: async (warrantyData: any) => {
        const response = await api.post('/warranty', warrantyData);
        return response.data;
    },

    // Cập nhật trạng thái yêu cầu bảo hành
    updateWarranty: async (claimId: string, status: string) => {
        const response = await api.put(`/warranty/${claimId}`, { status });
        return response.data;
    },

    // Xóa yêu cầu bảo hành
    deleteWarranty: async (claimId: string) => {
        const response = await api.delete(`/warranty/${claimId}`);
        return response.data;
    }
}
