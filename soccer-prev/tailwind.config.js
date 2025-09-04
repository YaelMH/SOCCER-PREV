// tailwind.config.js
const withMT = require("@material-tailwind/html/utils/withMT");

module.exports = withMT({
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto'],
      },
      colors: {
        primary: {
          50:"#E3F2FD",100:"#BBDEFB",200:"#90CAF9",300:"#64B5F6",
          400:"#42A5F5",500:"#2196F3",600:"#1E88E5",700:"#1976D2",
          800:"#1565C0",900:"#0D47A1"
        },
        secondary: {
          50:"#FCE4EC",100:"#F8BBD0",200:"#F48FB1",300:"#F06292",
          400:"#EC407A",500:"#E91E63",600:"#D81B60",700:"#C2185B",
          800:"#AD1457",900:"#880E4F"
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        lgm: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
        mdm: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      }
    }
  },
  plugins: [],
});
