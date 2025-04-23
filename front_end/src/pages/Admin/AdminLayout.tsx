import React, { useState, useContext, useEffect, useLayoutEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { refreshSession, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const [initialLoad, setInitialLoad] = useState(true);
    const [isRestoring, setIsRestoring] = useState(false);

    // Kiểm tra trạng thái đăng nhập trước khi render
    useLayoutEffect(() => {
        // Refresh session để đảm bảo token vẫn hợp lệ
        refreshSession();

        // Kiểm tra restore path từ session
        const lastAdminPath = sessionStorage.getItem('lastAdminPath');
        if (lastAdminPath &&
            (location.pathname === '/admin' || location.pathname === '/admin/dashboard') &&
            lastAdminPath !== '/admin' &&
            lastAdminPath !== '/admin/dashboard') {
            console.log('AdminLayout: Restoring path to', lastAdminPath);
            navigate(lastAdminPath, { replace: true });
        }
    }, []);

    // Lưu đường dẫn hiện tại vào sessionStorage khi thay đổi trang
    useEffect(() => {
        // Bỏ qua nếu đang trong quá trình phục hồi
        if (isRestoring) return;

        // Chỉ lưu nếu không phải lần tải đầu tiên và là đường dẫn admin cụ thể (không phải route mặc định)
        if (!initialLoad && location.pathname !== '/admin' && location.pathname !== '/admin/dashboard') {
            sessionStorage.setItem('lastAdminPath', location.pathname);
            console.log('[AdminLayout] Đã lưu đường dẫn hiện tại:', location.pathname);
        }

        // Đánh dấu đã qua lần tải đầu tiên
        if (initialLoad) {
            setInitialLoad(false);
        }

        // Reset trạng thái phục hồi
        if (isRestoring) {
            setIsRestoring(false);
        }
    }, [location.pathname, initialLoad, isRestoring]);

    // Xác thực admin một lần khi vào trang Admin
    useEffect(() => {
        const verifyAdmin = async () => {
            if (authContext) {
                const isAdmin = await authContext.verifyAdminOnce();
                if (!isAdmin) {
                    console.log('[AdminLayout] Người dùng không có quyền admin, chuyển hướng về trang chủ');
                    navigate('/');
                }
            }
        };

        verifyAdmin();
    }, [authContext, navigate]);

    // Xử lý đăng xuất
    const handleLogout = () => {
        if (authContext) {
            authContext.logout();
            navigate('/login');
        }
    };

    // Kiểm tra đường dẫn hiện tại để highlight menu item
    const isActive = (path: string) => {
        return location.pathname === path ||
            (path !== '/admin' && path !== '/admin/dashboard' && location.pathname.startsWith(path));
    };

    // Xác định tiêu đề trang dựa trên đường dẫn hiện tại
    const getPageTitle = () => {
        if (location.pathname.includes('/admin/products')) {
            return 'Quản lý sản phẩm';
        } else if (location.pathname.includes('/admin/orders')) {
            return 'Quản lý đơn hàng';
        } else if (location.pathname.includes('/admin/users')) {
            return 'Quản lý người dùng';
        } else if (location.pathname.includes('/admin/warranty')) {
            return 'Quản lý bảo hành';
        } else if (location.pathname === '/admin' || location.pathname === '/admin/dashboard') {
            return 'Bảng điều khiển';
        }
        return '';
    };

    // Xác định biểu tượng trang dựa trên đường dẫn
    const getPageIcon = () => {
        if (location.pathname.includes('/admin/products')) {
            return (
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
            );
        } else if (location.pathname.includes('/admin/orders')) {
            return (
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            );
        } else if (location.pathname.includes('/admin/users')) {
            return (
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            );
        } else if (location.pathname === '/admin' || location.pathname === '/admin/dashboard') {
            return (
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            );
        }
        return null;
    };

    // Effect riêng cho animation loading
    useEffect(() => {
        // Giả lập loading trong 500ms để tạo hiệu ứng mượt mà
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Thêm loading overlay
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-600">Đang tải trang quản trị...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile sidebar backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 shadow-xl transition-all duration-300 transform lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Beautiful gradient background with pattern */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-indigo-900 to-blue-800 opacity-90 z-0"></div>

                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:20px_20px] z-[1]"></div>

                {/* Glow effect */}
                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-400/10 to-transparent z-[2]"></div>

                <div className="h-full flex flex-col relative z-10">
                    {/* Logo with modern design */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
                        <Link to="/admin" className="flex items-center space-x-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 shadow-lg backdrop-blur-sm border border-white/20 p-2 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 opacity-70"></div>
                                <svg className="h-6 w-6 text-white z-10 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-white text-lg font-bold tracking-wide">E-Store</span>
                                <span className="text-blue-300 text-xs font-medium tracking-wide block">ADMIN PANEL</span>
                            </div>
                        </Link>
                        <button
                            className="p-1.5 text-white lg:hidden hover:bg-white/10 rounded-lg transition-colors"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Admin info with glass effect */}
                    <div className="py-4 px-5 backdrop-blur-lg bg-white/5 border-b border-white/10 relative overflow-hidden">
                        {/* Subtle shine effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10 blur-xl opacity-70"></div>

                        <div className="flex items-center space-x-3 relative">
                            <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg border border-blue-400/20 group-hover:shadow-indigo-500/50 transition-all">
                                    {authContext?.user?.userName?.charAt(0).toUpperCase() || 'A'}
                                </div>
                            </div>
                            <div className="text-white">
                                <p className="text-sm font-medium tracking-wide">{authContext?.user?.userName || 'Admin User'}</p>
                                <div className="flex items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5"></span>
                                    <p className="text-xs text-blue-200 font-light">Online</p>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <button className="p-1 rounded-lg hover:bg-white/10 text-blue-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation - Redesigned */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
                        <div className="space-y-8">
                            {/* Dashboard Group */}
                            <div>
                                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                                    Trang chính
                                </h3>
                                <div className="space-y-1">
                                    <NavLink
                                        to="/admin/dashboard"
                                        className={({ isActive }) => `
                                            group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-in-out 
                                            relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                                : 'text-blue-100 hover:text-white hover:bg-blue-600/30'
                                            }
                                        `}
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></span>
                                        <svg className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:text-white group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        <span className="z-10 transition-all duration-200 group-hover:font-medium group-hover:text-shadow-sm">Tổng quan</span>
                                    </NavLink>
                                </div>
                            </div>

                            {/* Management Group */}
                            <div>
                                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                                    Quản lý
                                </h3>
                                <div className="space-y-1">
                                    <NavLink
                                        to="/admin/products"
                                        className={({ isActive }) => `
                                            group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ease-in-out 
                                            relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                                : 'text-blue-100 hover:text-white hover:bg-blue-600/30'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center">
                                            <span className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></span>
                                            <svg className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:text-white group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                            </svg>
                                            <span className="z-10 transition-all duration-200 group-hover:font-medium group-hover:text-shadow-sm">Sản phẩm</span>
                                        </div>
                                        {/* Badge Mới */}
                                        <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-medium animate-pulse z-10">
                                            Mới
                                        </span>
                                    </NavLink>

                                    <NavLink
                                        to="/admin/orders"
                                        className={({ isActive }) => `
                                            group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ease-in-out 
                                            relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                                : 'text-blue-100 hover:text-white hover:bg-blue-600/30'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center">
                                            <span className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></span>
                                            <svg className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:text-white group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <span className="z-10 transition-all duration-200 group-hover:font-medium group-hover:text-shadow-sm">Đơn hàng</span>
                                        </div>
                                        {/* Badge số lượng */}
                                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium z-10">
                                            12
                                        </span>
                                    </NavLink>

                                    <NavLink
                                        to="/admin/users"
                                        className={({ isActive }) => `
                                            group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-in-out 
                                            relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                                : 'text-blue-100 hover:text-white hover:bg-blue-600/30'
                                            }
                                        `}
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></span>
                                        <svg className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:text-white group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        <span className="z-10 transition-all duration-200 group-hover:font-medium group-hover:text-shadow-sm">Người dùng</span>
                                    </NavLink>
                                    <NavLink
                                        to="/admin/warranty"
                                        className={({ isActive }) => `
                                            group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-in-out 
                                            relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                                : 'text-blue-100 hover:text-white hover:bg-blue-600/30'
                                            }
                                        `}
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></span>
                                        <svg className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:text-white group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span className="z-10 transition-all duration-200 group-hover:font-medium group-hover:text-shadow-sm">Bảo hành</span>
                                    </NavLink>
                                </div>
                            </div>

                            {/* Settings Group */}
                            <div>
                                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                                    Tài khoản
                                </h3>
                                <div className="space-y-1">
                                    <button
                                        onClick={handleLogout}
                                        className="group w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-in-out
                                            text-blue-100 hover:text-white hover:bg-red-500/30 relative overflow-hidden"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-red-500/50 to-pink-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></span>
                                        <svg className="h-5 w-5 mr-3 text-red-300 group-hover:text-red-100 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="z-10 transition-all duration-200 group-hover:font-medium group-hover:text-shadow-sm">Đăng xuất</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pro Version Badge */}
                        <div className="mt-8 mx-3">
                            <div className="rounded-xl bg-gradient-to-r from-blue-800 to-indigo-900 p-4 shadow-lg">
                                <div className="flex items-center">
                                    <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                                        <path d="M13 7a1 1 0 10-2 0v7a1 1 0 102 0V7z" />
                                        <path fillRule="evenodd" d="M12 7c0-.552.455-1 .944-1C14.398 6 15 7.378 15 9a5 5 0 01-10 0 1 1 0 012 0 3 3 0 006 0z" clipRule="evenodd" />
                                    </svg>
                                    <div className="ml-3">
                                        <p className="text-sm text-white font-semibold">E-Store Pro</p>
                                        <p className="text-xs text-blue-200">Nhấn để nâng cấp</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm z-10 border-b border-gray-200/80">
                    <div className="px-4 py-2.5 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {/* Menu button for mobile */}
                                <button
                                    type="button"
                                    className="text-gray-500 p-2 rounded-lg hover:bg-gray-100 lg:hidden focus:outline-none transition-colors"
                                    onClick={() => setIsMobileOpen(true)}
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    <span className="sr-only">Mở menu</span>
                                </button>

                                {/* Breadcrumbs */}
                                <nav className="hidden sm:flex ml-4 md:ml-6">
                                    <ol className="flex items-center space-x-2">
                                        <li>
                                            <div className="flex items-center">
                                                <Link to="/admin" className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                                                    Admin
                                                </Link>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="flex items-center">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                                <span className="ml-2 text-gray-700 text-sm font-medium">
                                                    {getPageTitle()}
                                                </span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center space-x-3">
                                {/* Search button */}
                                <button className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>

                                {/* Notification button with indicator */}
                                <button className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors relative">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {/* Notification indicator */}
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                                </button>

                                {/* User dropdown */}
                                <div className="relative ml-2">
                                    <div className="flex items-center">
                                        <button
                                            className="inline-flex items-center justify-center rounded-lg focus:outline-none transition-all"
                                            onClick={() => {/* Toggle user menu dropdown */ }}
                                        >
                                            <div className="flex items-center space-x-2.5">
                                                <span className="hidden md:block text-sm text-gray-700 font-medium">
                                                    {authContext?.user?.userName || 'Admin'}
                                                </span>
                                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md border border-indigo-100">
                                                    {authContext?.user?.userName?.charAt(0).toUpperCase() || 'A'}
                                                </div>
                                                <svg className="h-4 w-4 text-gray-500 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Page content */}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout; 