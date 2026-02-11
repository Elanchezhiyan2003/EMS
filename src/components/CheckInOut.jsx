import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Timer } from 'lucide-react';
import { supabase } from '../supabase/client';

function CheckInOut({ userId, onCheck }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [workDone, setWorkDone] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '--:--';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const fetchTodayRecord = async () => {
    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTodayRecord(data);
    } catch (err) {
      console.error('Error fetching today record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayRecord();
  }, [userId]);

  // Timer Logic
  useEffect(() => {
    let interval;

    if (todayRecord?.check_in && !todayRecord?.check_out) {
      const startTimer = () => {
        const now = new Date();
        const [hours, minutes, seconds] = todayRecord.check_in.split(':').map(Number);
        const checkInDate = new Date();
        checkInDate.setHours(hours, minutes, seconds);

        const diff = now - checkInDate;

        // Handle case where check-in might be from "yesterday" if overnight (edge case, simplified here for same-day)
        // If diff is negative, it might be due to small clock skews or parsing, just zero it
        if (diff < 0) return '00:00:00';

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      // Initial set
      setElapsedTime(startTimer());

      // Interval
      interval = setInterval(() => {
        setElapsedTime(startTimer());
      }, 1000);
    } else if (todayRecord?.check_in && todayRecord?.check_out) {
      // Calculate final duration if done
      const [h1, m1, s1] = todayRecord.check_in.split(':').map(Number);
      const [h2, m2, s2] = todayRecord.check_out.split(':').map(Number);
      const d1 = new Date().setHours(h1, m1, s1);
      const d2 = new Date().setHours(h2, m2, s2);
      const diff = d2 - d1;

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    } else {
      setElapsedTime('00:00:00');
    }

    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');
    try {
      const today = getTodayDate();
      const currentTime = getCurrentTime();
      const { data, error } = await supabase
        .from('attendance')
        .insert([{ user_id: userId, date: today, check_in: currentTime }])
        .select()
        .single();

      if (error) throw error;
      setTodayRecord(data);
      if (onCheck) onCheck();
      setMessage('Check-in successful!');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCheckOut = async () => {
    if (!workDone.trim()) {
      setMessage('Work details required');
      return;
    }
    setActionLoading(true);
    setMessage('');
    try {
      const currentTime = getCurrentTime();
      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out: currentTime, work_done: workDone })
        .eq('id', todayRecord.id)
        .select()
        .single();

      if (error) throw error;
      setTodayRecord(data);
      if (onCheck) onCheck();
      setMessage('Check-out successful!');
      setShowModal(false);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('attendance_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          if (
            (payload.new && payload.new.user_id === userId) ||
            (payload.old && payload.old.user_id === userId)
          ) {
            fetchTodayRecord();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  const hasCheckedIn = todayRecord && todayRecord.check_in;
  const hasCheckedOut = todayRecord && todayRecord.check_out;

  return (
    <div className="glass-card p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            Today's Activity
          </h3>

          {/* Timer Display */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-medium ${hasCheckedIn && !hasCheckedOut
              ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
              : 'bg-gray-50 text-gray-500 border-gray-100'
            }`}>
            <Timer className="w-4 h-4" />
            <span>{elapsedTime}</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className="text-gray-500 font-medium text-sm uppercase tracking-wider">Date</span>
            <span className="font-bold text-lg text-gray-800">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {hasCheckedIn && (
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100 animate-fade-in">
              <span className="text-green-700 font-bold text-sm uppercase tracking-wider">Checked In</span>
              <span className="font-bold text-xl text-green-700">{formatTime12Hour(todayRecord.check_in)}</span>
            </div>
          )}

          {hasCheckedOut && (
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl border border-purple-100 animate-fade-in">
              <span className="text-purple-700 font-bold text-sm uppercase tracking-wider">Checked Out</span>
              <span className="font-bold text-xl text-purple-700">{formatTime12Hour(todayRecord.check_out)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleCheckIn}
          disabled={hasCheckedIn || actionLoading}
          className={`w-full ${hasCheckedIn ? 'btn-disabled' : 'btn-success'}`}
        >
          <LogIn className="w-5 h-5" />
          {actionLoading && !hasCheckedIn ? '...' : 'Check In'}
        </button>

        <button
          onClick={() => { setWorkDone(''); setShowModal(true); }}
          disabled={!hasCheckedIn || hasCheckedOut || actionLoading}
          className={`w-full ${!hasCheckedIn || hasCheckedOut ? 'btn-disabled' : 'btn-danger'}`}
        >
          <LogOut className="w-5 h-5" />
          {actionLoading && hasCheckedIn ? '...' : 'Check Out'}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 bg-white shadow-2xl">
            <h4 className="text-2xl font-bold mb-2">Check Out</h4>
            <p className="text-gray-500 mb-6">Summarize your work for today.</p>

            <textarea
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              className="w-full p-4 border rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32 text-gray-700 leading-relaxed"
              placeholder="e.g. Completed the frontend dashboard, fixed login bugs..."
              autoFocus
            />

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckOut}
                disabled={actionLoading}
                className="btn-primary"
              >
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium animate-fade-in ${message.includes('Error') || message.includes('required')
          ? 'bg-red-50 text-red-700 border border-red-100'
          : 'bg-green-50 text-green-700 border border-green-100'
          }`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CheckInOut;
