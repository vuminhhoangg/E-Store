import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const location = useLocation();
    const authContext = useContext(AuthContext);

    // Nếu không có context hoặc chưa đăng nhập, chuyển hướng đến trang đăng nhập
    if (!authContext || !authContext.isLoggedIn) {
        console.log('Access denied: User not logged in');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Nếu đã đăng nhập, hiển thị children
    return <>{children}</>;
};

export default ProtectedRoute; 