import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../components/AuthContext';
import { addressService } from '../services/addressService';
import { toast } from 'react-toastify';

// Interface cho dữ liệu địa chỉ
interface WardData {
    Id: string;
    Name: string;
    Level: string;
}

interface DistrictData {
    Id: string;
    Name: string;
    Level?: string;
    Wards?: WardData[];
}

interface ProvinceData {
    Id: string;
    Name: string;
    Level?: string;
    Districts?: DistrictData[];
}

// Interface cho dữ liệu sử dụng trong component
interface Province {
    id: string;
    name: string;
    level?: string;
}

interface District {
    id: string;
    name: string;
    level?: string;
}

interface Commune {
    id: string;
    name: string;
    level?: string;
}

interface FormData {
    userName: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    provinceId: string;
    districtId: string;
    communeId: string;
    streetAddress: string;
}

interface ApiStatus {
    success: boolean;
    message: string;
}

const RegisterPage = () => {
    const [userName, setUserName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [wardId, setWardId] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Commune[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Thêm validation errors
    const [userNameError, setUserNameError] = useState('');
    const [phoneNumberError, setPhoneNumberError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [addressError, setAddressError] = useState('');

    const navigate = useNavigate();
    const { register } = useAuth();

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                const data = await addressService.getProvinces();
                console.log('Loaded provinces:', data);
                setProvinces(data);
            } catch (error) {
                console.error('Error loading provinces:', error);
                setError('Không thể tải danh sách tỉnh/thành phố');
            }
        };

        loadProvinces();
    }, []);

    const loadDistricts = async (provinceId: string) => {
        if (!provinceId) return;

        try {
            const data = await addressService.getDistricts(provinceId);
            console.log(`Loaded districts for province ${provinceId}:`, data);
            return data;
        } catch (error) {
            console.error('Error loading districts:', error);
            throw new Error('Không thể tải danh sách quận/huyện');
        }
    };

    const loadWards = async (districtId: string) => {
        if (!districtId) return;

        try {
            const data = await addressService.getWards(districtId);
            console.log(`Loaded wards for district ${districtId}:`, data);
            return data;
        } catch (error) {
            console.error('Error loading wards:', error);
            throw new Error('Không thể tải danh sách phường/xã');
        }
    };

    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProvinceId = e.target.value;
        console.log('Selected province ID:', selectedProvinceId);
        setProvinceId(selectedProvinceId);
        setDistrictId('');
        setWardId('');
        setDistricts([]);
        setWards([]);

        if (selectedProvinceId) {
            try {
                const data = await loadDistricts(selectedProvinceId);
                if (data && data.length > 0) {
                    console.log(`Loaded ${data.length} districts for province ${selectedProvinceId}`);
                    setDistricts(data || []);
                } else {
                    console.warn(`No districts found for province ${selectedProvinceId}`);
                    setDistricts([]);
                }
            } catch (error) {
                console.error('Error loading districts:', error);
                setError('Không thể tải danh sách quận/huyện');
            }
        } else {
            setDistricts([]);
        }
    };

    const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDistrictId = e.target.value;
        console.log('Selected district ID:', selectedDistrictId);
        setDistrictId(selectedDistrictId);
        setWardId('');
        setWards([]);

        if (selectedDistrictId) {
            try {
                const data = await loadWards(selectedDistrictId);
                console.log('Wards data received:', data);
                if (data && data.length > 0) {
                    console.log(`Loaded ${data.length} wards for district ${selectedDistrictId}`);
                    setWards(data);
                } else {
                    console.warn(`No wards found for district ${selectedDistrictId}`);
                    setWards([]);
                }
            } catch (error) {
                console.error('Error loading wards:', error);
                setError('Không thể tải danh sách phường/xã');
            }
        } else {
            setWards([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Kiểm tra các trường
        let isValid = true;

        if (!userName.trim()) {
            setUserNameError('Vui lòng nhập họ và tên');
            isValid = false;
        }

        if (!phoneNumber) {
            setPhoneNumberError('Vui lòng nhập số điện thoại');
            isValid = false;
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            setPhoneNumberError('Số điện thoại phải có 10 chữ số');
            isValid = false;
        }

        if (!password) {
            setPasswordError('Vui lòng nhập mật khẩu');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
            isValid = false;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Mật khẩu xác nhận không khớp');
            isValid = false;
        }

        if (!provinceId || !districtId || !wardId || !streetAddress.trim()) {
            setAddressError('Vui lòng điền đầy đủ thông tin địa chỉ');
            isValid = false;
        }

        if (!isValid) return;

        const provinceName = provinces.find(p => p.id === provinceId)?.name || '';
        const districtName = districts.find(d => d.id === districtId)?.name || '';
        const wardName = wards.find(w => w.id === wardId)?.name || '';
        const diaChi = `${streetAddress}, ${wardName}, ${districtName}, ${provinceName}`;

        const userData = {
            userName,
            phoneNumber,
            password,
            diaChi,
        };

        setLoading(true);

        try {
            // Gọi API đăng ký
            await register(userData);

            console.log('Đăng ký thành công, chuẩn bị chuyển hướng đến trang đăng nhập');

            // Hiển thị thông báo thành công
            toast.success('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');

            // Chuyển hướng đến trang đăng nhập sau khi hiển thị thông báo
            setTimeout(() => {
                navigate('/login?from=register');
            }, 1000);

        } catch (err: any) {
            console.error('Lỗi khi đăng ký:', err);
            setError(err.message || 'Không thể đăng ký tài khoản. Vui lòng thử lại sau.');
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
            <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl max-w-2xl w-full my-4">
                <div className="h-28 flex items-center justify-center">
                    <h1 className="text-4xl font-bold text-gray-800 text-center">Đăng Ký Tài Khoản</h1>
                </div>

                {error && (
                    <div className="mb-5 p-4 bg-red-100 text-red-700 rounded-lg text-base">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="userName" className="block text-base font-medium text-gray-700 mb-2">
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                id="userName"
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white"
                                placeholder="Nhập họ và tên"
                            />
                        </div>
                        {userNameError && <p className="mt-2 text-sm text-red-600">{userNameError}</p>}
                    </div>

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
                            <button
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
                            </button>
                        </div>
                        {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-2">
                            Xác nhận mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white"
                                placeholder="Xác nhận mật khẩu"
                            />
                            <button
                                type="button"
                                onClick={toggleConfirmPasswordVisibility}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showConfirmPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {confirmPasswordError && <p className="mt-2 text-sm text-red-600">{confirmPasswordError}</p>}
                    </div>

                    <div>
                        <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Địa chỉ
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="province"
                                    value={provinceId}
                                    onChange={handleProvinceChange}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white"
                                >
                                    <option value="">Chọn Tỉnh/Thành phố</option>
                                    {provinces.map((province) => (
                                        <option key={province.id} value={province.id}>
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                                    Quận/Huyện <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="district"
                                    value={districtId}
                                    onChange={handleDistrictChange}
                                    disabled={!provinceId}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"
                                >
                                    <option value="">Chọn Quận/Huyện</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.id}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phường/Xã <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="ward"
                                    value={wardId}
                                    onChange={(e) => setWardId(e.target.value)}
                                    disabled={!districtId}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed"
                                >
                                    <option value="">Chọn Phường/Xã</option>
                                    {wards.map((ward) => (
                                        <option key={ward.id} value={ward.id}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-2">
                                Địa chỉ cụ thể <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <input
                                    id="streetAddress"
                                    type="text"
                                    value={streetAddress}
                                    onChange={(e) => setStreetAddress(e.target.value)}
                                    placeholder="Số nhà, tên đường, tổ, khu phố..."
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm bg-white"
                                />
                            </div>
                        </div>
                        {addressError && <p className="mt-2 text-sm text-red-600">{addressError}</p>}
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
                            Đăng ký
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <span className="text-base text-gray-600">Đã có tài khoản? </span>
                    <Link
                        to="/login"
                        className="text-base font-medium text-blue-600 hover:text-blue-500 transition-colors duration-300"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;