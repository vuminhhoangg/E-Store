import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

interface Product {
    _id: string;
    name: string;
    image: string;
    description: string;
    brand: string;
    category: string;
    price: number;
    countInStock: number;
    rating: number;
    numReviews: number;
}

const ProductPage = () => {
    const { id } = useParams<{ id: string }>()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [qty, setQty] = useState(1)
    const [activeTab, setActiveTab] = useState('description')
    const [showNotification, setShowNotification] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true)
                const { data } = await axios.get(`http://localhost:8000/api/products/${id}`)
                setProduct(data)
                setLoading(false)
            } catch (error) {
                setError('Không thể tải thông tin sản phẩm')
                setLoading(false)
            }
        }

        fetchProduct()
    }, [id])

    const addToCartHandler = () => {
        if (product) {
            // Lưu thông tin sản phẩm vào localStorage như một phiên bản đơn giản của giỏ hàng
            const cartItems = localStorage.getItem('cartItems')
                ? JSON.parse(localStorage.getItem('cartItems') || '[]')
                : []

            const existItem = cartItems.find((x: any) => x.product === product._id)

            if (existItem) {
                const updatedItems = cartItems.map((x: any) =>
                    x.product === product._id ? {
                        ...x,
                        qty: Number(qty)
                    } : x
                )
                localStorage.setItem('cartItems', JSON.stringify(updatedItems))
            } else {
                const newItem = {
                    product: product._id,
                    name: product.name,
                    image: product.image,
                    price: product.price,
                    countInStock: product.countInStock,
                    qty: Number(qty)
                }
                localStorage.setItem('cartItems', JSON.stringify([...cartItems, newItem]))
            }

            // Hiển thị thông báo đã thêm vào giỏ hàng
            setShowNotification(true)
            setTimeout(() => {
                setShowNotification(false)
            }, 2000)
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

    return (
        <div className="container mx-auto px-4">
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

            {/* Thông báo thêm vào giỏ hàng thành công */}
            {showNotification && (
                <div className="fixed top-20 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md animate-fadeIn z-50">
                    <div className="flex items-center">
                        <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Đã thêm sản phẩm vào giỏ hàng!</span>
                    </div>
                </div>
            )}

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
                        <div className="bg-white p-2 rounded-lg shadow-md overflow-hidden">
                            <img
                                src={product.image || "https://via.placeholder.com/600x600/eef0f2/304FFE?text=Product"}
                                alt={product.name}
                                className="w-full h-auto object-cover"
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
                                    {product.price.toLocaleString('vi-VN')} đ
                                </div>

                                <div className="mb-4 flex items-center">
                                    <span className={`inline-block rounded-full h-3 w-3 mr-2 ${product.countInStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-sm text-gray-700">
                                        {product.countInStock > 0 ? `Còn hàng (${product.countInStock})` : 'Hết hàng'}
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

                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <span className="font-medium">Danh mục:</span>
                                    <span>{product.category}</span>
                                </div>
                            </div>

                            {product.countInStock > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center mb-4">
                                        <label className="block text-gray-700 mr-3">Số lượng:</label>
                                        <div className="relative">
                                            <select
                                                value={qty}
                                                onChange={(e) => setQty(Number(e.target.value))}
                                                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {[...Array(Math.min(product.countInStock, 10)).keys()].map((x) => (
                                                    <option key={x + 1} value={x + 1}>
                                                        {x + 1}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={addToCartHandler}
                                            className="btn-primary flex items-center justify-center py-3"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Thêm vào giỏ
                                        </button>
                                        <button
                                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded transition duration-200 flex items-center justify-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Mua ngay
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-6">
                                <h3 className="font-semibold flex items-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Thông tin hữu ích:
                                </h3>
                                <ul className="text-sm list-disc list-inside space-y-1">
                                    <li>Bảo hành chính hãng 24 tháng</li>
                                    <li>Giao hàng miễn phí toàn quốc</li>
                                    <li>Đổi trả trong vòng 7 ngày</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-10">
                        <div className="border-b">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab('description')}
                                    className={`px-6 py-3 text-base font-medium ${activeTab === 'description'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Mô tả sản phẩm
                                </button>
                                <button
                                    onClick={() => setActiveTab('specifications')}
                                    className={`px-6 py-3 text-base font-medium ${activeTab === 'specifications'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Thông số kỹ thuật
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-6 py-3 text-base font-medium ${activeTab === 'reviews'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Đánh giá ({product.numReviews})
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'description' && (
                                <div className="prose max-w-none">
                                    <p>{product.description}</p>
                                </div>
                            )}

                            {activeTab === 'specifications' && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-4 py-3 bg-gray-50 text-gray-700 font-medium w-1/3">Thương hiệu</td>
                                                <td className="px-4 py-3">{product.brand}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-gray-50 text-gray-700 font-medium">Danh mục</td>
                                                <td className="px-4 py-3">{product.category}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-gray-50 text-gray-700 font-medium">Bảo hành</td>
                                                <td className="px-4 py-3">24 tháng</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 bg-gray-50 text-gray-700 font-medium">Tình trạng</td>
                                                <td className="px-4 py-3">{product.countInStock > 0 ? 'Còn hàng' : 'Hết hàng'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    {product.numReviews > 0 ? (
                                        <div className="space-y-4">
                                            <div className="border-b pb-4">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <h3 className="font-medium">Người dùng ẩn danh</h3>
                                                        <div className="flex items-center mt-1">
                                                            <div className="flex text-yellow-400 mr-2">
                                                                {renderRatingStars(5)}
                                                            </div>
                                                            <span className="text-gray-500 text-sm">2 ngày trước</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-green-600 text-sm font-medium">Đã mua hàng</div>
                                                </div>
                                                <p className="mt-2 text-gray-700">Sản phẩm rất tốt, giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop dài dài.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>
                                    )}

                                    <div className="mt-8">
                                        <h3 className="font-semibold text-lg mb-4">Gửi đánh giá của bạn</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">Đánh giá</label>
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button key={star} className="text-gray-300 hover:text-yellow-400 transition">
                                                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block mb-2 text-sm font-medium text-gray-700">Nhận xét của bạn</label>
                                                <textarea rows={4} className="form-control" placeholder="Nhập nhận xét của bạn về sản phẩm này..."></textarea>
                                            </div>
                                            <button className="btn-primary">Gửi đánh giá</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Related Products */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Sample related products */}
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="product-card group">
                                    <div className="relative overflow-hidden">
                                        <Link to="#">
                                            <img
                                                src={`https://via.placeholder.com/300x300/eef0f2/304FFE?text=Related+${item}`}
                                                alt={`Sản phẩm liên quan ${item}`}
                                                className="w-full h-48 object-cover transform group-hover:scale-105 transition duration-500"
                                            />
                                        </Link>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex mb-2">
                                            {renderRatingStars(4)}
                                            <span className="text-gray-500 text-sm ml-1">(10)</span>
                                        </div>
                                        <Link to="#" className="block font-semibold mb-2 text-gray-800 hover:text-blue-600 transition duration-200">
                                            Sản phẩm liên quan {item}
                                        </Link>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-blue-600">1.290.000 đ</span>
                                            <button className="btn-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default ProductPage 