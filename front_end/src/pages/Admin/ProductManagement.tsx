import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminModal from '../../components/AdminModal';

// Định nghĩa interfaces
interface Category {
    id: string;
    name: string;
}

interface Product {
    _id: string;
    name: string;
    image: string;
    category: string;
    price: number;
    countInStock: number;
    brand: string;
    rating: number;
    createdAt: string;
    description: string;
}

const ProductManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [refreshData, setRefreshData] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State cho form
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: 'smartphones',
        price: 0,
        countInStock: 0,
        image: '',
        description: ''
    });

    // Danh sách các danh mục sản phẩm
    const categories: Category[] = [
        { id: 'all', name: 'Tất cả' },
        { id: 'smartphones', name: 'Điện thoại' },
        { id: 'laptops', name: 'Laptop' },
        { id: 'tablets', name: 'Máy tính bảng' },
        { id: 'watches', name: 'Đồng hồ' },
        { id: 'accessories', name: 'Phụ kiện' },
    ];

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Kiểm tra token
                const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
                if (!userInfoStr) {
                    console.error('Không tìm thấy thông tin đăng nhập');
                    setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                    setLoading(false);
                    return;
                }

                const userInfo = JSON.parse(userInfoStr);
                if (!userInfo.accessToken) {
                    console.error('Không tìm thấy access token');
                    setError('Phiên đăng nhập không hợp lệ');
                    setLoading(false);
                    return;
                }

                console.log('Gọi API lấy danh sách sản phẩm');
                const response = await axios.get('/api/products', {
                    headers: {
                        Authorization: `Bearer ${userInfo.accessToken}`
                    }
                });

                console.log('Kết quả API:', response.data);
                setProducts(response.data.data || []);
                setLoading(false);
            } catch (error: any) {
                console.error('Lỗi khi lấy danh sách sản phẩm:', error);

                // Xử lý các loại lỗi khác nhau
                if (error.response) {
                    // Server trả về response với status code nằm ngoài phạm vi 2xx
                    console.error('Lỗi response:', {
                        data: error.response.data,
                        status: error.response.status,
                        headers: error.response.headers
                    });
                    setError(`Lỗi từ server: ${error.response.data?.message || error.response.statusText || 'Không xác định'}`);
                } else if (error.request) {
                    // Request đã được gửi nhưng không nhận được response
                    console.error('Không nhận được phản hồi từ server');
                    setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
                } else {
                    // Có lỗi khi thiết lập request
                    console.error('Lỗi khi thiết lập request:', error.message);
                    setError(`Lỗi: ${error.message}`);
                }

                setLoading(false);
            }
        };

        fetchProducts();
    }, [refreshData]);

    // Xử lý khi chọn sản phẩm để sửa
    useEffect(() => {
        if (selectedProduct) {
            setFormData({
                name: selectedProduct.name,
                brand: selectedProduct.brand,
                category: selectedProduct.category,
                price: selectedProduct.price,
                countInStock: selectedProduct.countInStock,
                image: selectedProduct.image,
                description: selectedProduct.description || ''
            });
        } else {
            // Reset form khi thêm mới
            setFormData({
                name: '',
                brand: '',
                category: 'smartphones',
                price: 0,
                countInStock: 0,
                image: '',
                description: ''
            });
        }
    }, [selectedProduct]);

    // Xử lý thay đổi input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Chuyển đổi giá trị sang số cho các trường số
        if (name === 'price' || name === 'countInStock') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Xử lý submit form
    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Kiểm tra token
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
            if (!userInfoStr) {
                console.error('Không tìm thấy thông tin đăng nhập');
                toast.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                return;
            }

            const userInfo = JSON.parse(userInfoStr);
            if (!userInfo.accessToken) {
                console.error('Không tìm thấy access token');
                toast.error('Phiên đăng nhập không hợp lệ');
                return;
            }

            // Config cho request với token
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.accessToken}`,
                },
            };

            // Chuẩn bị dữ liệu gửi lên server
            const productData = { ...formData };

            let response;
            if (selectedProduct) {
                // Cập nhật sản phẩm
                console.log('Cập nhật sản phẩm:', selectedProduct._id, productData);
                response = await axios.put(`/api/admin/products/${selectedProduct._id}`, productData, config);

                // Cập nhật UI
                setProducts(products.map(product =>
                    product._id === selectedProduct._id ? {
                        ...product,
                        ...productData
                    } : product
                ));

                toast.success('Đã cập nhật thông tin sản phẩm thành công');
            } else {
                // Thêm sản phẩm mới
                console.log('Thêm sản phẩm mới:', productData);
                response = await axios.post('/api/admin/products', productData, config);

                if (response.data && response.data.data) {
                    // Thêm sản phẩm mới vào danh sách
                    setProducts([...products, response.data.data]);
                }

                toast.success('Đã thêm sản phẩm mới thành công');
            }

            // Đóng modal sau khi hoàn thành
            setModalOpen(false);
        } catch (error: any) {
            console.error('Lỗi khi xử lý dữ liệu sản phẩm:', error);

            if (error.response?.data?.message) {
                toast.error(`Lỗi: ${error.response.data.message}`);
            } else {
                toast.error('Không thể lưu thông tin sản phẩm');
            }
        }
    };

    // Cập nhật số lượng tồn kho
    const updateStock = async (productId: string, newStock: number) => {
        try {
            // Kiểm tra token
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
            if (!userInfoStr) {
                console.error('Không tìm thấy thông tin đăng nhập');
                toast.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                return;
            }

            const userInfo = JSON.parse(userInfoStr);
            if (!userInfo.accessToken) {
                console.error('Không tìm thấy access token');
                toast.error('Phiên đăng nhập không hợp lệ');
                return;
            }

            // Config cho request với token
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.accessToken}`,
                },
            };

            // Gọi API để cập nhật số lượng tồn kho
            console.log(`Cập nhật số lượng tồn kho sản phẩm ${productId} thành ${newStock}`);
            await axios.put(`/api/admin/products/${productId}`, {
                countInStock: newStock
            }, config);

            // Cập nhật UI
            setProducts(products.map(product =>
                product._id === productId ? { ...product, countInStock: newStock } : product
            ));

            toast.success('Đã cập nhật số lượng sản phẩm thành công');
        } catch (error: any) {
            console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);

            if (error.response?.data?.message) {
                toast.error(`Lỗi: ${error.response.data.message}`);
            } else {
                toast.error('Không thể cập nhật số lượng sản phẩm');
            }
        }
    };

    // Xóa sản phẩm
    const deleteProduct = async (productId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                // Kiểm tra token
                const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
                if (!userInfoStr) {
                    console.error('Không tìm thấy thông tin đăng nhập');
                    toast.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                    return;
                }

                const userInfo = JSON.parse(userInfoStr);
                if (!userInfo.accessToken) {
                    console.error('Không tìm thấy access token');
                    toast.error('Phiên đăng nhập không hợp lệ');
                    return;
                }

                // Config cho request với token
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.accessToken}`,
                    },
                };

                // Gọi API để xóa sản phẩm
                console.log(`Xóa sản phẩm ${productId}`);
                await axios.delete(`/api/admin/products/${productId}`, config);

                // Cập nhật UI
                setProducts(products.filter(product => product._id !== productId));

                toast.success('Đã xóa sản phẩm thành công');
            } catch (error: any) {
                console.error('Lỗi khi xóa sản phẩm:', error);

                if (error.response?.data?.message) {
                    toast.error(`Lỗi: ${error.response.data.message}`);
                } else {
                    toast.error('Không thể xóa sản phẩm');
                }
            }
        }
    };

    // Format tiền tệ VND
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Format ngày tháng
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };

    // Lọc sản phẩm theo từ khóa tìm kiếm và danh mục
    const filteredProductsList = products.filter((product: Product) => {
        const { name, brand, category: productCategory } = product;
        const term = searchTerm.toLowerCase();
        const categoryMatch = filter === 'all' || productCategory === filter;

        return categoryMatch && (
            name.toLowerCase().includes(term) ||
            brand.toLowerCase().includes(term)
        );
    });

    // Logic phân trang
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProductsList.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProductsList.length / productsPerPage);

    // Xử lý khi chuyển trang
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Thêm hàm xem chi tiết sản phẩm
    const viewProductDetails = (product: Product) => {
        setSelectedProduct(product);
        setDetailsModalOpen(true);
    };

    return (
        <div>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-5" role="alert">
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Danh sách sản phẩm</h2>

                    <div className="flex flex-col md:flex-row gap-3">
                        <button
                            onClick={() => {
                                setSelectedProduct(null);
                                setModalOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm sản phẩm mới
                        </button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="col-span-1 lg:col-span-2">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tìm kiếm theo tên sản phẩm, mã sản phẩm..."
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

                    <div className="col-span-1">
                        <select
                            className="w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Danh sách sản phẩm */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hình ảnh
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mã sản phẩm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tên sản phẩm
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Danh mục
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Giá bán
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tồn kho
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đánh giá
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentProducts.map((product: Product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <img src={product.image} alt={product.name} className="h-12 w-12 object-cover rounded" />
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {product._id}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-xs text-gray-500">{product.brand}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                            {categories.find(cat => cat.id === product.category)?.name || product.category}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {formatPrice(product.price)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${product.countInStock === 0 ? 'bg-red-100 text-red-800' :
                                                    product.countInStock <= 5 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {product.countInStock}
                                                </span>
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                    onClick={() => {
                                                        const newStock = prompt("Nhập số lượng mới:", product.countInStock.toString());
                                                        if (newStock !== null && !isNaN(Number(newStock))) {
                                                            updateStock(product._id, Number(newStock));
                                                        }
                                                    }}
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <span className="text-yellow-500 mr-1">★</span>
                                                <span>{product.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    onClick={() => viewProductDetails(product)}
                                                >
                                                    Chi tiết
                                                </button>
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => deleteProduct(product._id)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị{' '}
                                    <span className="font-medium">{indexOfFirstProduct + 1}</span>
                                    {' '}-{' '}
                                    <span className="font-medium">
                                        {indexOfLastProduct > filteredProductsList.length
                                            ? filteredProductsList.length
                                            : indexOfLastProduct}
                                    </span>{' '}
                                    trong {filteredProductsList.length} kết quả
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    Trước
                                </button>
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => paginate(index + 1)}
                                        className={`px-3 py-1 rounded-md ${currentPage === index + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal thêm/sửa sản phẩm */}
            <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}>
                <form onSubmit={handleSubmitProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Thương hiệu</label>
                            <input
                                type="text"
                                id="brand"
                                name="brand"
                                required
                                value={formData.brand}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                            <select
                                id="category"
                                name="category"
                                required
                                value={formData.category}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                {categories.filter(cat => cat.id !== 'all').map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá bán (VNĐ)</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                min="0"
                                step="1000"
                                required
                                value={formData.price}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="countInStock" className="block text-sm font-medium text-gray-700">Số lượng tồn kho</label>
                            <input
                                type="number"
                                id="countInStock"
                                name="countInStock"
                                min="0"
                                required
                                value={formData.countInStock}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Đường dẫn hình ảnh</label>
                            <input
                                type="text"
                                id="image"
                                name="image"
                                required
                                value={formData.image}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả sản phẩm</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                        >
                            {selectedProduct ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </AdminModal>

            {/* Modal xem chi tiết sản phẩm */}
            <AdminModal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Chi tiết sản phẩm">
                {selectedProduct && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="w-full h-auto rounded-lg shadow-md object-cover"
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Thông tin cơ bản</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <p><span className="font-medium">ID:</span> {selectedProduct._id}</p>
                                        <p><span className="font-medium">Tên sản phẩm:</span> {selectedProduct.name}</p>
                                        <p><span className="font-medium">Thương hiệu:</span> {selectedProduct.brand}</p>
                                        <p><span className="font-medium">Danh mục:</span> {categories.find(cat => cat.id === selectedProduct.category)?.name || selectedProduct.category}</p>
                                        <p><span className="font-medium">Giá bán:</span> {formatPrice(selectedProduct.price)}</p>
                                        <p>
                                            <span className="font-medium">Số lượng tồn kho:</span>
                                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${selectedProduct.countInStock === 0 ? 'bg-red-100 text-red-800' :
                                                    selectedProduct.countInStock <= 5 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'}`}
                                            >
                                                {selectedProduct.countInStock}
                                            </span>
                                        </p>
                                        <p><span className="font-medium">Đánh giá:</span> <span className="flex items-center"><span className="text-yellow-500 mr-1">★</span> {selectedProduct.rating}/5</span></p>
                                        <p><span className="font-medium">Ngày tạo:</span> {formatDate(selectedProduct.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Mô tả sản phẩm</h3>
                            <p className="text-gray-700 whitespace-pre-line">{selectedProduct.description || 'Không có mô tả chi tiết.'}</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setDetailsModalOpen(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    setModalOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
                            >
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

export default ProductManagement; 