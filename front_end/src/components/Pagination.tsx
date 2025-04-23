import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showPageNumbers?: boolean;
    maxPageNumbers?: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    showPageNumbers = true,
    maxPageNumbers = 5
}) => {
    // Không hiển thị phân trang nếu chỉ có 1 trang
    if (totalPages <= 1) return null;

    // Tính toán các trang để hiển thị
    const getPageNumbers = () => {
        const pageNumbers = [];

        // Xác định số trang hiển thị trước và sau trang hiện tại
        let startPage = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
        let endPage = Math.min(totalPages, startPage + maxPageNumbers - 1);

        // Điều chỉnh lại nếu không đủ trang ở cuối
        if (endPage - startPage + 1 < maxPageNumbers) {
            startPage = Math.max(1, endPage - maxPageNumbers + 1);
        }

        // Thêm trang đầu tiên và dấu chấm lửng nếu cần
        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) {
                pageNumbers.push('...');
            }
        }

        // Thêm các trang giữa
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        // Thêm dấu chấm lửng và trang cuối cùng nếu cần
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    return (
        <div className="flex items-center justify-center space-x-1">
            {/* Nút Trước */}
            <button
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md flex items-center
                    ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
                    }
                    transition-colors duration-200 text-sm font-medium`}
                aria-label="Trang trước"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Trước
            </button>

            {/* Số trang */}
            {showPageNumbers && getPageNumbers().map((page, index) => {
                if (page === '...') {
                    return (
                        <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                            ...
                        </span>
                    );
                }

                return (
                    <button
                        key={`page-${page}`}
                        onClick={() => onPageChange(page as number)}
                        className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium
                            ${currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200'
                            }
                            transition-colors duration-200`}
                        aria-label={`Trang ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                    >
                        {page}
                    </button>
                );
            })}

            {/* Nút Sau */}
            <button
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md flex items-center
                    ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
                    }
                    transition-colors duration-200 text-sm font-medium`}
                aria-label="Trang sau"
            >
                Sau
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default Pagination; 