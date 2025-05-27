import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI } from '../services/products';

// Temporary Star Rating component
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(rating)
                        ? 'text-yellow-400'
                        : i < rating
                            ? 'text-yellow-400 relative'
                            : 'text-gray-300'
                        }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    {i < Math.floor(rating) || i >= rating ? (
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    ) : (
                        // Half star
                        <>
                            <defs>
                                <linearGradient id={`halfStar${i}`}>
                                    <stop offset="50%" stopColor="#FACC15" />
                                    <stop offset="50%" stopColor="#D1D5DB" />
                                </linearGradient>
                            </defs>
                            <path
                                fill={`url(#halfStar${i})`}
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                            />
                        </>
                    )}
                </svg>
            ))}
        </div>
    );
};

// Temporary Loading component
const Loading = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
            {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full border border-gray-100 animate-pulse">
                    <div className="relative pt-[100%] bg-gray-200"></div>
                    <div className="p-4">
                        <div className="flex gap-2 mb-4">
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-6 bg-gray-200 rounded w-24"></div>
                            <div className="h-5 bg-gray-200 rounded w-12"></div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Temporary Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    const maxPageButtons = 3; // Giảm số lượng nút hiển thị để đơn giản hơn
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    // Generate array of page numbers to show
    const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
        <div className="flex items-center justify-center gap-3">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm border border-gray-200'
                    }`}
                aria-label="Trang trước"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-2">
                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 shadow-sm border border-gray-200"
                        >
                            1
                        </button>
                        {startPage > 2 && (
                            <span className="text-gray-500 flex items-center justify-center">...</span>
                        )}
                    </>
                )}

                {pageNumbers.map(pageNumber => (
                    <button
                        key={pageNumber}
                        onClick={() => onPageChange(pageNumber)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-medium ${currentPage === pageNumber
                            ? 'bg-blue-600 text-white shadow border border-blue-700'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-sm'
                            }`}
                        aria-current={currentPage === pageNumber ? 'page' : undefined}
                    >
                        {pageNumber}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && (
                            <span className="text-gray-500 flex items-center justify-center">...</span>
                        )}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 shadow-sm border border-gray-200"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
            </div>

            {/* Next Button */}
            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 shadow-sm border border-gray-200'
                    }`}
                aria-label="Trang sau"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

interface Product {
    _id: string;
    name: string;
    image: string;
    category: string;
    price: number;
    countInStock: number;
    brand: string;
    rating: number;
    numReviews: number;
    description: string;
    warrantyPeriodMonths: number;
    createdAt: string;
}

interface Category {
    id: string;
    name: string;
}

const categories: Category[] = [
    { id: 'all', name: 'Tất cả sản phẩm' },
    { id: 'smartphones', name: 'Điện thoại' },
    { id: 'laptops', name: 'Laptop' },
    { id: 'tablets', name: 'Máy tính bảng' },
    { id: 'watches', name: 'Đồng hồ' },
    { id: 'accessories', name: 'Phụ kiện' },
];

const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'priceAsc', label: 'Giá tăng dần' },
    { value: 'priceDesc', label: 'Giá giảm dần' },
    { value: 'bestRating', label: 'Đánh giá cao nhất' },
    { value: 'bestSelling', label: 'Bán chạy nhất' },
];

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(12);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);

    // Trạng thái mở/đóng cho filter dropdown
    const [filterOpen, setFilterOpen] = useState(false);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await productAPI.getAllProducts();
                console.log('Products API Response:', response);

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
                console.error('Error fetching products:', error);
                setError(
                    error.response?.data?.message ||
                    'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.'
                );
                setProducts([]);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Get top 8 products with highest stock from each category
    const getBestSellingProducts = () => {
        const categoryGroups: { [key: string]: Product[] } = {};

        // Group products by category
        products.forEach(product => {
            if (!categoryGroups[product.category]) {
                categoryGroups[product.category] = [];
            }
            categoryGroups[product.category].push(product);
        });

        // Get exactly top 8 products with highest stock from each category
        const bestSellingIds = new Set<string>();
        Object.entries(categoryGroups).forEach(([category, categoryProducts]) => {
            const sortedByStock = categoryProducts
                .filter(p => p.countInStock > 0)
                .sort((a, b) => b.countInStock - a.countInStock)
                .slice(0, 8); // Exactly 8 products with highest stock from each category

            sortedByStock.forEach(product => bestSellingIds.add(product._id));
        });

        return Array.from(bestSellingIds);
    };

    const bestSellingProductIds = getBestSellingProducts();

    // Filter products
    const filteredProducts = products.filter((product) => {
        const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
        return matchesCategory && matchesSearch && matchesPrice;
    });

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'priceAsc':
                return a.price - b.price;
            case 'priceDesc':
                return b.price - a.price;
            case 'bestRating':
                return b.rating - a.rating;
            case 'bestSelling':
                return b.countInStock - a.countInStock;
            case 'newest':
            default:
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
    });

    // Pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

    // Handle page change
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Reset filters
    const resetFilters = () => {
        setActiveCategory('all');
        setSearchTerm('');
        setSortBy('newest');
        setPriceRange([0, 100000000]);
        setCurrentPage(1);
        setFilterOpen(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Tất cả sản phẩm</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Khám phá nhiều loại sản phẩm công nghệ chất lượng cao với giá cả hợp lý
                    </p>
                </div>

                {/* Filter and Search Section */}
                <div className="bg-white shadow-lg rounded-xl p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-gray-800">Bộ lọc sản phẩm</h2>
                            {(activeCategory !== 'all' || priceRange[0] !== 0 || priceRange[1] !== 100000000) && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    Đang lọc
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors focus:outline-none"
                        >
                            <span className="mr-2">{filterOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}</span>
                            <svg
                                className={`w-5 h-5 transition-transform duration-300 ${filterOpen ? 'transform rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Search always visible */}
                    <div className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                    if (e.target.value && !filterOpen) setFilterOpen(true);
                                }}
                                placeholder="Tìm kiếm sản phẩm..."
                                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                            <div className="absolute left-3 top-3 text-gray-400">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Filters in dropdown */}
                    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 overflow-hidden transition-all duration-300 ${filterOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {/* Category Filter */}
                        <div className="lg:col-span-4">
                            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                                Danh mục
                            </h3>
                            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => {
                                            setActiveCategory(category.id);
                                            setCurrentPage(1);
                                            if (category.id !== 'all') {
                                                setFilterOpen(true); // Giữ dropdown mở khi chọn danh mục
                                            }
                                        }}
                                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${activeCategory === category.id
                                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div className="lg:col-span-4">
                            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Khoảng giá
                            </h3>
                            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                <button
                                    onClick={() => {
                                        setPriceRange([0, 5000000]);
                                        setCurrentPage(1);
                                        setFilterOpen(true); // Giữ dropdown mở
                                    }}
                                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${priceRange[1] === 5000000
                                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    Dưới 5 triệu
                                </button>
                                <button
                                    onClick={() => {
                                        setPriceRange([5000000, 10000000]);
                                        setCurrentPage(1);
                                        setFilterOpen(true); // Giữ dropdown mở
                                    }}
                                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${priceRange[0] === 5000000 && priceRange[1] === 10000000
                                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    5 - 10 triệu
                                </button>
                                <button
                                    onClick={() => {
                                        setPriceRange([10000000, 20000000]);
                                        setCurrentPage(1);
                                        setFilterOpen(true); // Giữ dropdown mở
                                    }}
                                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${priceRange[0] === 10000000 && priceRange[1] === 20000000
                                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    10 - 20 triệu
                                </button>
                                <button
                                    onClick={() => {
                                        setPriceRange([20000000, 100000000]);
                                        setCurrentPage(1);
                                        setFilterOpen(true); // Giữ dropdown mở
                                    }}
                                    className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${priceRange[0] === 20000000
                                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    Trên 20 triệu
                                </button>
                            </div>
                        </div>

                        {/* Sort and Reset Filter */}
                        <div className="lg:col-span-4">
                            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                Sắp xếp theo
                            </h3>
                            <div className="space-y-4">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                >
                                    {sortOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={resetFilters}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center shadow-sm hover:text-blue-700"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(activeCategory !== 'all' || searchTerm || priceRange[0] !== 0 || priceRange[1] !== 100000000) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {activeCategory !== 'all' && (
                                <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                    {categories.find(cat => cat.id === activeCategory)?.name}
                                    <button
                                        onClick={() => {
                                            setActiveCategory('all');
                                            setFilterOpen(true); // Mở dropdown khi xóa bộ lọc
                                        }}
                                        className="ml-1 hover:text-blue-600"
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </span>
                            )}

                            {searchTerm && (
                                <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                    Từ khóa: "{searchTerm}"
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterOpen(true); // Mở dropdown khi xóa bộ lọc
                                        }}
                                        className="ml-1 hover:text-blue-600"
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </span>
                            )}

                            {(priceRange[0] !== 0 || priceRange[1] !== 100000000) && (
                                <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                    Giá: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                                    <button
                                        onClick={() => {
                                            setPriceRange([0, 100000000]);
                                            setFilterOpen(true); // Mở dropdown khi xóa bộ lọc
                                        }}
                                        className="ml-1 hover:text-blue-600"
                                    >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </span>
                            )}

                            {(activeCategory !== 'all' || searchTerm || priceRange[0] !== 0 || priceRange[1] !== 100000000) && (
                                <button
                                    onClick={resetFilters}
                                    className="inline-flex items-center bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-gray-200"
                                >
                                    Xóa tất cả
                                    <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="py-2">
                        <Loading />
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
                        <p>{error}</p>
                    </div>
                ) : currentProducts.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-lg text-center">
                        <svg
                            className="w-16 h-16 mx-auto mb-4 text-yellow-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="text-xl font-bold mb-2">Không tìm thấy sản phẩm</h3>
                        <p className="text-yellow-700">
                            Không tìm thấy sản phẩm phù hợp với tiêu chí tìm kiếm của bạn.
                            <br />
                            Hãy thử lại với các bộ lọc khác.
                        </p>
                        <button
                            onClick={resetFilters}
                            className="mt-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 px-6 rounded-full transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentProducts.map((product) => (
                            <div
                                key={product._id}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover-float transition-all duration-300 group flex flex-col h-full border border-gray-100 product-card"
                            >
                                <Link
                                    to={`/product/${product._id}`}
                                    className="block overflow-hidden relative group product-image-wrapper"
                                    aria-label={`Xem chi tiết sản phẩm ${product.name}`}
                                >
                                    <div className="relative pt-[100%] overflow-hidden bg-gray-50">
                                        <img
                                            src={product.image || "https://via.placeholder.com/300x300"}
                                            alt={product.name}
                                            className="absolute inset-0 w-full h-full object-contain p-4 product-image image-fade-in"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://via.placeholder.com/300x300/eef0f2/304FFE?text=No+Image";
                                            }}
                                            onLoad={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.classList.add('loaded');
                                            }}
                                        />
                                        {product.countInStock === 0 && (
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center backdrop-blur-[1px]">
                                                <span className="badge-out-of-stock py-2 px-4 rounded-full shadow-lg font-bold">
                                                    Hết hàng
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 flex flex-col gap-2">
                                            {bestSellingProductIds.includes(product._id) && product.countInStock > 0 && (
                                                <span className="badge-hot py-1 px-2 rounded-full shadow-md text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                                    Bán chạy
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>
                                </Link>
                                <div className="p-4 flex-grow flex flex-col">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="product-badge badge-brand">
                                            {product.brand}
                                        </span>
                                        {product.countInStock > 0 ? (
                                            <span className="product-badge badge-stock">
                                                Còn hàng
                                            </span>
                                        ) : (
                                            <span className="product-badge badge-out-of-stock">
                                                Hết hàng
                                            </span>
                                        )}
                                    </div>
                                    <Link to={`/product/${product._id}`} className="block group mb-2">
                                        <h3 className="text-gray-800 font-medium text-lg line-clamp-2 h-14 group-hover:text-blue-600 transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center mb-2">
                                        <div className="flex text-yellow-400 mr-1">
                                            <StarRating rating={product.rating} />
                                        </div>
                                        <span className="text-gray-600 text-sm">
                                            ({product.numReviews || 0})
                                        </span>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-xl font-bold text-blue-600">
                                                {formatPrice(product.price)}
                                            </div>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                {product.warrantyPeriodMonths} tháng BH
                                            </span>
                                        </div>
                                        <Link
                                            to={`/product/${product._id}`}
                                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-sm hover:shadow-blue-100 hover:shadow-lg font-medium transform hover:translate-y-[-2px] product-detail-button group"
                                            aria-label={`Xem chi tiết sản phẩm ${product.name}`}
                                        >
                                            <div className="relative z-10 flex items-center justify-center">
                                                <svg className="w-5 h-5 mr-2 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="text-white text-base font-semibold">Xem chi tiết</span>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="mt-10 mb-6 flex justify-center">
                        <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage; 