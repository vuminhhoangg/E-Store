import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPasswordPage = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmitPhone = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!phoneNumber) {
            setError('Vui lòng nhập số điện thoại');
            return;
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            setError('Số điện thoại phải có 10 chữ số');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Giả lập gửi mã xác thực - trong ứng dụng thực tế, bạn sẽ cần một API endpoint cho việc này
            // const { data } = await axios.post('/api/users/forgot-password', { phoneNumber });

            // Cho mục đích demo
            setTimeout(() => {
                setMessage('Mã xác thực đã được gửi đến số điện thoại của bạn');
                setStep(2);
                setLoading(false);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại sau.');
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!verificationCode) {
            setError('Vui lòng nhập mã xác thực');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Giả lập xác thực mã - trong ứng dụng thực tế, bạn sẽ cần một API endpoint cho việc này
            // const { data } = await axios.post('/api/users/verify-reset-code', { 
            //   phoneNumber, 
            //   verificationCode 
            // });

            // Cho mục đích demo
            setTimeout(() => {
                setMessage('Mã xác thực hợp lệ. Vui lòng đặt mật khẩu mới');
                setStep(3);
                setLoading(false);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Mã xác thực không hợp lệ. Vui lòng thử lại.');
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!newPassword) {
            setError('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Giả lập đặt lại mật khẩu - trong ứng dụng thực tế, bạn sẽ cần một API endpoint cho việc này
            // const { data } = await axios.post('/api/users/reset-password', { 
            //   phoneNumber, 
            //   verificationCode,
            //   newPassword
            // });

            // Cho mục đích demo
            setTimeout(() => {
                setMessage('Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay bây giờ.');
                setStep(4);
                setLoading(false);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại sau.');
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
                <div className="h-32 flex items-center justify-center">
                    <h1 className="text-3xl font-bold text-gray-800 text-center">Quên mật khẩu</h1>
                </div>

                {message && (
                    <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSubmitPhone} className="space-y-6">
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:scale-[1.01] bg-gray-50"
                                placeholder="Nhập số điện thoại đã đăng ký"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                Gửi mã xác thực
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div>
                            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                                Mã xác thực <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="verificationCode"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:scale-[1.01] bg-gray-50"
                                placeholder="Nhập mã xác thực"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                Xác thực
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Quay lại
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:scale-[1.01] bg-gray-50"
                                    placeholder="Nhập mật khẩu mới"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:scale-[1.01] bg-gray-50"
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                                <button
                                    type="button"
                                    onClick={toggleConfirmPasswordVisibility}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                Đặt lại mật khẩu
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Quay lại
                            </button>
                        </div>
                    </form>
                )}

                {step === 4 && (
                    <div className="text-center">
                        <div className="mb-6">
                            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <Link
                            to="/login"
                            className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            Đăng nhập
                        </Link>
                    </div>
                )}

                {step === 1 && (
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            Quay lại đăng nhập
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage; 