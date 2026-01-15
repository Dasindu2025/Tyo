'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', hours: 8 },
  { name: 'Tue', hours: 9.5 },
  { name: 'Wed', hours: 7 },
  { name: 'Thu', hours: 10 },
  { name: 'Fri', hours: 8.5 },
  { name: 'Sat', hours: 4 },
  { name: 'Sun', hours: 0 },
];

const stats = [
  { label: 'Hours this Week', value: '47.5h', icon: Clock, color: 'text-neon-cyan' },
  { label: 'Approved Entries', value: '12', icon: CheckCircle, color: 'text-neon-green' },
  { label: 'Pending Approval', value: '3', icon: AlertCircle, color: 'text-neon-pink' },
  { label: 'Efficiency', value: '94%', icon: TrendingUp, color: 'text-neon-purple' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome Back, Acme Admin</h1>
        <p className="text-muted-foreground">Here is what is happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border-white/5 relative group hover:border-primary/30 transition-colors"
          >
            <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className={`w-2 h-2 rounded-full animate-pulse ${stat.color === 'text-neon-green' ? 'bg-neon-green' : 'bg-primary'}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass p-6 rounded-2xl border-white/5 h-[400px]"
        >
          <h3 className="text-lg font-semibold mb-6">Work Hours Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorHours)" 
                strokeWidth={3}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 rounded-2xl border-white/5 overflow-hidden relative"
        >
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                <div>
                  <div className="text-sm font-medium">Logged 8h for "Internal Project"</div>
                  <div className="text-xs text-muted-foreground">Today at 09:30 AM</div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
}
