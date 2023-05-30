/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './matchmaker/static/src/**/*.{ts,tsx,js,jsx}',
        './node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                'pure-blue': 'rgb(0, 0, 255)'
            }
        }
    },
    plugins: [
        require('flowbite/plugin')
    ],
    darkMode: 'class',
}