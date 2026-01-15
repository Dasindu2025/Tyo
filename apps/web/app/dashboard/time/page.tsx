'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, X, Calendar as CalendarIcon, Clock, Briefcase } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export default function TimeEntriesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Time Entries</h1>
          <p className="text-muted-foreground">Manage and track your daily work hours.</p>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
        >
          <Plus className="w-5 h-5" />
          Add Entry
        </button>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
          >
            &lt;
          </button>
          <button 
             onClick={() => setCurrentDate(addMonths(currentDate, 1))}
             className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass rounded-3xl border-white/5 p-8">
        <div className="grid grid-cols-7 gap-4 mb-6">
          {weekdayLabels.map(label => (
            <div key={label} className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <motion.div
                key={day.toString()}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square rounded-2xl p-4 cursor-pointer transition-all relative group
                  ${isSelected ? 'bg-primary/20 neon-border' : 'bg-white/5 border border-white/5 hover:border-white/20'}
                `}
              >
                <span className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {/* Simulated hours dot */}
                {parseInt(format(day, 'd')) % 3 === 0 && (
                  <div className="mt-2 text-[10px] font-medium bg-neon-green/10 text-neon-green px-2 py-1 rounded-full w-fit">
                    8.5h
                  </div>
                )}

                {isToday && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Entry Drawer (Simple version) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-white/10 z-50 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">New Time Entry</h3>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    <span>{format(selectedDate, 'PPP')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Project</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary/50">
                    <option>Internal Project</option>
                    <option>Client Web App</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                    <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                      <Clock className="w-4 h-4 text-neon-cyan" />
                      <input type="time" className="bg-transparent outline-none w-full" defaultValue="09:00" stroke-color="#fff" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">End Time</label>
                    <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-white">
                      <Clock className="w-4 h-4 text-neon-pink" />
                      <input type="time" className="bg-transparent outline-none w-full" defaultValue="17:00" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary/50 min-h-[100px]"
                    placeholder="What did you work on?"
                  />
                </div>

                <button className="w-full bg-primary py-4 rounded-xl font-bold shadow-[0_10px_20px_rgba(139,92,246,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Save Entry
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
