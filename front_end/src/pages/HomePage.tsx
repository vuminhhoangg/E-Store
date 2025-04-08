import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Product } from '../model/model'
import { productAPI } from '../services/products'
import { cartAPI } from '../services/cartService'
import { toast } from 'react-toastify'
import { AuthContext } from '../components/AuthContext'

const HomePage = () => {
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated } = useContext(AuthContext)
    const navigate = useNavigate()
    const [categories] = useState([
        { id: 'all', name: 'Tất cả' },
        { id: 'smartphones', name: 'Điện thoại' },
        { id: 'laptops', name: 'Laptop' },
        { id: 'tablets', name: 'Máy tính bảng' },
        { id: 'watches', name: 'Đồng hồ' },
        { id: 'accessories', name: 'Phụ kiện' },
    ])
    const [activeCategory, setActiveCategory] = useState('all')

    // Banner state
    const [currentBanner, setCurrentBanner] = useState(0)
    const [currentTechNews, setCurrentTechNews] = useState(0)
    const banners = [
        {
            title: 'Công nghệ mới nhất với giá tốt nhất',
            description: 'Khám phá các sản phẩm công nghệ hàng đầu với giá cả cạnh tranh và dịch vụ chăm sóc khách hàng tuyệt vời.',
            image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=600',
            primary: {
                text: 'Mua ngay',
                link: '/products'
            },
            secondary: {
                text: 'Khuyến mãi',
                link: '/sale'
            },
            gradient: 'from-blue-600 to-indigo-700'
        },
        {
            title: 'Khuyến mãi đặc biệt tháng 11',
            description: 'Giảm giá lên đến 50% cho các sản phẩm công nghệ cao cấp. Chỉ áp dụng trong thời gian giới hạn!',
            image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&q=80&w=600',
            primary: {
                text: 'Xem ưu đãi',
                link: '/sale'
            },
            secondary: {
                text: 'Tìm hiểu thêm',
                link: '/about'
            },
            gradient: 'from-purple-600 to-pink-600'
        },
        {
            title: 'Thiết bị mới ra mắt',
            description: 'Trải nghiệm những công nghệ mới nhất với các thiết bị vừa được ra mắt. Đặt hàng ngay hôm nay!',
            image: 'https://th.bing.com/th/id/OIP.p71U8qoYz48wgjjan_cQDwHaD3?rs=1&pid=ImgDetMain',
            primary: {
                text: 'Đặt trước',
                link: '/pre-order'
            },
            secondary: {
                text: 'Chi tiết',
                link: '/new-releases'
            },
            gradient: 'from-green-600 to-teal-600'
        },
        {
            title: 'Phụ kiện thông minh cho ngôi nhà của bạn',
            description: 'Biến ngôi nhà của bạn thành không gian sống thông minh với các thiết bị kết nối và điều khiển bằng giọng nói.',
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=600',
            primary: {
                text: 'Khám phá',
                link: '/smart-home'
            },
            secondary: {
                text: 'Tìm hiểu thêm',
                link: '/guides'
            },
            gradient: 'from-cyan-500 to-blue-500'
        },
        {
            title: 'Trải nghiệm gaming đỉnh cao',
            description: 'Nâng cấp thiết bị gaming của bạn với các sản phẩm chuyên dụng, đem lại trải nghiệm chơi game tốt nhất.',
            image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
            primary: {
                text: 'Mua ngay',
                link: '/gaming'
            },
            secondary: {
                text: 'Xem bộ sưu tập',
                link: '/collections/gaming'
            },
            gradient: 'from-red-500 to-orange-500'
        }
    ]

    // News articles for tech section
    const techNews = [
        {
            id: 1,
            title: 'Apple ra mắt iPhone 16 với công nghệ AI tiên tiến',
            summary: 'Dòng iPhone mới nhất của Apple tích hợp các tính năng AI tiên tiến, mang đến trải nghiệm người dùng hoàn toàn mới.',
            image: 'https://www.iphoned.nl/wp-content/uploads/2024/09/iphone-16-pre-order.jpg',
            date: '05/11/2023',
            url: '/news/1'
        },
        {
            id: 2,
            title: 'Samsung phát triển màn hình gập ba đầu tiên trên thế giới',
            summary: 'Samsung vừa công bố thành công trong việc phát triển màn hình có thể gập ba, mở ra kỷ nguyên mới cho điện thoại thông minh.',
            image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=600',
            date: '28/10/2023',
            url: '/news/2'
        },
        {
            id: 3,
            title: 'Tương lai của công nghệ VR: Từ giải trí đến giáo dục',
            summary: 'Công nghệ thực tế ảo đang mở rộng phạm vi ứng dụng từ giải trí sang các lĩnh vực giáo dục, y tế và đào tạo chuyên nghiệp.',
            image: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?auto=format&fit=crop&q=80&w=600',
            date: '20/10/2023',
            url: '/news/3'
        }
    ]

    // Next banner function
    const nextBanner = () => {
        setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
    }

    // Previous banner function
    const prevBanner = () => {
        setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
    }

    const nextTechNews = () => {
        setCurrentTechNews((prev) => (prev === techNews.length - 1 ? 0 : prev + 1))
    }

    const prevTechNews = () => {
        setCurrentTechNews((prev) => (prev === 0 ? techNews.length - 1 : prev - 1))
    }

    // Auto slide banners
    useEffect(() => {
        const timer = setInterval(() => {
            nextBanner()
        }, 8000)
        return () => clearInterval(timer)
    }, [])

    // Fetch top products based on active category
    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true)
                const category = activeCategory !== 'all' ? activeCategory : ''
                const response = await productAPI.getTopProducts(category)
                console.log('Top products response:', response.data)

                if (response.data && response.data.data && response.data.data.products) {
                    setProducts(response.data.data.products)
                } else if (response.data && response.data.products) {
                    setProducts(response.data.products)
                } else {
                    setProducts([])
                    console.error('Không nhận được định dạng dữ liệu sản phẩm mong đợi')
                }
                setLoading(false)
            } catch (error) {
                console.error('Lỗi khi tải sản phẩm nổi bật:', error)
                setProducts([])
                setLoading(false)
            }
        }

        fetchTopProducts()
    }, [activeCategory])

    // Filter products when category changes
    useEffect(() => {
        if (activeCategory === 'all') {
            setFilteredProducts(products)
        } else {
            const filtered = products.filter(product => product.category === activeCategory)
            setFilteredProducts(filtered)
        }
    }, [activeCategory, products])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    }

    // Hàm xử lý thêm vào giỏ hàng
    const handleAddToCart = async (productId: string) => {
        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng')
            navigate('/login', { state: { from: '/' } })
            return
        }

        try {
            const response = await cartAPI.addToCart(productId, 1)
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

    return (
        <div className="min-h-screen">
            {/* Hero Banner Slider */}
            <div className={`relative bg-gradient-to-r ${banners[currentBanner].gradient} text-white py-16 pb-20 overflow-hidden`}>
                {/* Background decorative elements with animation */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full opacity-10 animate-pulse"></div>
                    <div className="absolute top-1/2 -left-24 w-64 h-64 bg-white rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <div className="animate-fade-in" key={currentBanner}>
                                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 drop-shadow-lg">
                                    {banners[currentBanner].title}
                                </h1>
                                <p className="text-xl mb-8 text-white/90 drop-shadow-md">
                                    {banners[currentBanner].description}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Link
                                        to={banners[currentBanner].primary.link}
                                        className="bg-gradient-to-r from-white to-white/90 text-blue-700 py-3 px-6 md:py-4 md:px-8 rounded-xl font-bold flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg border-2 border-white relative overflow-hidden group z-10"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-blue-100 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                        <span className="relative z-10 flex items-center">
                                            {banners[currentBanner].primary.text}
                                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                            </svg>
                                        </span>
                                    </Link>
                                    <Link
                                        to={banners[currentBanner].secondary.link}
                                        className="bg-black/30 hover:bg-black/40 text-white py-3 px-6 md:py-4 md:px-8 rounded-xl font-bold flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 backdrop-blur-sm border-2 border-white/50 text-lg relative overflow-hidden group z-10"
                                    >
                                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                        <span className="relative z-10">{banners[currentBanner].secondary.text}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="md:w-1/2">
                            <div className="relative overflow-hidden rounded-xl shadow-2xl border-4 border-white/30 transition-all duration-500" key={currentBanner}>
                                <img
                                    src={banners[currentBanner].image}
                                    alt="Banner image"
                                    className="w-full object-cover transition-transform hover:scale-105 duration-700"
                                    style={{ height: '350px' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Improved Navigation Arrows */}
                <button
                    onClick={prevBanner}
                    className="absolute left-4 md:left-10 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 md:p-3 backdrop-blur-sm transition-all hover:scale-105 shadow-md focus:outline-none cursor-pointer border border-white/20 z-20 group"
                    aria-label="Previous banner"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <button
                    onClick={nextBanner}
                    className="absolute right-4 md:right-10 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 md:p-3 backdrop-blur-sm transition-all hover:scale-105 shadow-md focus:outline-none cursor-pointer border border-white/20 z-20 group"
                    aria-label="Next banner"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>

                {/* Banner number indicator */}
                <div className="flex justify-center items-center space-x-3 absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur-sm py-2 px-4 rounded-full z-20 border border-white/20">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentBanner(index)}
                            className={`transition-all duration-300 flex items-center ${currentBanner === index
                                ? 'scale-100'
                                : 'scale-75 opacity-70 hover:opacity-100'
                                }`}
                            aria-label={`Chuyển đến banner ${index + 1}`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${currentBanner === index
                                ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                : 'bg-white/60 hover:bg-white/80'
                                }`}></span>
                        </button>
                    ))}
                </div>

                {/* Decorative wave */}
                <div className="absolute -bottom-1 left-0 right-0 overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full block">
                        <path fill="#fff" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,165.3C960,171,1056,149,1152,133.3C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </div>

            {/* Category Filter */}
            <div className="container mx-auto px-4 py-10 -mt-1">
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-5 py-2.5 rounded-full transition-all duration-300 ${activeCategory === category.id
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Products */}
                <div className="mb-16">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                            {activeCategory === 'all'
                                ? 'Sản phẩm nổi bật nhất'
                                : `${categories.find(c => c.id === activeCategory)?.name} nổi bật nhất`}
                        </h2>
                        <Link to="/products" className="text-blue-600 hover:text-blue-800 font-medium flex items-center group">
                            Xem tất cả
                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, index) => (
                                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                                    <div className="h-40 bg-gray-200"></div>
                                    <div className="p-3">
                                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                                >
                                    <div className="relative overflow-hidden">
                                        <Link to={`/product/${product._id}`}>
                                            <div className="relative aspect-square w-full overflow-hidden">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                                />
                                                {product.countInStock === 0 && (
                                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                                                        Hết hàng
                                                    </div>
                                                )}
                                                <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                                                    Bán chạy
                                                </div>
                                            </div>
                                        </Link>
                                    </div>

                                    <div className="p-4">
                                        <Link to={`/product/${product._id}`}>
                                            <h3 className="text-gray-800 font-medium text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                                                {product.name}
                                            </h3>
                                        </Link>

                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-base font-bold text-blue-600">
                                                {formatPrice(product.price)}
                                            </span>
                                            <div className="flex items-center">
                                                <div className="flex mr-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <span className="text-xs text-gray-500">({product.numReviews})</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(product._id)}
                                            disabled={product.countInStock === 0}
                                            className={`mt-3 w-full py-2 px-3 rounded-md transition-all duration-300 flex items-center justify-center text-sm
                                                ${product.countInStock === 0
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-105'}`}
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                            </svg>
                                            {product.countInStock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm nào trong danh mục này</p>
                        </div>
                    )}
                </div>

                {/* Tech News Section */}
                <div className="mb-16">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Tin tức công nghệ</h2>
                        <Link to="/news" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                            Xem tất cả
                            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {techNews.map((article) => (
                            <div key={article.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <Link to={article.url}>
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-48 object-cover"
                                    />
                                </Link>
                                <div className="p-6">
                                    <div className="text-xs text-gray-500 mb-2">{article.date}</div>
                                    <Link to={article.url}>
                                        <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-blue-600 transition-colors">{article.title}</h3>
                                    </Link>
                                    <p className="text-gray-600 mb-4">{article.summary}</p>
                                    <Link
                                        to={article.url}
                                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                                    >
                                        Đọc tiếp
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Why Choose Us */}
                <div className="mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-12">Tại sao chọn E-Store?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center px-6">
                            <div className="bg-blue-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Giao hàng nhanh chóng</h3>
                            <p className="text-gray-600">Giao hàng trong ngày đối với các đơn tại thành phố lớn và 2-3 ngày với các tỉnh thành khác.</p>
                        </div>

                        <div className="text-center px-6">
                            <div className="bg-green-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Bảo hành chính hãng</h3>
                            <p className="text-gray-600">Tất cả sản phẩm đều được bảo hành chính hãng 12 tháng và hỗ trợ đổi mới trong 30 ngày.</p>
                        </div>

                        <div className="text-center px-6">
                            <div className="bg-red-100 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Hỗ trợ 24/7</h3>
                            <p className="text-gray-600">Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi qua hotline và live chat.</p>
                        </div>
                    </div>
                </div>

                {/* Brands */}
                <div className="mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-8">Thương hiệu nổi bật</h2>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {['Apple', 'Samsung', 'Sony', 'Dell', 'HP', 'Asus'].map((brand, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="text-xl font-bold text-gray-600">{brand}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Newsletter */}
                <div className="bg-gray-100 rounded-xl p-8 md:p-12 mb-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Đăng ký nhận tin</h2>
                        <p className="text-gray-600 mb-8">Nhận thông tin về sản phẩm mới và chương trình khuyến mãi đặc biệt từ E-Store.</p>

                        <div className="flex flex-col sm:flex-row max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Nhập email của bạn"
                                className="flex-grow px-4 py-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-y border-l border-gray-300 shadow-sm text-gray-900 sm:mb-0 mb-2 sm:rounded-l-md rounded-md"
                            />
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors sm:rounded-r-md rounded-md"
                            >
                                Đăng ký
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage