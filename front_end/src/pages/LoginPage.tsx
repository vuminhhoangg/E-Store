import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const LoginPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [phoneNumberError, setPhoneNumberError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [loginAttempts, setLoginAttempts] = useState(0)

    const navigate = useNavigate()
    const location = useLocation()
    const auth = useAuth()

    if (!auth) {
        return <div>Lỗi: Không thể kết nối đến hệ thống xác thực</div>
    }

    const from = (location.state as any)?.from?.pathname || '/'

    // Kiểm tra xem có đến từ trang đăng ký thành công không
    useEffect(() => {
        // Lấy search params từ URL
        const searchParams = new URLSearchParams(location.search);
        const fromRegister = searchParams.get('from') === 'register';

        // Không hiển thị thông báo ở đây nữa vì đã hiển thị ở trang đăng ký
        // Đoạn mã được giữ lại cho mục đích mở rộng trong tương lai
        if (fromRegister) {
            console.log('Chuyển hướng từ trang đăng ký thành công');
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPhoneNumberError('')
        setPasswordError('')
        setError('')

        // Validate input fields
        let isValid = true

        if (!phoneNumber) {
            setPhoneNumberError('Vui lòng nhập số điện thoại')
            isValid = false
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            setPhoneNumberError('Số điện thoại phải có 10 chữ số')
            isValid = false
        }

        if (!password) {
            setPasswordError('Vui lòng nhập mật khẩu')
            isValid = false
        }

        if (!isValid) return

        setLoading(true)

        try {
            console.log('Bắt đầu đăng nhập với số điện thoại:', phoneNumber)
            await auth.login(phoneNumber, password, rememberMe)
            console.log('Đăng nhập thành công, kiểm tra thông tin người dùng:')

            // Kiểm tra thông tin đã lưu trong localStorage hoặc sessionStorage
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo')
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr)
                console.log('Thông tin người dùng đã lưu:', {
                    userId: userInfo.user?.id,
                    userName: userInfo.user?.userName,
                    isAdmin: userInfo.user?.isAdmin,
                    hasAccessToken: !!userInfo.accessToken,
                    hasRefreshToken: !!userInfo.refreshToken,
                    expiresAt: userInfo.expiresAt ? new Date(userInfo.expiresAt).toLocaleString() : undefined
                })

                // Kiểm tra nếu người dùng là admin, chuyển hướng đến trang admin dashboard
                if (userInfo.user?.isAdmin) {
                    console.log('Người dùng là admin, chuyển hướng đến trang admin dashboard')
                    navigate('/admin/dashboard')
                } else {
                    // Nếu không phải admin, chuyển hướng đến trang trước đó hoặc trang chủ
                    navigate(from)
                }
            } else {
                console.log('Không tìm thấy thông tin người dùng trong storage')
                navigate(from)
            }
        } catch (error: any) {
            console.error('Lỗi trong quá trình đăng nhập:', error)
            setError(error.message || 'Đăng nhập thất bại, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    useEffect(() => {
        if (auth.isLoggedIn) {
            let redirectTo = '/';

            // Đối với admin, redirect về trang admin
            if (auth.user?.isAdmin) {
                // Kiểm tra nếu có đường dẫn admin được lưu trước đó
                const lastAdminPath = sessionStorage.getItem('lastAdminPath');

                // Kiểm tra xem có đường dẫn từ state không (từ Protected Route)
                const fromPath = location.state?.from?.pathname;

                // Ưu tiên đường dẫn từ state trước
                if (fromPath && fromPath.startsWith('/admin')) {
                    redirectTo = fromPath;
                    console.log('Redirecting to previous admin path from navigation:', fromPath);
                }
                // Sau đó đến lastAdminPath
                else if (lastAdminPath) {
                    redirectTo = lastAdminPath;
                    console.log('Redirecting to saved admin path:', lastAdminPath);
                }
                // Mặc định đến dashboard
                else {
                    redirectTo = '/admin/dashboard';
                    console.log('Redirecting to default admin dashboard');
                }
            }
            // Đối với user thường, redirect theo quy tắc hiện tại
            else {
                // Nếu có đường dẫn từ state, dùng nó
                if (location.state?.from?.pathname) {
                    redirectTo = location.state.from.pathname;
                }
            }

            // Thực hiện redirect
            navigate(redirectTo, { replace: true });
        }
    }, [auth.isLoggedIn, auth.user, navigate, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
            <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl max-w-xl w-full">
                <div className="h-28 flex items-center justify-center">
                    <h1 className="text-4xl font-bold text-gray-800 text-center">Đăng Nhập</h1>
                </div>

                {error && (
                    <div className="mb-5 p-4 bg-red-100 text-red-700 rounded-lg text-base">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="phoneNumber" className="block text-base font-medium text-gray-700 mb-2">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                        {phoneNumberError && <p className="mt-2 text-sm text-red-600">{phoneNumberError}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
                            Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white"
                                placeholder="Nhập mật khẩu"
                            />
                            {password && <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>}
                        </div>
                        {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-base text-gray-700">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>
                        <div className="text-base">
                            <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300">
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-5 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            Đăng nhập
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <div>
                            <a href="#" className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                </svg>
                            </a>
                        </div>
                        <div>
                            <a href="#" className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22,12.1c0-5.7-4.6-10.3-10.3-10.3c-5.7,0-10.3,4.6-10.3,10.3c0,5.2,3.8,9.5,8.7,10.3v-7.3H7.1v-3h3.1V9.9c0-3,1.8-4.7,4.5-4.7c1.3,0,2.7,0.2,2.7,0.2v3h-1.5c-1.5,0-2,0.9-2,1.9v2.3h3.3l-0.5,3h-2.8v7.3C18.2,21.6,22,17.3,22,12.1z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                        <div>
                            <a href="#" className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22,5.8c-0.7,0.3-1.5,0.5-2.4,0.6c0.8-0.5,1.5-1.3,1.8-2.3c-0.8,0.5-1.7,0.8-2.6,1c-0.7-0.8-1.8-1.3-3-1.3c-2.3,0-4.1,1.8-4.1,4.1c0,0.3,0,0.6,0.1,0.9C8.2,8.5,5.1,6.9,3,4.4C2.6,5,2.4,5.7,2.4,6.4c0,1.4,0.7,2.7,1.8,3.4C3.6,9.8,3,9.6,2.5,9.3c0,0,0,0,0,0.1c0,2,1.4,3.6,3.3,4c-0.3,0.1-0.7,0.1-1.1,0.1c0.5,1.6,2,2.8,3.8,2.8c-1.4,1.1-3.1,1.7-5,1.7c-0.3,0-0.7,0-1-0.1c1.8,1.1,3.9,1.8,6.1,1.8c7.4,0,11.4-6.1,11.4-11.4c0-0.2,0-0.4,0-0.5C20.8,7.3,21.5,6.6,22,5.8z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <span className="text-base text-gray-600">Chưa có tài khoản? </span>
                    <Link
                        to="/register"
                        className="text-base font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                    >
                        Đăng ký
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default LoginPage 