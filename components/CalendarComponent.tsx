// CalendarComponent.tsx
'use client';

import React from 'react';
import { Calendar } from 'react-big-calendar';
import CustomHeader from './CustomHeader';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/Calendar.css';

import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';

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

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  color?: string;
  crn: number;
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
  onEventDoubleClick?: (event: CalendarEvent) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  calendarEvents,
  eventStyleGetter,
  isMobile,
  onEventDoubleClick,
  onSelectEvent,
}) => {
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

  const ColoredDateCellWrapper = ({ children }: any) =>
    React.cloneElement(React.Children.only(children), {
      style: {
        backgroundColor: '#202124',
      },
    });

  return (
    <div id="calendar-container" className="flex flex-col h-full overflow-hidden">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        defaultView="week"
        startAccessor="start"
        endAccessor="end"
        style={{ flex: '1 1 auto', width: '100%' }}
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
        onDoubleClickEvent={onEventDoubleClick}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
};
export default CalendarComponent;