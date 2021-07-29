module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'standard'
  ],
  plugins: [
    'greenit'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'greenit/no-function-call-in-loop-declaration': 'error',
    'greenit/no-multiple-css-modifications': 'warn',
    'greenit/measure-triggering-reflow': 'warn'
  }
}
