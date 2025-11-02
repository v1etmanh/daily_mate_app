module.exports = {
  // Các plugin PostCSS được sử dụng trong dự án của bạn
  plugins: {
    // Plugin Tailwind CSS.
    // Khi sử dụng Tailwind CSS v3.x trở lên, bạn chỉ cần khai báo như thế này.
    // PostCSS sẽ tự động tìm và sử dụng plugin từ package 'tailwindcss'.
    tailwindcss: {},
    
    // Plugin Autoprefixer.
    // Autoprefixer sẽ tự động thêm các tiền tố nhà cung cấp (vendor prefixes)
    // vào CSS của bạn để đảm bảo khả năng tương thích trình duyệt.
    autoprefixer: {},
    
    // Bạn có thể thêm các plugin PostCSS khác ở đây nếu cần.
    // Ví dụ: 'postcss-preset-env', 'cssnano', v.v.
    // 'postcss-flexbugs-fixes': {},
    // 'postcss-normalize': {},
  },
};
