import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminModal from '../../components/AdminModal';
import { AuthContext } from '../../context/AuthContext';

// Định nghĩa interface User cho component này
interface User {
    _id: string;
    userName: string;
    phoneNumber: string;
    diaChi: string;
    isAdmin: boolean;
    isBlocked?: boolean;
    createdAt?: string;
}

// Interface cho người dùng từ AuthContext
interface AuthUser {
    id: string;
    userName: string;
    phoneNumber: string;
    diaChi: string;
    isAdmin?: boolean;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [refreshData, setRefreshData] = useState(false);

    // Lấy thông tin người dùng hiện tại từ AuthContext
    const authContext = useContext(AuthContext);

    // State cho form
    const [formData, setFormData] = useState({
        userName: '',
        phoneNumber: '',
        diaChi: '',
        password: '',
        isAdmin: false
    });

    useEffect(() => {
        // Tải danh sách người dùng
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Import api từ services
                const { default: api } = await import('../../services/api');

                console.log('Đang gửi yêu cầu lấy danh sách người dùng...');
                // Sử dụng instance api đã được cấu hình sẵn
                const response = await api.get('/users');

                console.log('Phản hồi từ API:', response.data);

                if (response.data && response.data.data) {
                    setUsers(response.data.data || []);
                    setTotalUsers(response.data.count || 0);
                } else {
                    console.error('Phản hồi API không đúng định dạng:', response.data);
                    toast.error('Dữ liệu người dùng không đúng định dạng');
                }
                setLoading(false);
            } catch (error: any) {
                console.error('Lỗi khi tải danh sách người dùng:', error);
                if (error.response?.data?.message) {
                    toast.error(`Lỗi: ${error.response.data.message}`);
                } else {
                    toast.error('Không thể tải danh sách người dùng');
                }
                setLoading(false);
            }
        };

