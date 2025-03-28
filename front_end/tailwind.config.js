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
                    50: '#ebf5ff',
                    100: '#e1effe',
                    200: '#c3ddfd',
                    300: '#a4cafe',
                    400: '#76a9fa',
                    500: '#3f83f8',
                    600: '#1c64f2',
                    700: '#1a56db',
                    800: '#1e429f',
                    900: '#233876',
                },
                secondary: {
                    50: '#fdf2f2',
                    100: '#fde8e8',
                    200: '#fbd5d5',
                    300: '#f8b4b4',
                    400: '#f98080',
                    500: '#f05252',
                    600: '#e02424',
                    700: '#c81e1e',
                    800: '#9b1c1c',
                    900: '#771d1d',
                }
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
            boxShadow: {
                card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
            },
            animation: {
                'fadeIn': 'fadeIn 0.5s ease-out forwards',
            },
        },
    },
    plugins: [],
} 