import React, { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    animationType?: 'fade' | 'slide' | 'scale' | 'bounce';
    closeOnClickOutside?: boolean;
    showCloseButton?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    animationType = 'fade',
    closeOnClickOutside = true,
    showCloseButton = true,
    size = 'md',
}) => {
    const [isShowing, setIsShowing] = useState(false);
    const [isOverlayAnimating, setIsOverlayAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsShowing(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsShowing(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }

        // Handle escape key press to close modal
        const handleEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [isOpen, onClose]);

    if (!isShowing) return null;

    const animationClasses = {
        fade: 'animate-modalFadeIn',
        slide: 'animate-slideIn',
        scale: 'animate-scaleIn',
        bounce: 'animate-bounceIn',
    };

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && closeOnClickOutside) {
            setIsOverlayAnimating(true);
            setTimeout(() => {
                setIsOverlayAnimating(false);
                onClose();
            }, 150);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-all duration-300 backdrop-blur-sm ${isOpen ? 'opacity-100' : 'opacity-0'} ${isOverlayAnimating ? 'bg-opacity-70' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`bg-white rounded-lg shadow-xl overflow-hidden w-full transform ${sizeClasses[size]} ${animationClasses[animationType]} transition-all duration-300 ease-in-out`}
                style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen
                        ? 'scale(1) translateY(0)'
                        : animationType === 'slide'
                            ? 'scale(1) translateY(50px)'
                            : animationType === 'scale'
                                ? 'scale(0.95)'
                                : animationType === 'bounce'
                                    ? 'scale(0.9) translateY(10px)'
                                    : 'scale(1)',
                }}
            >
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    {showCloseButton && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none transition-all duration-200 hover:rotate-90 transform hover:scale-110"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    );
};

export default Modal; 