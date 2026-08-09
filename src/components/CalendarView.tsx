import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Film, 
  Clock, 
  Tv, 
  AlertTriangle,
  Info,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, CalendarEvent } from '../types';

interface CalendarViewProps {
  projects: Project[];
  events: CalendarEvent[];
  onAddEvent?: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onUpdateEvent?: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent?: (id: string) => Promise<void>;
}

export default function CalendarView({ projects, events, onAddEvent, onUpdateEvent, onDeleteEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'shoot' | 'revision'>('all');

  // Event modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);

  // Form fields
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtType, setEvtType] = useState<'delivery' | 'shoot' | 'revision'>('delivery');
  const [evtColor, setEvtColor] = useState('#3B82F6');

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
            onClick={() => {
              setEvtTitle('');
              setEvtDate(new Date().toISOString().split('T')[0]);
              setEvtType('delivery');
              setEvtColor('#10B981');
              setIsAddModalOpen(true);
            }}
            className="px-3 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-charcoal-950 font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Event
          </button>
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
                        className="p-1 rounded text-[8px] font-mono font-bold text-charcoal-950 truncate flex items-center justify-between group cursor-pointer"
                        style={{ backgroundColor: evt.color || '#d4af37' }}
                        title={evt.title}
                        onClick={() => {
                          setEditingEvent(evt);
                          setEvtTitle(evt.title);
                          setEvtDate(evt.start);
                          setEvtType(evt.type || 'delivery');
                          setEvtColor(evt.color || '#3B82F6');
                        }}
                      >
                        <span className="truncate">{evt.title}</span>
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
              filteredEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 10).map((evt) => (
                <div 
                  key={evt.id} 
                  className="p-3 bg-charcoal-950/60 border border-luxury-green-800/10 rounded-xl space-y-1 relative overflow-hidden flex items-center justify-between gap-2 group"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1" style={{ backgroundColor: evt.color || '#d4af37' }} />
                  <div className="pl-1 min-w-0 flex-1">
                    <span className="text-[8px] font-mono text-gray-500 block uppercase">{evt.type} • {evt.start}</span>
                    <h4 className="text-xs font-semibold text-gray-200 truncate">{evt.title}</h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingEvent(evt);
                        setEvtTitle(evt.title);
                        setEvtDate(evt.start);
                        setEvtType(evt.type || 'delivery');
                        setEvtColor(evt.color || '#3B82F6');
                      }}
                      title="Edit Event"
                      className="p-1 rounded bg-charcoal-800 hover:bg-gold-500/20 text-gold-400 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEventToDeleteId(evt.id)}
                      title="Delete Event"
                      className="p-1 rounded bg-charcoal-800 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-gray-500 font-mono">No actions scheduled in this view block.</div>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE NEW EVENT MODAL */}
      {(isAddModalOpen || editingEvent) && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-gold-500/30 rounded-3xl w-full max-w-md p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                {editingEvent ? <Edit className="w-4 h-4 text-gold-400" /> : <Plus className="w-4 h-4 text-gold-400" />}
                {editingEvent ? 'Edit Scheduled Event' : 'Schedule New Event'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingEvent(null); }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!evtTitle || !evtDate) return;

                if (editingEvent && onUpdateEvent) {
                  await onUpdateEvent(editingEvent.id, {
                    title: evtTitle,
                    start: evtDate,
                    type: evtType,
                    color: evtColor
                  });
                } else if (onAddEvent) {
                  await onAddEvent({
                    title: evtTitle,
                    start: evtDate,
                    type: evtType,
                    color: evtColor
                  });
                }

                setIsAddModalOpen(false);
                setEditingEvent(null);
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label className="text-gray-400 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shoot Day 1 / Trailer Review"
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500/50"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">Type</label>
                  <select
                    value={evtType}
                    onChange={(e) => setEvtType(e.target.value as any)}
                    className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold-500/50 cursor-pointer"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="shoot">Shoot</option>
                    <option value="revision">Revision</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Badge Color</label>
                <div className="flex items-center gap-3">
                  {['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEvtColor(color)}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer ${evtColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingEvent(null); }}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold rounded-xl shadow-lg"
                >
                  {editingEvent ? 'Save Event' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE EVENT CONFIRMATION MODAL */}
      {eventToDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-charcoal-900 border border-red-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center text-white">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Delete Calendar Event</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">Are you sure you want to delete this event from the timeline calendar?</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEventToDeleteId(null)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 text-gray-300 hover:text-white text-xs font-mono font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteEvent && eventToDeleteId) {
                    await onDeleteEvent(eventToDeleteId);
                  }
                  setEventToDeleteId(null);
                }}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs font-mono shadow-lg cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
