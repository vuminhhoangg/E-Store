import { useState, useEffect, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from './AuthContext'

const Header = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [cartCount, setCartCount] = useState(0)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const location = useLocation()
    const authContext = useContext(AuthContext)

    const isLoggedIn = authContext?.isLoggedIn || false
    const user = authContext?.user || null

    useEffect(() => {
        // Gọi refreshSession mỗi khi người dùng tương tác với trang web
        const refreshSessionOnActivity = () => {
            if (isLoggedIn && authContext?.refreshSession) {
                authContext.refreshSession();
            }
        };

        // Đăng ký các event listener để làm mới phiên đăng nhập
        window.addEventListener('click', refreshSessionOnActivity);
        window.addEventListener('keydown', refreshSessionOnActivity);
        window.addEventListener('scroll', refreshSessionOnActivity);
        window.addEventListener('mousemove', refreshSessionOnActivity);

        return () => {
            window.removeEventListener('click', refreshSessionOnActivity);
            window.removeEventListener('keydown', refreshSessionOnActivity);
            window.removeEventListener('scroll', refreshSessionOnActivity);
            window.removeEventListener('mousemove', refreshSessionOnActivity);
        };
    }, [isLoggedIn, authContext]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setIsScrolled(true)
            } else {
                setIsScrolled(false)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Đóng mobile menu khi chuyển trang
    useEffect(() => {
        setIsOpen(false)
        setUserMenuOpen(false)
    }, [location])

    // Đây chỉ là mô phỏng - trong thực tế bạn sẽ lấy số lượng từ giỏ hàng thật
    useEffect(() => {
        const updateCartCount = () => {
            const cart = localStorage.getItem('cart');
            if (cart) {
                try {
                    const cartItems = JSON.parse(cart);
                    setCartCount(cartItems.length);
                } catch (error) {
                    setCartCount(0);
                }
            } else {
                setCartCount(0);
            }
        };

        // Cập nhật lần đầu
        updateCartCount();

        // Thêm event listener để lắng nghe thay đổi giỏ hàng
        window.addEventListener('storage', updateCartCount);

        // Đăng ký một custom event để cập nhật giỏ hàng từ các component khác
        window.addEventListener('cartUpdated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Tìm kiếm:', searchTerm)
        // Thực hiện tìm kiếm
    }

    const handleLogout = () => {
        if (authContext?.logout) {
            authContext.logout();
        }
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

    return (
        <header className={`bg-white shadow-xl sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
            {/* Top bar */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white py-3 hidden md:block">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-6 text-sm">
                            <span className="flex items-center transition-all duration-300 hover:scale-105 hover:text-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="font-medium">+84 123 456 789</span>
                            </span>
                            <span className="flex items-center transition-all duration-300 hover:scale-105 hover:text-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">support@estore.com</span>
                            </span>
                        </div>
                        <div className="flex space-x-6 text-sm">
                            <Link to="/" className="flex items-center bg-white bg-opacity-90 text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-all duration-300 shadow-sm hover:shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Trợ giúp</span>
                            </Link>
                            {/* <Link to="/" className="flex items-center bg-white bg-opacity-90 text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-all duration-300 shadow-sm hover:shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span className="font-medium">Theo dõi đơn hàng</span>
                            </Link> */}
                            <Link to="/" className="flex items-center bg-white bg-opacity-90 text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-all duration-300 shadow-sm hover:shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                <span className="font-medium">Tiếng Việt</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main header */}
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 group">
                        <div className="flex items-center transform transition-transform duration-300 group-hover:scale-105">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-2 text-3xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">E-STORE</span>
                        </div>
                    </Link>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-700 hover:text-blue-600 focus:outline-none transition-all duration-300 transform hover:scale-105"
                        >
                            {isOpen ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <div className="relative">
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow-sm">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-10">
                        <Link to="/" className="text-gray-900 hover:text-blue-600 font-medium text-base transition-all duration-300 relative group py-1">
                            Trang chủ
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                        </Link>
                        <Link to="/products" className="text-gray-900 hover:text-blue-600 font-medium text-base transition-all duration-300 relative group py-1">
                            Sản phẩm
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                        </Link>
                        <Link to="/sales" className="text-gray-900 hover:text-blue-600 font-medium text-base transition-all duration-300 relative group py-1">
                            Khuyến mãi
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                        </Link>
                        <Link to="/news" className="text-gray-900 hover:text-blue-600 font-medium text-base transition-all duration-300 relative group py-1">
                            Tin tức
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                        </Link>
                        <Link to="/contact" className="text-gray-900 hover:text-blue-600 font-medium text-base transition-all duration-300 relative group py-1">
                            Liên hệ
                            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                        </Link>
                    </nav>

                    {/* Search & Icons */}
                    <div className="hidden md:flex items-center space-x-7">
                        {/* User */}
                        {isLoggedIn ? (
                            <div className="relative">
                                <button
                                    onClick={toggleUserMenu}
                                    className="flex items-center text-gray-700 hover:text-blue-600 transition-all duration-300"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-center mr-2 shadow-lg transform hover:scale-105 transition-all duration-300">
                                        {user?.userName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="hidden lg:inline group-hover:text-blue-600">{user?.userName || 'Người dùng'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-2xl z-50 overflow-hidden transform origin-top transition-all duration-300 border border-gray-100 animate-fadeIn">
                                        <div className="py-1">
                                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                                Xin chào, <span className="font-semibold">{user?.userName}</span>
                                            </div>
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300">
                                                Tài khoản của tôi
                                            </Link>
                                            <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300">
                                                Đơn hàng của tôi
                                            </Link>
                                            <Link to="/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300">
                                                Đổi mật khẩu
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-300"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="text-gray-700 hover:text-blue-600 relative transition-all duration-300 transform hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Đăng nhập</span>
                            </Link>
                        )}

                        {/* Wishlist */}
                        <Link to="/wishlist" className="text-gray-700 hover:text-blue-600 relative transition-all duration-300 transform hover:scale-110 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg transform transition-transform duration-300 group-hover:scale-110 animate-pulse">5</span>
                            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Yêu thích</span>
                        </Link>

                        {/* Cart */}
                        <Link to="/cart" className="text-gray-700 hover:text-blue-600 relative transition-all duration-300 transform hover:scale-110 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg transform transition-transform duration-300 group-hover:scale-110 animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Giỏ hàng</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-white border-t mt-2`}>
                {/* Mobile search */}
                <div className="p-4">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative flex items-center overflow-hidden rounded-full border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-grow py-3 pl-10 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm border-0"
                            />
                            <button
                                type="submit"
                                className="absolute right-0 top-0 h-full px-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white transition-all duration-300 hover:from-blue-700 hover:to-indigo-800 flex items-center justify-center"
                            >
                                <span className="text-sm font-medium whitespace-nowrap">Tìm</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Mobile links */}
                <nav className="px-4 py-2 border-t border-gray-200 divide-y divide-gray-100">
                    <Link to="/" className="flex items-center py-2.5 text-gray-900 hover:text-blue-600 transition-colors duration-300 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Trang chủ</span>
                    </Link>
                    <Link to="/products" className="flex items-center py-2.5 text-gray-900 hover:text-blue-600 transition-colors duration-300 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Sản phẩm</span>
                    </Link>
                    <Link to="/sales" className="flex items-center py-2.5 text-gray-900 hover:text-blue-600 transition-colors duration-300 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Khuyến mãi</span>
                    </Link>
                    <Link to="/news" className="flex items-center py-2.5 text-gray-900 hover:text-blue-600 transition-colors duration-300 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <span>Tin tức</span>
                    </Link>
                    <Link to="/contact" className="flex items-center py-2.5 text-gray-900 hover:text-blue-600 transition-colors duration-300 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 group-hover:text-blue-600 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Liên hệ</span>
                    </Link>
                </nav>

                {/* Mobile category links */}
                <div className="px-4 py-2 border-t border-gray-200">
                    <div className="text-sm uppercase font-bold text-gray-500 mb-2">Danh mục nổi bật</div>
                    <div className="divide-y divide-gray-100">
                        <Link to="/" className="flex items-center py-2.5 text-gray-900 hover:text-red-600 transition-colors duration-300 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            <span>Khuyến mãi hot</span>
                        </Link>
                        <Link to="/" className="flex items-center py-2.5 text-gray-900 hover:text-green-600 transition-colors duration-300 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Hàng mới về</span>
                        </Link>
                        <Link to="/" className="flex items-center py-2.5 text-gray-900 hover:text-yellow-600 transition-colors duration-300 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Bán chạy nhất</span>
                        </Link>
                        <Link to="/" className="flex items-center py-2.5 text-gray-900 hover:text-purple-600 transition-colors duration-300 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <span>Sản phẩm gợi ý</span>
                        </Link>
                        <Link to="/flash-sale" className="flex items-center py-2.5 text-gray-900 hover:text-red-600 transition-colors duration-300 group">
                            <div className="flex items-center mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="font-medium text-red-600">FLASH SALE!</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile user account */}
                <div className="px-4 py-2 border-t border-gray-200">
                    {isLoggedIn ? (
                        <>
                            <div className="flex items-center py-2 text-gray-900">
                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                                    {user?.userName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="font-medium">{user?.userName || 'Người dùng'}</span>
                            </div>
                            <Link to="/profile" className="flex items-center py-2 pl-2 text-gray-900 hover:text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Tài khoản của tôi</span>
                            </Link>
                            <Link to="/orders" className="flex items-center py-2 pl-2 text-gray-900 hover:text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span>Đơn hàng của tôi</span>
                            </Link>
                            <Link to="/change-password" className="flex items-center py-2 pl-2 text-gray-900 hover:text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                <span>Đổi mật khẩu</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center py-2 pl-2 text-red-600 hover:text-red-800 w-full text-left"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Đăng xuất</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="flex items-center py-2 text-gray-900 hover:text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Đăng nhập</span>
                        </Link>
                    )}
                    <Link to="/wishlist" className="flex items-center py-2 text-gray-900 hover:text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>Danh sách yêu thích</span>
                    </Link>
                    <Link to="/cart" className="flex items-center py-2 text-gray-900 hover:text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Giỏ hàng</span>
                        {cartCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            {/* Categories Navigation Bar */}
            <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200 py-3 hidden md:block border-t border-gray-200 shadow-md">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-center">
                        {/* Popular categories */}
                        <div className="flex space-x-12 justify-center">
                            <Link to="/" className="text-gray-800 hover:text-blue-600 font-medium transition-all duration-300 relative group transform hover:scale-105">
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                    </svg>
                                    Khuyến mãi hot
                                </span>
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                            </Link>
                            <Link to="/" className="text-gray-800 hover:text-blue-600 font-medium transition-all duration-300 relative group transform hover:scale-105">
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Hàng mới về
                                </span>
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-green-500 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                            </Link>
                            <Link to="/" className="text-gray-800 hover:text-blue-600 font-medium transition-all duration-300 relative group transform hover:scale-105">
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Bán chạy nhất
                                </span>
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-500 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                            </Link>
                            <Link to="/" className="text-gray-800 hover:text-blue-600 font-medium transition-all duration-300 relative group transform hover:scale-105">
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    Sản phẩm gợi ý
                                </span>
                                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Flash Sale Banner */}
            {/* <div className="hidden md:block bg-gradient-to-r from-red-50 to-red-100 border-t border-b border-red-100">
                <div className="container mx-auto px-4 py-2">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center group animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-3 py-1 rounded-md mr-3 shadow-lg transform transition-transform duration-300 group-hover:scale-105">FLASH SALE</span>
                        </div>
                        <span className="text-gray-700 font-medium mr-3">Kết thúc sau:</span>
                        <div className="flex space-x-1 group-hover:scale-105 transition-transform duration-300">
                            <span className="bg-gradient-to-b from-gray-800 to-gray-900 text-white font-bold px-2 py-1 rounded-md shadow-lg">06</span>
                            <span className="text-gray-800 font-bold animate-ping">:</span>
                            <span className="bg-gradient-to-b from-gray-800 to-gray-900 text-white font-bold px-2 py-1 rounded-md shadow-lg">12</span>
                            <span className="text-gray-800 font-bold animate-ping">:</span>
                            <span className="bg-gradient-to-b from-gray-800 to-gray-900 text-white font-bold px-2 py-1 rounded-md shadow-lg">03</span>
                        </div>
                        <Link to="/flash-sale" className="ml-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-1 rounded-md shadow-md transform hover:scale-105 transition-all duration-300 text-sm font-medium">
                            Xem ngay
                        </Link>
                    </div>
                </div>
            </div> */}
        </header>
    )
}

export default Header 