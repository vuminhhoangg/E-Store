import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminModal from '../../components/AdminModal';
import { productAPI } from '../../services/products';
import '../../styles/AdminStyles.css';

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
    warrantyPeriodMonths: number;
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
        description: '',
        warrantyPeriodMonths: 0
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
                console.log('Gọi API lấy danh sách sản phẩm');
                const response = await productAPI.getAllProducts();

                console.log('Kết quả API:', response.data);
                if (response && response.data) {
                    const responseData = response.data;
                    if (responseData.success && Array.isArray(responseData.data)) {
                        setProducts(responseData.data);
                    } else if (Array.isArray(responseData)) {
                        setProducts(responseData);
                    } else if (responseData.data && Array.isArray(responseData.data)) {
                        setProducts(responseData.data);
                    } else {
                        console.error('Unrecognized data structure:', responseData);
                        setProducts([]);
                    }
                } else {
                    console.error('No data in response');
                    setProducts([]);
                }
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
                description: selectedProduct.description || '',
                warrantyPeriodMonths: selectedProduct.warrantyPeriodMonths
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
                description: '',
                warrantyPeriodMonths: 0
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
            // Config cho request với token
            const productData = { ...formData };

            let response;
            if (selectedProduct) {
                // Cập nhật sản phẩm
                console.log('Cập nhật sản phẩm:', selectedProduct._id, productData);
                response = await productAPI.updateProduct(selectedProduct._id, productData);

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
                response = await productAPI.createProduct(productData);

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
            // Gọi API để cập nhật số lượng tồn kho
            console.log(`Cập nhật số lượng tồn kho sản phẩm ${productId} thành ${newStock}`);
            await productAPI.updateProduct(productId, {
                countInStock: newStock
            });

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
                // Gọi API để xóa sản phẩm
                console.log(`Xóa sản phẩm ${productId}`);
                await productAPI.deleteProduct(productId);

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
        <div className="container mx-auto px-4 py-6">
            {/* Header with stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                    </div>
                    <div className="admin-stat-title">Tổng sản phẩm</div>
                    <div className="admin-stat-value">{products.length}</div>
                </div>

                <div className="admin-stat-card primary">
                    <div className="admin-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <div className="admin-stat-title">Sản phẩm còn hàng</div>
                    <div className="admin-stat-value">{products.filter(p => p.countInStock > 0).length}</div>
                </div>

                <div className="admin-stat-card secondary">
                    <div className="admin-stat-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="admin-stat-title">Mới thêm (30 ngày)</div>
                    <div className="admin-stat-value">{products.filter(p => {
                        const date = new Date(p.createdAt);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - date.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 30;
                    }).length}</div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="admin-card mb-6">
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Search */}
                        <div className="md:col-span-4 admin-search-container">
                            <svg className="admin-search-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                className="admin-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="md:col-span-4">
                            <select
                                className="admin-form-select"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Add Product Button */}
                        <div className="md:col-span-4 flex justify-end">
                            <button
                                className="admin-btn admin-btn-primary admin-btn-md"
                                onClick={() => {
                                    setSelectedProduct(null);
                                    setModalOpen(true);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm sản phẩm mới
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="admin-card">
                <div className="admin-table-responsive">
                    <table className="admin-table admin-table-striped">
                        <thead className="admin-table-header">
                            <tr>
                                <th>Hình ảnh</th>
                                <th>Tên sản phẩm</th>
                                <th>Giá</th>
                                <th>Danh mục</th>
                                <th>Nhãn hàng</th>
                                <th>Kho</th>
                                <th className="text-right">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr className="admin-table-row">
                                    <td colSpan={7} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="admin-loading-spinner mb-3"></div>
                                            <p className="text-gray-500">Đang tải dữ liệu sản phẩm...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr className="admin-table-row">
                                    <td colSpan={7} className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                            </svg>
                                            <p className="text-gray-500">Không có sản phẩm nào</p>
                                            <button
                                                className="mt-4 admin-btn admin-btn-primary admin-btn-sm"
                                                onClick={() => {
                                                    setSelectedProduct(null);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                Thêm sản phẩm mới
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                // Filter and map through products
                                products
                                    .filter((product) => {
                                        // Filter by category
                                        if (filter !== 'all' && product.category !== filter) {
                                            return false;
                                        }

                                        // Filter by search term
                                        if (searchTerm.trim() !== '' &&
                                            !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            !product.brand.toLowerCase().includes(searchTerm.toLowerCase())) {
                                            return false;
                                        }

                                        return true;
                                    })
                                    .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                                    .map((product) => (
                                        <tr key={product._id} className="admin-table-row">
                                            <td className="w-20">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs text-center">No image</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-medium">{product.name}</td>
                                            <td>{formatPrice(product.price)}</td>
                                            <td>
                                                <span className="admin-badge admin-badge-info">
                                                    {categories.find(cat => cat.id === product.category)?.name || product.category}
                                                </span>
                                            </td>
                                            <td>{product.brand}</td>
                                            <td>
                                                {product.countInStock > 0 ? (
                                                    <span className="admin-badge admin-badge-success">Còn {product.countInStock}</span>
                                                ) : (
                                                    <span className="admin-badge admin-badge-danger">Hết hàng</span>
                                                )}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        className="admin-btn admin-btn-outline admin-btn-sm"
                                                        onClick={() => viewProductDetails(product)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-info admin-btn-sm"
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setModalOpen(true);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-danger admin-btn-sm"
                                                        onClick={() => deleteProduct(product._id)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && products.length > productsPerPage && (
                    <div className="p-4 border-t border-gray-200">
                        <div className="admin-pagination">
                            {Array.from({ length: Math.ceil(products.length / productsPerPage) }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => paginate(index + 1)}
                                    className={`admin-pagination-item ${currentPage === index + 1 ? 'active' : ''}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            <AdminModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                size="lg"
                footer={
                    <div className="flex justify-end space-x-3">
                        <button
                            className="admin-btn admin-btn-light admin-btn-md"
                            onClick={() => setModalOpen(false)}
                        >
                            Hủy
                        </button>
                        <button
                            className="admin-btn admin-btn-primary admin-btn-md"
                            onClick={handleSubmitProduct}
                        >
                            {selectedProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                        </button>
                    </div>
                }
            >
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmitProduct}>
                    <div className="admin-form-group">
                        <label className="admin-form-label">Tên sản phẩm</label>
                        <input
                            type="text"
                            name="name"
                            className="admin-form-input"
                            placeholder="Nhập tên sản phẩm"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Nhãn hàng</label>
                        <input
                            type="text"
                            name="brand"
                            className="admin-form-input"
                            placeholder="Nhập tên nhãn hàng"
                            value={formData.brand}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Danh mục</label>
                        <select
                            name="category"
                            className="admin-form-select"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                        >
                            {categories.filter(cat => cat.id !== 'all').map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Giá (VND)</label>
                        <input
                            type="number"
                            name="price"
                            className="admin-form-input"
                            placeholder="Nhập giá sản phẩm"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                            min="0"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Số lượng trong kho</label>
                        <input
                            type="number"
                            name="countInStock"
                            className="admin-form-input"
                            placeholder="Nhập số lượng"
                            value={formData.countInStock}
                            onChange={handleInputChange}
                            required
                            min="0"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label className="admin-form-label">Thời gian bảo hành (tháng)</label>
                        <input
                            type="number"
                            name="warrantyPeriodMonths"
                            className="admin-form-input"
                            placeholder="Nhập thời gian bảo hành"
                            value={formData.warrantyPeriodMonths}
                            onChange={handleInputChange}
                            required
                            min="0"
                        />
                    </div>

                    <div className="admin-form-group md:col-span-2">
                        <label className="admin-form-label">Link hình ảnh</label>
                        <input
                            type="text"
                            name="image"
                            className="admin-form-input"
                            placeholder="Nhập đường dẫn hình ảnh"
                            value={formData.image}
                            onChange={handleInputChange}
                        />
                        {formData.image && (
                            <div className="mt-2">
                                <img
                                    src={formData.image}
                                    alt="Product preview"
                                    className="h-32 object-cover rounded-lg border border-gray-200"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+Image+URL';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="admin-form-group md:col-span-2">
                        <label className="admin-form-label">Mô tả sản phẩm</label>
                        <textarea
                            name="description"
                            className="admin-form-textarea"
                            rows={5}
                            placeholder="Nhập mô tả sản phẩm"
                            value={formData.description}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>
                </form>
            </AdminModal>

            {/* Product Details Modal */}
            <AdminModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title="Chi tiết sản phẩm"
                size="lg"
            >
                {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-6">
                                {selectedProduct.image ? (
                                    <img
                                        src={selectedProduct.image}
                                        alt={selectedProduct.name}
                                        className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
                                        <span className="text-gray-400">Không có hình ảnh</span>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold mb-2">Thông tin chung</h3>
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                    <div className="text-gray-600">Mã sản phẩm:</div>
                                    <div className="font-medium">{selectedProduct._id}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                    <div className="text-gray-600">Ngày tạo:</div>
                                    <div className="font-medium">{formatDate(selectedProduct.createdAt)}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-gray-600">Nhãn hàng:</div>
                                    <div className="font-medium">{selectedProduct.brand}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                            <div className="flex items-center mb-4 space-x-2">
                                <span className="admin-badge admin-badge-info">
                                    {categories.find(cat => cat.id === selectedProduct.category)?.name || selectedProduct.category}
                                </span>
                                {selectedProduct.countInStock > 0 ? (
                                    <span className="admin-badge admin-badge-success">Còn hàng</span>
                                ) : (
                                    <span className="admin-badge admin-badge-danger">Hết hàng</span>
                                )}
                            </div>

                            <div className="mb-6">
                                <div className="text-3xl font-bold text-blue-600 mb-1">
                                    {formatPrice(selectedProduct.price)}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Số lượng trong kho: <span className="font-medium">{selectedProduct.countInStock}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Thời gian bảo hành: <span className="font-medium">{selectedProduct.warrantyPeriodMonths} tháng</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold mb-2">Mô tả sản phẩm</h3>
                                <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
                                    {selectedProduct.description || <span className="text-gray-500 italic">Không có mô tả</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

export default ProductManagement; 