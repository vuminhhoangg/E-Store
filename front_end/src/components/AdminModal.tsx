import React, { ReactNode } from 'react';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AdminModal: React.FC<AdminModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}) => {
    if (!isOpen) return null;

    // Xác định kích thước modal
    let sizeClass = 'max-w-md';
    switch (size) {
        case 'sm': sizeClass = 'max-w-sm'; break;
        case 'md': sizeClass = 'max-w-md'; break;
        case 'lg': sizeClass = 'max-w-lg'; break;
        case 'xl': sizeClass = 'max-w-xl'; break;
        default: sizeClass = 'max-w-md';
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay */}
                <div
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                {/* Modal */}
                <div
                    className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClass} w-full`}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline"
                >
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-between items-center border-b">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                            {title}
                        </h3>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Đóng</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-4 py-3 sm:p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminModal; 