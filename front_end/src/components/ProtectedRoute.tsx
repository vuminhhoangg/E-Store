import React, { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = React.memo(({ children }: ProtectedRouteProps) => {
    const location = useLocation();
    const auth = useAuth();

    if (!auth || !auth.isLoggedIn) {
        console.log('ProtectedRoute: Chuyển hướng đến login (chỉ log 1 lần)');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
});

// Route chỉ cho phép admin truy cập
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoggedIn, user, adminVerified, verifyAdminOnce } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAdmin = async () => {
            if (isVerifying) return;

            try {
                setIsVerifying(true);
                console.log('[AdminProtectedRoute] Bắt đầu xác thực admin', {
                    isLoggedIn,
                    hasUser: !!user,
                    userIsAdmin: user?.isAdmin,
                    adminVerified,
                    path: location.pathname
                });

                // Nếu đã xác thực admin trước đó
                if (adminVerified) {
                    console.log('[AdminProtectedRoute] Đã xác thực admin trước đó');
                    setIsAdmin(true);
                    return;
                }

                // Nếu chưa đăng nhập hoặc không phải admin
                if (!isLoggedIn || !user?.isAdmin) {
                    console.log('[AdminProtectedRoute] Không phải admin hoặc chưa đăng nhập', {
                        isLoggedIn,
                        userIsAdmin: user?.isAdmin
                    });
                    navigate('/login', { state: { from: location } });
                    return;
                }

                // Xác thực admin
                console.log('[AdminProtectedRoute] Gọi verifyAdminOnce()');
                const verified = await verifyAdminOnce();
                console.log('[AdminProtectedRoute] Kết quả verifyAdminOnce():', verified);
                setIsAdmin(verified);

                if (!verified) {
                    console.log('[AdminProtectedRoute] Xác thực admin thất bại, chuyển hướng đến trang login');
                    navigate('/login', { state: { from: location } });
                } else {
                    console.log('[AdminProtectedRoute] Xác thực admin thành công');
                }
            } catch (error) {
                console.error('[AdminProtectedRoute] Lỗi khi xác thực admin:', error);
                navigate('/login', { state: { from: location } });
            } finally {
                setIsVerifying(false);
            }
        };

        verifyAdmin();
    }, [isLoggedIn, user, adminVerified, verifyAdminOnce, location, navigate]);

    if (isVerifying) {
        console.log('[AdminProtectedRoute] Đang xác thực admin...');
        return <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    return isAdmin ? <>{children}</> : null;
}; 