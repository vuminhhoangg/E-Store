import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../components/AuthContext'
import { productAPI } from '../services/products'
import { cartAPI } from '../services/cartService'
import { toast } from 'react-toastify'
import { Product } from '../model/model'

const ProductPage = () => {
    const { id } = useParams<{ id: string }>()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [qty, setQty] = useState(1)
    const [activeTab, setActiveTab] = useState('description')
    const { isAuthenticated } = useContext(AuthContext)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true)
                if (!id) return

                const response = await productAPI.getProductById(id)
                if (response.data && response.data.data) {
                    setProduct(response.data.data)
                } else {
                    setError('Không thể tải thông tin sản phẩm')
                }
                setLoading(false)
            } catch (error) {
                console.error('Error fetching product:', error)
                setError('Không thể tải thông tin sản phẩm')
                setLoading(false)
            }
        }

        fetchProduct()
    }, [id])

    const addToCartHandler = async () => {
        if (!product) return

        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
            navigate('/login', { state: { from: `/product/${id}` } })
            return
        }

        try {
            const response = await cartAPI.addToCart(product._id, qty)
            if (response.success) {
                toast.success('Đã thêm sản phẩm vào giỏ hàng!')
            } else {
                toast.error(response.message || 'Không thể thêm sản phẩm vào giỏ hàng')
            }
        } catch (error) {
            console.error('Error adding to cart:', error)
            toast.error('Đã xảy ra lỗi khi thêm vào giỏ hàng')
        }
    }

    // Hiển thị sao đánh giá
    const renderRatingStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            } else {
                stars.push(
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            }
        }
        return stars;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="flex py-3 text-gray-700 mb-4" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li className="inline-flex items-center">
                        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                            </svg>
                            Trang chủ
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                            </svg>
                            <Link to="/products" className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2">Sản phẩm</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                            </svg>
                            <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Chi tiết sản phẩm</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {loading ? (
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-5">
                    <p className="font-medium">Có lỗi xảy ra</p>
                    <p>{error}</p>
                </div>
            ) : product ? (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                        {/* Hình ảnh sản phẩm */}
                        <div className="bg-white p-2 rounded-lg shadow-lg overflow-hidden">
                            <img
                                src={product.image || "https://via.placeholder.com/600x600/eef0f2/304FFE?text=Product"}
                                alt={product.name}
                                className="w-full h-auto object-cover rounded-md"
                            />
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

                            <div className="flex items-center mb-4">
                                <div className="flex mr-2">
                                    {renderRatingStars(product.rating)}
                                </div>
                                <span className="text-gray-600 text-sm">({product.numReviews} đánh giá)</span>
                            </div>

                            <div className="border-t border-b py-4 mb-6">
                                <div className="text-3xl font-bold text-blue-600 mb-4">
                                    {formatPrice(product.price)}
                                </div>

                                <div className="mb-4 flex items-center">
                                    <span className={`inline-block rounded-full h-3 w-3 mr-2 ${product.countInStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-sm text-gray-700">
                                        {product.countInStock > 0 ? `Còn hàng` : 'Hết hàng'}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                                    <span className="font-medium">Mã sản phẩm:</span>
                                    <span>{product._id}</span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                                    <span className="font-medium">Thương hiệu:</span>
                                    <span>{product.brand}</span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                                    <span className="font-medium">Danh mục:</span>
                                    <span>{product.category}</span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <span className="font-medium">Thời gian bảo hành:</span>
                                    <span>{product.warrantyPeriodMonths} tháng</span>
                                </div>

                            </div>

                            {/* Số lượng và nút thêm vào giỏ hàng */}
                            {product.countInStock > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center mb-4">
                                        <label htmlFor="quantity" className="mr-4 text-gray-700 font-medium">Số lượng:</label>
                                        <div className="flex items-center border rounded-md">
                                            <button
                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-l-md"
                                                onClick={() => setQty(Math.max(1, qty - 1))}
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                id="quantity"
                                                className="w-16 text-center border-x py-1"
                                                min="1"
                                                max={product.countInStock}
                                                value={qty}
                                                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                                            />
                                            <button
                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md"
                                                onClick={() => setQty(Math.min(product.countInStock, qty + 1))}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={addToCartHandler}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                        Thêm vào giỏ hàng
                                    </button>
                                </div>
                            )}

                            {/* Trường hợp hết hàng */}
                            {product.countInStock === 0 && (
                                <div className="mb-6">
                                    <button
                                        disabled
                                        className="w-full bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-lg cursor-not-allowed"
                                    >
                                        Sản phẩm hiện đang hết hàng
                                    </button>
                                </div>
                            )}

                            {/* Chính sách */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-3">Chính sách mua hàng</h3>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Giao hàng toàn quốc
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Đổi trả trong 7 ngày
                                    </li>
                                    <li className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Bảo hành chính hãng 12 tháng
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tabs: Mô tả, thông số kỹ thuật, đánh giá */}
                    <div className="mb-10">
                        <div className="border-b">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab('description')}
                                    className={`py-4 px-6 text-center font-medium text-sm focus:outline-none ${activeTab === 'description' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Mô tả sản phẩm
                                </button>
                                <button
                                    onClick={() => setActiveTab('specifications')}
                                    className={`py-4 px-6 text-center font-medium text-sm focus:outline-none ${activeTab === 'specifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Thông số kỹ thuật
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`py-4 px-6 text-center font-medium text-sm focus:outline-none ${activeTab === 'reviews' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Đánh giá ({product.numReviews})
                                </button>
                            </nav>
                        </div>

                        <div className="py-6">
                            {activeTab === 'description' && (
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {activeTab === 'specifications' && (
                                <div className="bg-white rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 bg-gray-50 w-1/3">Thương hiệu</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.brand}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 bg-gray-50">Danh mục</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.category}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 bg-gray-50">Đánh giá</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.rating} sao ({product.numReviews} đánh giá)</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 bg-gray-50">Tình trạng</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.countInStock > 0 ? 'Còn hàng' : 'Hết hàng'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    {product.numReviews > 0 ? (
                                        <div className="space-y-4">
                                            {/* Hiển thị các đánh giá mẫu */}
                                            <div className="border-b pb-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="flex mr-2">
                                                        {renderRatingStars(5)}
                                                    </div>
                                                    <span className="text-gray-700 font-medium">Khách hàng</span>
                                                </div>
                                                <p className="text-gray-600">Sản phẩm rất tốt, đóng gói cẩn thận, giao hàng nhanh!</p>
                                                <span className="text-xs text-gray-500">12/06/2023</span>
                                            </div>

                                            <div className="border-b pb-4">
                                                <div className="flex items-center mb-2">
                                                    <div className="flex mr-2">
                                                        {renderRatingStars(4)}
                                                    </div>
                                                    <span className="text-gray-700 font-medium">Khách hàng</span>
                                                </div>
                                                <p className="text-gray-600">Tốt nhưng giá hơi cao</p>
                                                <span className="text-xs text-gray-500">05/06/2023</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">Chưa có đánh giá nào cho sản phẩm này</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sản phẩm liên quan */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Sản phẩm tương tự</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {/* Placeholder: Đây là nơi hiển thị sản phẩm tương tự */}
                            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <Link to={`/product/placeholder-1`}>
                                    <img
                                        src="https://th.bing.com/th/id/OIP.wT0k0RT1XZVEqjqHth4fcwHaHa?rs=1&pid=ImgDetMain"
                                        alt="Related product"
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-gray-800 font-medium text-lg mb-2 line-clamp-2">Sản phẩm tương tự</h3>
                                        <p className="text-blue-600 font-bold">{formatPrice(product.price * 0.9)}</p>
                                    </div>
                                </Link>
                            </div>

                            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <Link to={`/product/placeholder-2`}>
                                    <img
                                        src="https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/HRU02?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1723849801683"
                                        alt="Related product"
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-gray-800 font-medium text-lg mb-2 line-clamp-2">Sản phẩm tương tự</h3>
                                        <p className="text-blue-600 font-bold">{formatPrice(product.price * 1.1)}</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-gray-700">Không tìm thấy sản phẩm</h2>
                    <p className="mt-2 text-gray-500">Sản phẩm không tồn tại hoặc đã bị xóa</p>
                    <Link to="/products" className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Xem các sản phẩm khác
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ProductPage; 