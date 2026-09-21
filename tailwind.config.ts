import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme: { extend: { fontFamily: { mono: ['var(--font-mono)'], sans: ['var(--font-sans)'] } } }, plugins: [require('tailwindcss-animate')] };
export default config;
