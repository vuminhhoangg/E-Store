/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1E3A8A',
                    50: '#5F83D9',
                    100: '#4C74D4',
                    200: '#2A57C5',
                    300: '#2347A1',
                    400: '#1E3A8A',
                    500: '#152C67',
                    600: '#0D1D44',
                    700: '#050E21',
                    800: '#000000',
                    900: '#000000'
                },
                secondary: {
                    DEFAULT: '#4ADE80',
                    50: '#E5FAE9',
                    100: '#D5F6DD',
                    200: '#B6EEC7',
                    300: '#97E7B0',
                    400: '#77DF99',
                    500: '#4ADE80',
                    600: '#2ECC70',
                    700: '#1EA358',
                    800: '#0E711D',
                    900: '#074C0E'
                }
            },
            fontFamily: {
                'sans': ['Roboto', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
                'serif': ['ui-serif', 'Georgia', 'Cambria', "Times New Roman", 'Times', 'serif'],
                'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
            },
            boxShadow: {
                'custom': '0 3px 10px 0 rgba(52, 63, 75, 0.12)',
            },
            animation: {
                fadeIn: 'fadeIn 0.3s ease-in-out',
                modalFadeIn: 'modalFadeIn 0.3s ease-in-out',
                slideIn: 'slideIn 0.4s ease-in-out',
                scaleIn: 'scaleIn 0.3s ease-in-out',
                slideInFromRight: 'slideInFromRight 0.4s ease-in-out',
                slideInFromBottom: 'slideInFromBottom 0.3s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                modalFadeIn: {
                    '0%': { opacity: '0', transform: 'translate(0, -20px)' },
                    '100%': { opacity: '1', transform: 'translate(0, 0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(-30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideInFromRight: {
                    '0%': { opacity: '0', transform: 'translateX(30px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInFromBottom: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
} 