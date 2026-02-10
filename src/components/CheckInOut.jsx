import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

function CheckInOut({ userId , onCheck }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
const [workDone, setWorkDone] = useState('');


  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
const openCheckoutModal = () => {
  setWorkDone('');
  setShowModal(true);
};

  // Get current time in HH:MM:SS format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Fetch today's attendance record
  const fetchTodayRecord = async () => {
    try {
      const today = getTodayDate();
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw error;
      }

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

  // Handle check-in
  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage('');

    try {
      const today = getTodayDate();
      const currentTime = getCurrentTime();

      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: userId,
            date: today,
            check_in: currentTime
          }
        ])
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



  // Handle check-out
  const confirmCheckOut = async () => {
  if (!workDone.trim()) {
    setMessage('Work details required');
    return;
  }

  setActionLoading(true);
  setMessage('');

  try {
    const currentTime = getCurrentTime();
    console.log("checkout id :", todayRecord.id);

    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out: currentTime,
        work_done: workDone
      })
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
supabase
  .channel('attendance')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'attendance' },
    () => fetchTodayRecord()
  )
  .subscribe();


  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const hasCheckedIn = todayRecord && todayRecord.check_in;
  const hasCheckedOut = todayRecord && todayRecord.check_out;

  return (
    <div className="checkinout-container">
      <h3>Today's Attendance</h3>
      
      <div className="status-info">
        <p><strong>Date:</strong> {getTodayDate()}</p>
        {hasCheckedIn && (
          <p><strong>Check-in Time:</strong> {todayRecord.check_in}</p>
        )}
        {hasCheckedOut && (
          <p><strong>Check-out Time:</strong> {todayRecord.check_out}</p>
        )}
      </div>

      <div className="action-buttons">
        <button
          onClick={handleCheckIn}
          disabled={hasCheckedIn || actionLoading}
          className="btn-primary"
        >
          {actionLoading ? 'Processing...' : 'Check In'}
        </button>

        <button
          onClick={openCheckoutModal}
          disabled={!hasCheckedIn || hasCheckedOut || actionLoading}
          className="btn-secondary"
        >
          {actionLoading ? 'Processing...' : 'Check Out'}
        </button>
      </div>
{showModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h4>Today work details</h4>

      <textarea
        value={workDone}
        onChange={(e) => setWorkDone(e.target.value)}
        placeholder="Enter the details of the work done."
      />

      <div className="modal-actions">
        <button onClick={confirmCheckOut} disabled={actionLoading}>
          Confirm Check Out
        </button>
        <button onClick={() => setShowModal(false)}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {message && (
        <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CheckInOut;
