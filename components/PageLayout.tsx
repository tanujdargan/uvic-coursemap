import React from 'react'
import TopBar from '../components/TopBar';

interface PageLayoutProps {
  children: React.ReactNode
}

export default PageLayout() {

const [isMobile, setIsMobile] = useState<boolean>(false);
const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar 
        isMobile={isMobile}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}/>
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}