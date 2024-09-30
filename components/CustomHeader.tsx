// components/CustomHeader.tsx

'use client';

import React from 'react';
import { HeaderProps } from 'react-big-calendar';

const CustomHeader: React.FC<HeaderProps> = ({ date, localizer }) => {
  const dayName = localizer.format(date, 'eee'); // e.g., 'Mon'
  const dayNumber = localizer.format(date, 'd'); // e.g., '4'

  const isToday = isSameDay(date, new Date());

  return (
    <button type="button" className="rbc-button-link custom-header-button">
      <div className="rbc-header custom-header-content">
        <span className={`custom-header-day-name ${isToday ? 'today' : ''}`}>
          {dayName}
        </span>
        <span className={`custom-header-day-number ${isToday ? 'today' : ''}`}>
          {dayNumber}
        </span>
      </div>
    </button>
  );
};

export default CustomHeader;

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}