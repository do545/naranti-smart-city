import React, { createContext, useState, useContext } from 'react';

const KioskThemeContext = createContext();

export const useKioskTheme = () => useContext(KioskThemeContext);

const initialTheme = {
  gradientColor1: '#1F1F1F',
  gradientColor2: '#000000',
  buttonBorderRadius: 24,
  buttonPadding: 32,
  showAdBanner: true,
};

export const KioskThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(initialTheme);

  const updateTheme = (newTheme) => {
    setTheme(prevTheme => ({ ...prevTheme, ...newTheme }));
  };

  const resetTheme = () => {
    setTheme(initialTheme);
  };

  const value = { theme, updateTheme, resetTheme, initialTheme };

  return (
    <KioskThemeContext.Provider value={value}>
      {children}
    </KioskThemeContext.Provider>
  );
};