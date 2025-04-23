import React from 'react';

interface LoadingProps {
    size?: 'small' | 'medium' | 'large';
    className?: string;
    text?: string;
}

const Loading: React.FC<LoadingProps> = ({
    size = 'medium',
    className = '',
    text
}) => {
    // Xác định kích thước dựa trên prop
    const sizeClass = {
        small: 'w-5 h-5',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    }[size];

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`${sizeClass} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
            {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
        </div>
    );
};

export default Loading; 