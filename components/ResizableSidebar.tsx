'use client'

import React, { useState, useCallback, useEffect } from 'react'

interface ResizableSidebarProps {
  children: React.ReactNode
  minWidth?: number
  maxWidth?: number
}

const ResizableSidebar: React.FC<ResizableSidebarProps> = ({ children, minWidth = 200, maxWidth = 600 }) => {
  const [width, setWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth)
        }
      }
    },
    [isResizing, minWidth, maxWidth]
  )

  useEffect(() => {
    window.addEventListener('mousemove', resize)
    window.addEventListener('mouseup', stopResizing)
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [resize, stopResizing])

  return (
    <div className="flex h-full">
      <div style={{ width: width }} className="bg-gray-800 overflow-auto">
        {children}
      </div>
      <div
        className="w-1 bg-gray-600 cursor-col-resize"
        onMouseDown={startResizing}
      />
    </div>
  )
}

export default ResizableSidebar