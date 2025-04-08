import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Thông tin khuyến mãi */}
            <div className="bg-blue-600 py-4 text-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center justify-center py-2 transform transition-transform hover:scale-105">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium">Miễn phí vận chuyển</span>
                            <span className="text-sm text-blue-100">Cho đơn hàng trên 500k</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 transform transition-transform hover:scale-105">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                            <span className="font-medium">Bảo hành 12 tháng</span>
                            <span className="text-sm text-blue-100">Đổi trả dễ dàng</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 transform transition-transform hover:scale-105">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                            <span className="font-medium">Hóa đơn điện tử</span>
                            <span className="text-sm text-blue-100">Chứng từ đầy đủ</span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2 transform transition-transform hover:scale-105">
                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span className="font-medium">Hỗ trợ 24/7</span>
                            <span className="text-sm text-blue-100">Hotline: 1900 1234</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">E-STORE</h3>
                        <p className="mb-4 text-gray-400">
                            Chúng tôi cung cấp các sản phẩm chất lượng với giá cả hợp lý, đảm bảo trải nghiệm mua sắm tuyệt vời cho bạn.
                        </p>
                        <div className="flex space-x-4 mt-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Danh Mục</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Điện thoại</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Laptop</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Máy tính bảng</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Phụ kiện</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Đồng hồ thông minh</Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Thông Tin</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Về chúng tôi</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Chính sách bảo mật</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Điều khoản dịch vụ</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Chính sách đổi trả</Link>
                            </li>
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">Liên hệ</Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Liên Hệ</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-gray-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span className="text-gray-400">123 Đường Cách Mạng Tháng 8, Quận 1, TP. Hồ Chí Minh</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-gray-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                <span className="text-gray-400">+84 123 456 789</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-gray-400 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <span className="text-gray-400">support@estore.com</span>
                            </li>
                        </ul>

                        <div className="mt-6">
                            <h4 className="text-white font-medium mb-2">Đăng ký nhận tin</h4>
                            <div className="flex">
                                <input type="email" placeholder="Email của bạn" className="w-full bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phương thức thanh toán và giao hàng */}
                <div className="mt-10 pt-8 border-t border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Phương thức thanh toán</h3>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1200px-Mastercard-logo.svg.png" alt="MasterCard" className="h-6" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" alt="MoMo" className="h-9" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://img4.thuthuatphanmem.vn/uploads/2020/08/30/logo-mb-bank-cu_011517748.png" alt="MB Bank" className="h-9" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center text-center text-gray-800 font-medium text-xs">
                                    Tiền mặt
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Đơn vị vận chuyển</h3>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-GHN-Orange-1024x1024.png" alt="GHN" className="h-9" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-GHTK-H-768x198.png" alt="GHTK" className="h-8" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://viettelpost.com.vn/wp-content/uploads/2021/05/Logo-Viettel-Post.jpg" alt="Viettel Post" className="h-10" />
                                </div>
                                <div className="bg-white p-2 rounded-md w-16 h-10 flex items-center justify-center">
                                    <img src="https://th.bing.com/th/id/OIP.9N0sjeFMOOkcfuOwzldzLwHaHa?rs=1&pid=ImgDetMain" alt="Grab" className="h-9" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-800 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-sm text-gray-400 mb-4 md:mb-0">
                            © 2023 E-Store. Tất cả các quyền được bảo lưu.
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Quyền riêng tư</Link>
                            <span className="text-gray-600">|</span>
                            <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Điều khoản</Link>
                            <span className="text-gray-600">|</span>
                            <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Sitemap</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer 