import React, { useState, useRef, useEffect } from 'react';
import './tooltip.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      setIsVisible(true);
      updatePosition(e);
    };
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isVisible) {
        updatePosition(e);
      }
    };

    const target = targetRef.current;
    if (target) {
      target.addEventListener('mouseenter', handleMouseEnter);
      target.addEventListener('mouseleave', handleMouseLeave);
      target.addEventListener('mousemove', handleMouseMove);

      return () => {
        target.removeEventListener('mouseenter', handleMouseEnter);
        target.removeEventListener('mouseleave', handleMouseLeave);
        target.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isVisible]);

  const updatePosition = (e: MouseEvent) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 计算tooltip的位置，确保不会超出视口
    let x = e.clientX + 8; // 鼠标右侧8px
    let y = e.clientY + 8; // 鼠标下方8px

    // 如果tooltip会超出右边界，则显示在鼠标左侧
    if (x + tooltipRect.width > viewportWidth) {
      x = e.clientX - tooltipRect.width - 8;
    }

    // 如果tooltip会超出下边界，则显示在鼠标上方
    if (y + tooltipRect.height > viewportHeight) {
      y = e.clientY - tooltipRect.height - 8;
    }

    setPosition({ x, y });
  };

  return (
    <div className="tooltip-container" ref={targetRef}>
      {children}
      {isVisible && (
        <div 
          className="tooltip"
          ref={tooltipRef}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
