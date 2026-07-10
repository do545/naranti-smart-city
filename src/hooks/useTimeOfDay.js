import { useState, useEffect } from 'react';

export const useTimeOfDay = () => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const checkTimeAndScheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const now = new Date();
      const hours = now.getHours();
      
      const isDayTime = hours >= 7 && hours < 19;

      const newTheme = isDayTime ? 'light' : 'dark';

      setTheme(newTheme);
      
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    };

    checkTimeAndScheme();
    const interval = setInterval(checkTimeAndScheme, 60000); 

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTimeAndScheme);

    return () => {
      clearInterval(interval);
      mediaQuery.removeEventListener('change', checkTimeAndScheme);
    };
  }, []);

  return theme;
};