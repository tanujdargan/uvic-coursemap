// components/CalendarComponent.tsx

'use client';

import React from 'react';
import { Calendar } from 'react-big-calendar';
import CustomHeader from './CustomHeader';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/Calendar.css'; 

import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

// ** Define locales and localizer for react-big-calendar **
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// ** Define the props interface **
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

interface CalendarComponentProps {
  calendarEvents: CalendarEvent[];
  eventStyleGetter?: (
    event: CalendarEvent,
    start: Date,
    end: Date,
    isSelected: boolean
  ) => { style: React.CSSProperties };
  isMobile: boolean;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  calendarEvents,
  eventStyleGetter,
  isMobile,
}) => {
  // ** Default event style getter if not provided **
  const defaultEventStyleGetter = (
    event: CalendarEvent,
    start: Date,
    end: Date,
    isSelected: boolean
  ) => {
    const backgroundColor = event.color || '#3c4043';
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return {
      style,
    };
  };

  // ** Define custom date cell wrapper for time slot styling **
  const ColoredDateCellWrapper = ({ children }: any) =>
    React.cloneElement(React.Children.only(children), {
      style: {
        backgroundColor: '#202124',
      },
    });

  return (
    <div
      id="calendar-container"
      className={`flex flex-col overflow-hidden flex-1 ${
        isMobile ? '' : 'w-1/2'
      }`}
    >
      <div className="flex-1 overflow-y-auto p-0">
        {/* React Big Calendar Component */}
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          defaultView="week"
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter || defaultEventStyleGetter}
          components={{
            timeSlotWrapper: ColoredDateCellWrapper,
            header: CustomHeader,
          }}
          views={['week']}
          step={60}
          timeslots={1}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
          toolbar={false} // Hide the default toolbar
        />
      </div>
    </div>
  );
};

export default CalendarComponent;