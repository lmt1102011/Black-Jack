export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        felt: {
          950: '#06100d',
          900: '#0b1f17',
          800: '#103224',
          700: '#145338',
          600: '#16724a'
        },
        brass: '#d8ad5f',
        ruby: '#cf3e4f',
        ink: '#080b0d',
        ivory: '#f7f0de'
      },
      boxShadow: {
        table: '0 24px 80px rgba(0, 0, 0, 0.42)',
        glow: '0 0 0 1px rgba(216, 173, 95, 0.35), 0 18px 50px rgba(216, 173, 95, 0.14)'
      }
    }
  },
  plugins: []
};
