import { Link } from 'react-router-dom'

const NotFoundPage = () => {
    return (
        <div className="container mx-auto px-4 text-center">
            <div className="py-16 md:py-24">
                <div className="max-w-lg mx-auto">
                    <div className="bg-blue-100 text-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-6xl font-bold">
                        404
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">Không tìm thấy trang</h1>
                    <p className="text-gray-600 mb-8">
                        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/"
                            className="btn-primary inline-flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Quay về trang chủ
                        </Link>
                        <Link
                            to="#"
                            onClick={(e) => {
                                e.preventDefault();
                                window.history.back();
                            }}
                            className="btn-secondary inline-flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Quay lại trang trước
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotFoundPage 