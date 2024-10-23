// CalendarComponent.tsx
'use client';

import React from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  CalendarProps,
  Event as RBCEvent,
  View,
} from 'react-big-calendar';
import withDragAndDrop, {
  withDragAndDropProps,
} from 'react-big-calendar/lib/addons/dragAndDrop';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import CustomHeader from './CustomHeader';
import '../styles/Calendar.css';

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

// Define the CalendarEvent interface
export interface CalendarEvent {
  id: number; // Unique identifier for events
  title: string;
  start: Date;
  end: Date;
  color?: string;
  crn?: number; // Optional, since custom events may not have a CRN
}

// Define the EventInteractionArgs interface
interface EventInteractionArgs {
  event: CalendarEvent;
  start: Date;
  end: Date;
  allDay?: boolean;
  isAllDay?: boolean;
  resourceId?: any;
}

// Define the SlotInfo interface
interface SlotInfo {
  start: Date;
  end: Date;
  slots: Date[];
  action: 'select' | 'click' | 'doubleClick';
  resourceId?: any;
}

interface CalendarComponentProps {
  calendarEvents: CalendarEvent[];
  eventStyleGetter?: (
    event: CalendarEvent,
    start: Date,
    end: Date,
    isSelected: boolean
  ) => { className?: string; style?: React.CSSProperties };
  isMobile: boolean;
  onEventDoubleClick?: (event: CalendarEvent, e: React.SyntheticEvent<HTMLElement>) => void;
  onSelectEvent?: (event: CalendarEvent, e: React.SyntheticEvent<HTMLElement>) => void;
  onEventDrop?: (args: EventInteractionArgs) => void;
  onEventResize?: (args: EventInteractionArgs) => void;
  onSlotSelect?: (slotInfo: SlotInfo) => void;
}

// Use the drag-and-drop higher-order component with correct generics
const DragAndDropCalendar = withDragAndDrop<
  CalendarEvent,
  React.FC<CalendarComponentProps>
>(Calendar);

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  calendarEvents,
  eventStyleGetter,
  isMobile,
  onEventDoubleClick,
  onSelectEvent,
  onEventDrop,
  onEventResize,
  onSlotSelect,
}) => {
  // Default event style if none is provided
  const defaultEventStyleGetter = (
    event: CalendarEvent,
    start: Date,
    end: Date,
    isSelected: boolean
  ): { className?: string; style?: React.CSSProperties } => {
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
      <DragAndDropCalendar
        localizer={localizer}
        events={calendarEvents}
        defaultView="week"
        startAccessor={(event: CalendarEvent) => event.start}
        endAccessor={(event: CalendarEvent) => event.end}
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
        //Somehow fixed the issue here, do not ask how. do not change it. I will find you if you do.
        onEventDrop={(args) => {
          const start = typeof args.start === 'string' ? new Date(args.start) : args.start;
          const end = typeof args.end === 'string' ? new Date(args.end) : args.end;
          onEventDrop && onEventDrop({ ...args, start, end });
        }}
        onEventResize={(args) => {
          const start = typeof args.start === 'string' ? new Date(args.start) : args.start;
          const end = typeof args.end === 'string' ? new Date(args.end) : args.end;
          onEventResize && onEventResize({ ...args, start, end });
        }}
        selectable
        resizable
        onSelectSlot={onSlotSelect}
      />
    </div>
  );
};
export default CalendarComponent;