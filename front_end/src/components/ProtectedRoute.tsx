import React, { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

// Route chỉ cho phép người dùng đã đăng nhập
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const location = useLocation();
    const auth = useAuth();

    console.log('ProtectedRoute: Kiểm tra quyền truy cập');
    console.log('Người dùng đã đăng nhập:', auth?.isLoggedIn);

    if (!auth || !auth.isLoggedIn) {
        console.log('Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập');
        // Lưu vị trí hiện tại để sau khi đăng nhập xong có thể quay lại
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    console.log('Người dùng đã đăng nhập, cho phép truy cập');
    return <>{children}</>;
};

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
                console.log('[AdminProtectedRoute] Bắt đầu xác thực admin');

                // Nếu đã xác thực admin trước đó
                if (adminVerified) {
                    console.log('[AdminProtectedRoute] Đã xác thực admin trước đó');
                    setIsAdmin(true);
                    return;
                }

                // Nếu chưa đăng nhập hoặc không phải admin
                if (!isLoggedIn || !user?.isAdmin) {
                    console.log('[AdminProtectedRoute] Không phải admin hoặc chưa đăng nhập');
                    navigate('/login', { state: { from: location } });
                    return;
                }

                // Xác thực admin
                const verified = await verifyAdminOnce();
                setIsAdmin(verified);

                if (!verified) {
                    console.log('[AdminProtectedRoute] Xác thực admin thất bại');
                    navigate('/login', { state: { from: location } });
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
        return null; // Hoặc có thể hiển thị loading spinner
    }

    return isAdmin ? <>{children}</> : null;
}; 