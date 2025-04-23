import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../components/AuthContext';
import { orderAPI } from '../services/orders';
import { User } from '../utils/auth';
import { addressService } from '../services/addressService';

// Interface for address data
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

interface Ward {
    id: string;
    name: string;
    level?: string;
}

interface CartItem {
    _id: string;
    name: string;
    image: string;
    price: number;
    countInStock: number;
    quantity: number;
    warrantyPeriodMonths: number;
}

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useContext(AuthContext);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [orderTotal, setOrderTotal] = useState(0);
    const [shippingFee, setShippingFee] = useState(0); // Đổi từ string sang number
    const [userData, setUserData] = useState<User | null>(null);

    // Address state
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        provinceId: '',
        districtId: '',
        wardId: '',
        notes: '',
        paymentMethod: 'cod', // 'cod', 'banking', 'momo'
    });

    useEffect(() => {
        // Kiểm tra đăng nhập
        if (!isLoggedIn) {
            toast.error('Vui lòng đăng nhập để tiếp tục thanh toán');
            navigate('/login?redirect=checkout');
            return;
        }

        // Lấy thông tin người dùng
        try {
            // Lấy thông tin người dùng từ localStorage
            const userInfoStr = localStorage.getItem('user_info');
            if (userInfoStr) {
                const userData = JSON.parse(userInfoStr) as User;
                setUserData(userData);

                // Cập nhật form với thông tin người dùng
                setFormData(prev => ({
                    ...prev,
                    fullName: userData.fullName || '',
                    phone: userData.phone || '',
                }));
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
        }

        // Lấy phương thức thanh toán từ localStorage
        const savedPaymentMethod = localStorage.getItem('paymentMethod');
        if (savedPaymentMethod) {
            setFormData(prev => ({
                ...prev,
                paymentMethod: savedPaymentMethod
            }));
        }

        // Lấy giỏ hàng từ local storage
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                if (parsedCart.length === 0) {
                    toast.info('Giỏ hàng của bạn đang trống');
                    navigate('/cart');
                    return;
                }
                setCartItems(parsedCart);

                // Tính tổng tiền
                const total = parsedCart.reduce(
                    (sum: number, item: CartItem) => sum + item.price * item.quantity,
                    0
                );
                setOrderTotal(total);

                // Tính phí vận chuyển
                if (total >= 5000000) {
                    setShippingFee(0); // Miễn phí vận chuyển cho đơn hàng từ 5 triệu trở lên
                } else {
                    setShippingFee(30000); // 30.000đ phí vận chuyển cho đơn hàng dưới 5 triệu
                }
            } catch (error) {
                console.error('Lỗi khi xử lý giỏ hàng:', error);
                toast.error('Đã xảy ra lỗi khi tải giỏ hàng');
            }
        } else {
            toast.info('Giỏ hàng của bạn đang trống');
            navigate('/cart');
        }

        // Load provinces
        const loadProvinces = async () => {
            try {
                const data = await addressService.getProvinces();
                setProvinces(data);
            } catch (error) {
                console.error('Error loading provinces:', error);
                toast.error('Không thể tải danh sách tỉnh/thành phố');
            }
        };

        loadProvinces();
    }, [isLoggedIn, navigate, user]);

    const loadDistricts = async (provinceId: string) => {
        if (!provinceId) return;

        try {
            const data = await addressService.getDistricts(provinceId);
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
            return data;
        } catch (error) {
            console.error('Error loading wards:', error);
            throw new Error('Không thể tải danh sách phường/xã');
        }
    };

    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedProvinceId = e.target.value;
        setFormData(prev => ({
            ...prev,
            provinceId: selectedProvinceId,
            districtId: '',
            wardId: '',
        }));
        setDistricts([]);
        setWards([]);

        if (selectedProvinceId) {
            try {
                const data = await loadDistricts(selectedProvinceId);
                if (data && data.length > 0) {
                    setDistricts(data || []);
                } else {
                    setDistricts([]);
                }
            } catch (error) {
                console.error('Error loading districts:', error);
                toast.error('Không thể tải danh sách quận/huyện');
            }
        } else {
            setDistricts([]);
        }
    };

    const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDistrictId = e.target.value;
        setFormData(prev => ({
            ...prev,
            districtId: selectedDistrictId,
            wardId: '',
        }));
        setWards([]);

        if (selectedDistrictId) {
            try {
                const data = await loadWards(selectedDistrictId);
                if (data && data.length > 0) {
                    setWards(data);
                } else {
                    setWards([]);
                }
            } catch (error) {
                console.error('Error loading wards:', error);
                toast.error('Không thể tải danh sách phường/xã');
            }
        } else {
            setWards([]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Kiểm tra tất cả các trường bắt buộc
        const requiredFields = ['fullName', 'phone', 'provinceId', 'districtId', 'wardId'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

        if (missingFields.length > 0) {
            toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
            return;
        }

        // Validate phone - thay đổi regex để nhất quán với trang đăng ký
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            toast.error('Số điện thoại phải có 10 chữ số');
            return;
        }

        // Lưu thông tin giao hàng vào localStorage
        const provinceName = provinces.find(p => p.id === formData.provinceId)?.name || '';
        const districtName = districts.find(d => d.id === formData.districtId)?.name || '';
        const wardName = wards.find(w => w.id === formData.wardId)?.name || '';

        const shippingInfo = {
            fullName: formData.fullName,
            phone: formData.phone,
            address: `${wardName}, ${districtName}, ${provinceName}`,
            city: provinceName,
            district: districtName,
            ward: wardName,
            email: userData?.email || '',
            notes: formData.notes
        };
        localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
        localStorage.setItem('paymentMethod', formData.paymentMethod);

        // Chuyển đến trang tóm tắt đơn hàng
        navigate('/order-summary');
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Thanh toán đơn hàng</h1>
                    <p className="text-gray-600 text-center">Vui lòng kiểm tra thông tin đơn hàng và điền đầy đủ thông tin giao hàng</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Thông tin giao hàng */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                Thông tin giao hàng
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fullName">
                                            Họ và tên <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="phone">
                                            Số điện thoại <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="provinceId">
                                            Tỉnh/Thành phố <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            id="provinceId"
                                            name="provinceId"
                                            value={formData.provinceId}
                                            onChange={handleProvinceChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            required
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
                                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="districtId">
                                            Quận/Huyện <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            id="districtId"
                                            name="districtId"
                                            value={formData.districtId}
                                            onChange={handleDistrictChange}
                                            disabled={!formData.provinceId}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            required
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
                                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="wardId">
                                            Phường/Xã <span className="text-red-600">*</span>
                                        </label>
                                        <select
                                            id="wardId"
                                            name="wardId"
                                            value={formData.wardId}
                                            onChange={handleInputChange}
                                            disabled={!formData.districtId}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                            required
                                        >
                                            <option value="">Chọn Phường/Xã</option>
                                            {wards.map((ward) => (
                                                <option key={ward.id} value={ward.id}>
                                                    {ward.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="notes">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                </svg>
                                Phương thức thanh toán
                            </h2>
                            <div className="space-y-4 mt-4">
                                <div className={`${formData.paymentMethod === 'cod' ? 'bg-blue-50 border-blue-500 border-2' : 'bg-white border-gray-200 border hover:bg-gray-50'} transition-colors duration-200 rounded-xl overflow-hidden`}>
                                    <label className="flex items-center cursor-pointer w-full p-4">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={formData.paymentMethod === 'cod'}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-4 flex items-center flex-grow">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mr-4">
                                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">Thanh toán khi nhận hàng (COD)</p>
                                                <p className="text-sm text-gray-600">Trả tiền mặt sau khi nhận và kiểm tra hàng</p>
                                                <div className="mt-2 text-xs text-green-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                    <span>Kiểm tra hàng trước khi thanh toán</span>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className={`${formData.paymentMethod === 'banking' ? 'bg-blue-50 border-blue-500 border-2' : 'bg-white border-gray-200 border hover:bg-gray-50'} transition-colors duration-200 rounded-xl overflow-hidden`}>
                                    <label className="flex items-center cursor-pointer w-full p-4">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="banking"
                                            checked={formData.paymentMethod === 'banking'}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-4 flex items-center flex-grow">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mr-4">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">Chuyển khoản ngân hàng</p>
                                                <p className="text-sm text-gray-600">Nhận ngay ưu đãi khi thanh toán qua ngân hàng</p>
                                                {formData.paymentMethod === 'banking' && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                        <p className="text-sm text-gray-700 font-medium">Thông tin chuyển khoản:</p>
                                                        <p className="text-sm text-gray-600 mt-1">Ngân hàng: <span className="font-medium">Vietcombank</span></p>
                                                        <p className="text-sm text-gray-600">Số tài khoản: <span className="font-medium">1234567890</span></p>
                                                        <p className="text-sm text-gray-600">Chủ tài khoản: <span className="font-medium">CÔNG TY TNHH E-STORE</span></p>
                                                        <p className="text-sm text-gray-600">Nội dung: <span className="font-medium">Thanh toan don hang [Số điện thoại]</span></p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className={`${formData.paymentMethod === 'momo' ? 'bg-blue-50 border-blue-500 border-2' : 'bg-white border-gray-200 border hover:bg-gray-50'} transition-colors duration-200 rounded-xl overflow-hidden`}>
                                    <label className="flex items-center cursor-pointer w-full p-4">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="momo"
                                            checked={formData.paymentMethod === 'momo'}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-4 flex items-center flex-grow">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 mr-4">
                                                <svg className="w-6 h-6 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25zm-1.125 5.25c-.621 0-1.125.504-1.125 1.125s.504 1.125 1.125 1.125 1.125-.504 1.125-1.125-.504-1.125-1.125-1.125zm2.25 0c-.621 0-1.125.504-1.125 1.125s.504 1.125 1.125 1.125 1.125-.504 1.125-1.125-.504-1.125-1.125-1.125zm-1.125 3.75c-2.068 0-3.75 1.682-3.75 3.75h7.5c0-2.068-1.682-3.75-3.75-3.75z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">Ví MoMo</p>
                                                <p className="text-sm text-gray-600">Thanh toán nhanh chóng qua ví điện tử MoMo</p>
                                                {formData.paymentMethod === 'momo' && (
                                                    <div className="mt-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                                                        <p className="text-sm text-gray-700 font-medium">Quét mã QR để thanh toán:</p>
                                                        <div className="mt-2 bg-white p-2 rounded-lg inline-block">
                                                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                                                                <span className="text-xs text-gray-500">Mã QR sẽ hiển thị sau khi xác nhận đơn hàng</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin đơn hàng */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-20">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                    </svg>
                                    Thông tin đơn hàng
                                </h2>

                                <div className="max-h-80 overflow-y-auto pr-2 mb-4">
                                    {cartItems.map((item) => (
                                        <div key={item._id} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                                            <div className="h-16 w-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'https://via.placeholder.com/150';
                                                    }}
                                                />
                                            </div>
                                            <div className="ml-4 flex-grow">
                                                <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h3>
                                                <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                                                <p className="text-xs text-gray-500">Bảo hành: {item.warrantyPeriodMonths} tháng</p>
                                            </div>
                                            <div className="ml-3 text-right">
                                                <p className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tạm tính:</span>
                                        <span className="font-medium">{formatPrice(orderTotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Phí vận chuyển:</span>
                                        <span className="font-medium">
                                            {shippingFee === 0
                                                ? <span className="text-green-600">Miễn phí</span>
                                                : formatPrice(shippingFee)
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200 text-lg font-bold">
                                        <span className="text-gray-800">Tổng cộng:</span>
                                        <span className="text-blue-600">{formatPrice(orderTotal + shippingFee)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className={`w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow font-medium text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Đặt hàng'
                                    )}
                                </button>
                                <p className="text-xs text-gray-500 mt-3 text-center">
                                    Bằng cách nhấn "Đặt hàng", bạn đồng ý với{' '}
                                    <a href="#" className="text-blue-600 hover:underline">
                                        điều khoản & điều kiện
                                    </a>{' '}
                                    và{' '}
                                    <a href="#" className="text-blue-600 hover:underline">
                                        chính sách bảo mật
                                    </a>{' '}
                                    của chúng tôi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage; 