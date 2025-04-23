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
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
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

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
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
                            className="admin-input pl-10"
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
                <div className="admin-card">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tên người dùng</th>
                                    <th>Số điện thoại</th>
                                    <th>Địa chỉ</th>
                                    <th>Loại tài khoản</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user: User) => (
                                    <tr key={user._id}>
                                        <td className="max-w-[100px] truncate">
                                            {user._id}
                                        </td>
                                        <td className="font-medium">{user.userName}</td>
                                        <td>{user.phoneNumber}</td>
                                        <td className="max-w-[200px] truncate">{user.diaChi || "Chưa cập nhật"}</td>
                                        <td>
                                            {user.isAdmin ? (
                                                <span className="admin-badge-blue">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="admin-badge-gray">
                                                    Khách hàng
                                                </span>
                                            )}
                                        </td>
                                        <td>{user.createdAt ? formatDate(user.createdAt) : "N/A"}</td>
                                        <td>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-gray-500">
                                            Không tìm thấy người dùng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredUsers.length > usersPerPage && (
                        <div className="mt-4 flex justify-center">
                            <nav className="flex items-center space-x-1">
                                <button
                                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Trước
                                </button>

                                {[...Array(Math.ceil(filteredUsers.length / usersPerPage))].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`px-3 py-1 rounded-md ${currentPage === i + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => {
                                        const maxPage = Math.ceil(filteredUsers.length / usersPerPage);
                                        paginate(currentPage < maxPage ? currentPage + 1 : maxPage);
                                    }}
                                    disabled={currentPage === Math.ceil(filteredUsers.length / usersPerPage)}
                                    className={`px-3 py-1 rounded-md ${currentPage === Math.ceil(filteredUsers.length / usersPerPage)
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    Sau
                                </button>
                            </nav>
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