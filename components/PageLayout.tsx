import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust the breakpoint as needed
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize); // Listen for resize events
    return () => window.removeEventListener('resize', handleResize); // Cleanup
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTopBarVisible={isTopBarVisible} // Pass the prop
      />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
};
export default PageLayout;