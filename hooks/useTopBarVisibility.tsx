// hooks/useTopBarVisibility.tsx
import { useState, useEffect } from 'react';

export function useTopBarVisibility() {
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const updateTopBarVisibility = () => {
      const scrollY = window.pageYOffset;
      if (scrollY > lastScrollY && scrollY > 50) {
        setIsTopBarVisible(false);
      } else if (scrollY < lastScrollY) {
        setIsTopBarVisible(true);
      }
      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', updateTopBarVisibility);

    return () => {
      window.removeEventListener('scroll', updateTopBarVisibility);
    };
  }, []);

  return isTopBarVisible;
}