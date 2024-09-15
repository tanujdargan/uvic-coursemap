import React from 'react'
import TopBar from '../components/TopBar';

interface PageLayoutProps {
  children: React.ReactNode
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default PageLayout