import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHistory, FaHome, FaArrowRight, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

const WarrantySuccessPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { claimId, productName } = location.state || { claimId: null, productName: 'sản phẩm' };

    // Nếu không có claimId, có thể người dùng đã truy cập trực tiếp vào URL này
    // Chuyển hướng họ đến trang yêu cầu bảo hành
    useEffect(() => {
        if (!claimId) {
            setTimeout(() => {
                navigate('/warranty-request');
            }, 3000);
        }
    }, [claimId, navigate]);

    // Hiệu ứng confetti
    useEffect(() => {
        if (!claimId) return;

        const confettiColors = ['#4F46E5', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
        const confettiCount = 100;
        const container = document.getElementById('confetti-container');

        if (!container) return;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.setProperty('--confetti-color', confettiColors[Math.floor(Math.random() * confettiColors.length)]);
            confetti.style.setProperty('--fall-delay', `${Math.random() * 5}s`);
            confetti.style.setProperty('--fall-duration', `${Math.random() * 2 + 2}s`);
            confetti.style.left = `${Math.random() * 100}%`;
            container.appendChild(confetti);
        }

        // Cleanup
        return () => {
            const confettis = document.querySelectorAll('.confetti');
            confettis.forEach(c => c.remove());
        };
    }, [claimId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Container cho hiệu ứng confetti */}
            <div id="confetti-container" className="absolute inset-0 overflow-hidden pointer-events-none"></div>

            {/* Card chính */}
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 flex items-center justify-center relative">
                    <div className="absolute -bottom-10 w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center">
                            <FaCheckCircle className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                {/* Container nội dung */}
                <div className="pt-14 px-6 sm:px-10 pb-8">
                    {claimId ? (
                        <>
                            {/* Tiêu đề */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">Yêu Cầu Bảo Hành Đã Được Gửi!</h1>
                                <p className="mt-2 text-gray-600">Cảm ơn bạn đã sử dụng dịch vụ bảo hành của chúng tôi</p>
                            </div>

                            {/* Thông tin yêu cầu */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                                <div className="flex items-center mb-4">
                                    <FaShieldAlt className="h-5 w-5 text-blue-500 mr-2" />
                                    <h3 className="text-md font-semibold text-gray-900">Thông tin yêu cầu bảo hành</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-blue-100">
                                        <span className="text-sm text-gray-600">Mã yêu cầu:</span>
                                        <span className="text-sm font-medium text-indigo-700 bg-indigo-50 py-1 px-3 rounded-full">{claimId}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Sản phẩm:</span>
                                        <span className="text-sm font-medium text-gray-900">{productName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông báo */}
                            <div className="bg-blue-50 rounded-xl p-5 mb-8 border-l-4 border-blue-500">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <FaInfoCircle className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-800">
                                            Chúng tôi sẽ xem xét yêu cầu của bạn và phản hồi trong thời gian sớm nhất. Bạn có thể kiểm tra trạng thái yêu cầu bảo hành bất kỳ lúc nào trong phần lịch sử bảo hành.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Các nút điều hướng */}
                            <div className="space-y-3">
                                <Link
                                    to="/warranty-history"
                                    className="flex items-center justify-between w-full px-6 py-3 text-left font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-purple-600 hover:to-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
                                >
                                    <div className="flex items-center">
                                        <FaHistory className="mr-2 h-5 w-5 animate-pulse" />
                                        <span className="font-semibold">Xem lịch sử bảo hành</span>
                                    </div>
                                    <FaArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    to="/"
                                    className="flex items-center justify-between w-full px-6 py-3 text-left font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-white rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <div className="flex items-center">
                                        <FaHome className="mr-2 h-5 w-5" />
                                        <span>Về trang chủ</span>
                                    </div>
                                    <FaArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="flex justify-center mb-4">
                                <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin</h2>
                            <p className="text-gray-600">Đang chuyển hướng đến trang yêu cầu bảo hành...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Phần hỗ trợ */}
            <div className="mt-6 max-w-lg w-full">
                <div className="bg-white rounded-xl shadow-md p-5 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Cần hỗ trợ?</span> Liên hệ bộ phận hỗ trợ khách hàng
                    </div>
                    <div className="flex space-x-3">
                        <a href="mailto:support@e-store.com" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-800 hover:text-white hover:shadow-md transition-all duration-200">
                            Email
                        </a>
                        <a href="tel:19001234" className="inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-100 hover:border-blue-500 hover:shadow-md transition-all duration-200">
                            1900-1234
                        </a>
                    </div>
                </div>
            </div>

            {/* CSS for confetti animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background-color: var(--confetti-color);
                    top: -10px;
                    opacity: 0;
                    animation: fall var(--fall-duration) ease-in-out var(--fall-delay) forwards;
                    transform: rotate(0deg);
                }

                @keyframes fall {
                    0% {
                        top: -10px;
                        opacity: 1;
                        transform: rotate(0deg);
                    }
                    100% {
                        top: 100%;
                        opacity: 0;
                        transform: rotate(720deg);
                    }
                }
                `
            }} />
        </div>
    );
};

export default WarrantySuccessPage; 