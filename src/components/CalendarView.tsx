import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  Clock, 
  Tv, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { Project, CalendarEvent } from '../types';

interface CalendarViewProps {
  projects: Project[];
  events: CalendarEvent[];
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
}

export default function CalendarView({ projects, events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'shoot' | 'revision'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Compile calendar events from database calendar + project due dates
  const compiledEvents: CalendarEvent[] = [
    // Database events
    ...events,
    // Auto-generate shoot date events
    ...projects.map(p => ({
      id: `shoot-${p.id}`,
      title: `Shoot: ${p.coupleName}`,
      start: p.shootDate,
      type: 'shoot' as const,
      projectId: p.id,
      coupleName: p.coupleName,
      color: '#3B82F6' // blue
    })),
    // Auto-generate delivery deadline events
    ...projects.map(p => ({
      id: `deliv-${p.id}`,
      title: `Deliver: ${p.coupleName}`,
      start: p.deliveryDate,
      type: 'delivery' as const,
      projectId: p.id,
      coupleName: p.coupleName,
      color: '#10B981' // emerald
    }))
  ].filter(evt => evt.start); // filter out empty dates

  // Filter calendar list
  const filteredEvents = compiledEvents.filter(evt => {
    if (filterType === 'all') return true;
    return evt.type === filterType;
  });

  // Calculate calendar grid days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Pre-padding empty blocks
  const paddingBlocks = Array.from({ length: firstDayIndex }, (_, i) => null);
  const calendarBlocks = [...paddingBlocks, ...daysArray];

  // Helper to find events on a given date
  const getEventsForDay = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(evt => evt.start === dStr);
  };

  return (
    <div className="space-y-6">
      
      {/* Filters & Navigation */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-charcoal-900 border border-luxury-green-800/30 p-1.5 rounded-2xl">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-luxury-green-800/40 hover:text-gold-400 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold font-display text-white px-3 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-luxury-green-800/40 hover:text-gold-400 rounded-xl transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all ${filterType === 'all' ? 'bg-luxury-green-800 text-gold-400 font-bold' : 'bg-charcoal-900 text-gray-400'}`}
          >
            All Scheduled Items
          </button>
          <button
            onClick={() => setFilterType('delivery')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all ${filterType === 'delivery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' : 'bg-charcoal-900 text-gray-400'}`}
          >
            Deliveries
          </button>
          <button
            onClick={() => setFilterType('shoot')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all ${filterType === 'shoot' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold' : 'bg-charcoal-900 text-gray-400'}`}
          >
            Shoots
          </button>
          <button
            onClick={() => setFilterType('revision')}
            className={`px-3 py-2 rounded-xl text-xs font-mono transition-all ${filterType === 'revision' ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-bold' : 'bg-charcoal-900 text-gray-400'}`}
          >
            Revisions
          </button>
        </div>
      </div>

      {/* Main Grid & Sidemenu */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Calendar Grid */}
        <div className="xl:col-span-3 p-6 rounded-3xl glass-panel">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-gray-500 mb-4 border-b border-luxury-green-800/10 pb-3">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarBlocks.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} className="h-28 bg-charcoal-950/20 rounded-2xl border border-dashed border-luxury-green-800/5 opacity-40" />
                );
              }

              const dayEvents = getEventsForDay(day);

              return (
                <div 
                  key={`day-${day}`} 
                  className="h-28 p-2 rounded-2xl bg-charcoal-900/60 border border-luxury-green-800/10 flex flex-col justify-between hover:border-gold-500/20 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-400 font-mono self-end">{day}</span>
                  
                  <div className="space-y-1 overflow-y-auto max-h-[70px] pr-0.5 custom-scrollbar">
                    {dayEvents.map((evt) => (
                      <div 
                        key={evt.id} 
                        className="p-1 rounded text-[8px] font-mono font-bold text-charcoal-950 truncate"
                        style={{ backgroundColor: evt.color || '#d4af37' }}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deliveries Timeline sidebar panel */}
        <div className="p-6 rounded-3xl glass-panel space-y-4">
          <h3 className="text-sm font-bold font-display text-white">Daily Milestones List</h3>
          <p className="text-xs text-gray-400">Chronological pipeline items due this period.</p>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredEvents.length > 0 ? (
              filteredEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 6).map((evt) => (
                <div 
                  key={evt.id} 
                  className="p-3 bg-charcoal-950/60 border border-luxury-green-800/10 rounded-xl space-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: evt.color || '#d4af37' }} />
                  <span className="text-[8px] font-mono text-gray-500 block uppercase pl-1">{evt.type} • {evt.start}</span>
                  <h4 className="text-xs font-semibold text-gray-200 truncate pl-1">{evt.title}</h4>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-gray-500 font-mono">No actions scheduled in this view block.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
