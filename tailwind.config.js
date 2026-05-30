/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 修仙主题色板（shadcn 风格命名）
        background: '#0f0f23',
        foreground: '#e0e0e0',
        card: '#1a1a3a',
        'card-foreground': '#e0e0e0',
        popover: '#1a1a3a',
        'popover-foreground': '#e0e0e0',
        primary: '#e94560',
        'primary-foreground': '#ffffff',
        secondary: '#2a2a5a',
        'secondary-foreground': '#e0e0e0',
        muted: '#1a1a2e',
        'muted-foreground': '#888888',
        accent: '#2a2a5a',
        'accent-foreground': '#e0e0e0',
        destructive: '#dc2626',
        'destructive-foreground': '#ffffff',
        border: '#2a2a5a',
        input: '#2a2a5a',
        ring: '#e94560',
        // 语义色
        'hp-gradient-from': '#e94560',
        'hp-gradient-to': '#ff6b81',
        'mp-gradient-from': '#4fc3f7',
        'mp-gradient-to': '#81d4fa',
        'exp-gradient-from': '#ffd54f',
        'exp-gradient-to': '#ffe082',
        'ai-blue': '#4fc3f7',
        'system-gold': '#f0c040',
        'player-blue': '#1a3a5c',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
