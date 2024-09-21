// components/CustomHeader.tsx

'use client';

import React from 'react';

// ** Props Interface **
interface CustomHeaderProps {
  date: Date;
  label: string;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ date }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayIndex = date.getDay();
  const dayName = daysOfWeek[dayIndex];
  const dayNumber = date.getDate();

  const isToday = isSameDay(date, new Date());

  return (
    <div
      className="rbc-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px 0',
      }}
    >
      <span
        style={{
          fontSize: '14px',
          color: isToday ? '#4285F4' : '#e8eaed',
        }}
      >
        {dayName}
      </span>
      <span
        style={{
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: isToday ? '#4285F4' : 'transparent',
          color: 'white',
          width: '28px',
          height: '28px',
          lineHeight: '28px',
          borderRadius: '50%',
          textAlign: 'center',
          marginTop: '4px',
        }}
      >
        {dayNumber}
      </span>
    </div>
  );
};

export default CustomHeader;

// ** Helper function to check if two dates are the same day **
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}