        fetchUsers();
    }, [refreshData]);

    // Xóa người dùng
    const deleteUser = async (userId: string) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
            return;
        }

        try {
            // Import api từ services
            const { default: api } = await import('../../services/api');

            console.log('Đang gửi yêu cầu xóa người dùng ID:', userId);
            const response = await api.delete(`/auth/delete-user/${userId}`);
            console.log('Phản hồi xóa người dùng:', response.data);

            // Cập nhật UI
            setUsers(users.filter(user => user._id !== userId));
            toast.success('Người dùng đã được xóa thành công');
        } catch (error: any) {
            console.error('Lỗi khi xóa người dùng:', error);

            if (error.response?.data?.message) {
                toast.error(`Lỗi: ${error.response.data.message}`);
            } else {
                toast.error('Không thể xóa người dùng');
            }
        }
    };

    // Xử lý khi chọn người dùng để sửa
    useEffect(() => {
        if (selectedUser) {
            setFormData({
                userName: selectedUser.userName,
                phoneNumber: selectedUser.phoneNumber,
                diaChi: selectedUser.diaChi || '',
                password: '',
                isAdmin: selectedUser.isAdmin
            });
        } else {
            // Reset form khi thêm mới
            setFormData({
                userName: '',
                phoneNumber: '',
                diaChi: '',
                password: '',
                isAdmin: false
            });
        }
    }, [selectedUser]);

    // Xử lý thay đổi input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Xử lý submit form
    const handleSubmitUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Import api từ services
            const { default: api } = await import('../../services/api');

            // Chuẩn bị dữ liệu gửi lên server
            const userData = { ...formData };

            // Nếu không cập nhật mật khẩu thì loại bỏ
            if (!userData.password) {
                delete userData.password;
            }

            console.log('Đang gửi dữ liệu người dùng:', {
                ...userData,
                password: userData.password ? '******' : undefined
            });

            let response;
            if (selectedUser) {
                // Cập nhật người dùng
                response = await api.put(`/users/${selectedUser._id}`, userData);
                console.log('Phản hồi cập nhật người dùng:', response.data);

                // Cập nhật UI
                setUsers(users.map(user =>
                    user._id === selectedUser._id ? {
                        ...user,
                        userName: userData.userName,
                        phoneNumber: userData.phoneNumber,
                        diaChi: userData.diaChi,
                        isAdmin: userData.isAdmin
                    } : user
                ));

                toast.success('Người dùng đã được cập nhật thành công');
            } else {
                // Thêm người dùng mới
                response = await api.post('/auth/register', userData);
                console.log('Phản hồi tạo người dùng mới:', response.data);

                // Cập nhật UI
                if (response.data && response.data.data) {
                    setUsers([...users, response.data.data]);
                    toast.success('Người dùng mới đã được tạo thành công');
                } else {
                    console.error('Phản hồi API không đúng định dạng:', response.data);
                    toast.error('Dữ liệu phản hồi không đúng định dạng');
                }
            }

            setModalOpen(false);
            setRefreshData(prev => !prev);
        } catch (error: any) {
            console.error('Lỗi khi xử lý người dùng:', error);

            if (error.response?.data?.message) {
                toast.error(`Lỗi: ${error.response.data.message}`);
            } else {
                toast.error('Không thể xử lý yêu cầu');
            }
        }
    };

    // Format ngày tháng
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
    };

    // Lọc users theo từ khóa tìm kiếm
    const filteredUsers = users.filter(user => {
        const searchString = searchTerm.toLowerCase();
        return (
            user.userName.toLowerCase().includes(searchString) ||
            user.phoneNumber.toLowerCase().includes(searchString) ||
            (user.diaChi && user.diaChi.toLowerCase().includes(searchString))
        );
    });

    // Logic phân trang
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Quản lý người dùng</h2>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setModalOpen(true);
                            }}
                            className="admin-btn-primary flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm người dùng
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tìm kiếm theo tên, số điện thoại, địa chỉ..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách người dùng */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="admin-table-card">
                    <div className="admin-table-responsive-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="user-table-col-id">ID</th>
                                    <th className="user-table-col-name">Tên người dùng</th>
                                    <th className="user-table-col-phone">Số điện thoại</th>
                                    <th className="user-table-col-address">Địa chỉ</th>
                                    <th className="user-table-col-role">Loại tài khoản</th>
                                    <th className="user-table-col-date">Ngày tạo</th>
                                    <th className="user-table-col-actions">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentUsers.map((user: User) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="user-id font-medium text-blue-600 max-w-[100px] truncate">
                                            {user._id}
                                        </td>
                                        <td className="font-medium">{user.userName}</td>
                                        <td>{user.phoneNumber}</td>
                                        <td className="max-w-[200px] truncate">{user.diaChi || "Chưa cập nhật"}</td>
                                        <td>
                                            {user.isAdmin ? (
                                                <span className="admin-badge-blue">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="admin-badge-gray">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Khách hàng
                                                </span>
                                            )}
                                        </td>
                                        <td>{user.createdAt ? formatDate(user.createdAt) : "N/A"}</td>
                                        <td>
                                            <div className="order-action-buttons">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setModalOpen(true);
                                                    }}
                                                    className="order-action-button-view"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    className="order-action-button-update text-red-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            Không tìm thấy người dùng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị{' '}
                                    <span className="font-medium">{indexOfFirstUser + 1}</span>
                                    {' '}-{' '}
                                    <span className="font-medium">
                                        {indexOfLastUser > filteredUsers.length
                                            ? filteredUsers.length
                                            : indexOfLastUser}
                                    </span>{' '}
                                    trong {filteredUsers.length} kết quả
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                    disabled={currentPage === 1}
                                    className={`pagination-button px-3 py-1 ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Trước
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    // Chỉ hiển thị các nút phân trang xung quanh trang hiện tại
                                    if (
                                        i === 0 || // luôn hiển thị trang đầu
                                        i === totalPages - 1 || // luôn hiển thị trang cuối
                                        (i >= currentPage - 2 && i <= currentPage + 2) // hiển thị 2 trang trước và sau trang hiện tại
                                    ) {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => paginate(i + 1)}
                                                className={`pagination-button px-3 py-1 ${currentPage === i + 1
                                                    ? 'pagination-button-active'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    } else if (
                                        (i === 1 && currentPage > 3) || // hiển thị dấu ... sau trang đầu tiên
                                        (i === totalPages - 2 && currentPage < totalPages - 3) // hiển thị dấu ... trước trang cuối cùng
                                    ) {
                                        return (
                                            <span key={i} className="px-2 py-1 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`pagination-button px-3 py-1 ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                                >
                                    Sau
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal thêm/sửa người dùng */}
            <AdminModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
            >
                <form onSubmit={handleSubmitUser}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Tên người dùng</label>
                            <input
                                type="text"
                                id="userName"
                                name="userName"
                                className="admin-input mt-1"
                                value={formData.userName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                            <input
                                type="text"
                                id="phoneNumber"
                                name="phoneNumber"
                                className="admin-input mt-1"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="diaChi" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                            <input
                                type="text"
                                id="diaChi"
                                name="diaChi"
                                className="admin-input mt-1"
                                value={formData.diaChi}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                {selectedUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="admin-input mt-1"
                                value={formData.password}
                                onChange={handleInputChange}
                                required={!selectedUser}
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isAdmin"
                                name="isAdmin"
                                className="admin-checkbox"
                                checked={formData.isAdmin}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="isAdmin" className="ml-2 block text-sm font-medium text-gray-700">
                                Tài khoản Admin
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="admin-btn-secondary"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="admin-btn-primary"
                        >
                            {selectedUser ? "Cập nhật" : "Thêm mới"}
                        </button>
                    </div>
                </form>
            </AdminModal>
        </div>
    );
};

export default UserManagement; 