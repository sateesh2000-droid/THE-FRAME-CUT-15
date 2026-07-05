import React from 'react';
import { 
  Bell, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppNotification } from '../types';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onClearNotification: (id: string) => Promise<void>;
}

export default function NotificationsView({ 
  notifications, 
  onMarkRead, 
  onClearNotification 
}: NotificationsViewProps) {

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'delivery_tomorrow':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'payment_pending':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'invoice_pending':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'project_completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'revision_request':
        return <AlertCircle className="w-5 h-5 text-pink-400" />;
      default:
        return <Bell className="w-5 h-5 text-gold-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header bar */}
      <div className="p-6 rounded-3xl glass-panel flex justify-between items-center relative overflow-hidden">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Production Notifications</h2>
          <p className="text-xs text-gray-400 mt-1">Automatic workflow status alerts, deadlines, and clearance reminders.</p>
        </div>

        <span className="text-xs font-mono font-bold bg-gold-500/15 border border-gold-500/30 text-gold-400 px-3.5 py-1.5 rounded-full">
          {unreadCount} UNREAD ALERTS
        </span>
      </div>

      {/* Notifications list */}
      <div className="space-y-4">
        {notifications.map((notif) => {
          return (
            <motion.div
              key={notif.id}
              layout
              className={`p-5 rounded-3xl border flex items-start justify-between transition-all ${
                notif.read 
                  ? 'bg-charcoal-900/40 border-luxury-green-800/10' 
                  : 'bg-gradient-to-r from-luxury-green-950/20 to-charcoal-900 border-gold-500/20'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-charcoal-950 rounded-2xl shrink-0 border border-luxury-green-800/10">
                  {getIcon(notif.type)}
                </div>

                <div>
                  <h4 className={`text-sm font-semibold text-gray-100 ${!notif.read ? 'font-bold text-white' : ''}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {!notif.read && (
                  <button
                    onClick={() => onMarkRead(notif.id)}
                    className="px-3 py-1.5 bg-luxury-green-800 hover:bg-luxury-green-700 text-gold-400 font-bold font-mono text-[9px] rounded-lg border border-gold-500/10 cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => onClearNotification(notif.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}

        {notifications.length === 0 && (
          <div className="text-center py-20 rounded-3xl border border-dashed border-luxury-green-800/15 text-gray-500 font-mono text-sm">
            Inbox is fully cleared. No pending system reminders.
          </div>
        )}
      </div>
    </div>
  );
}
