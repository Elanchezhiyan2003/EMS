import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import "./CheckInOut.css";

function CheckInOut({ userId, onCheckout }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [file, setFile] = useState(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTodayISO = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().split(" ")[0];

  const fetchTodayRecord = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("date", getTodayISO())
      .maybeSingle();

    if (error) {
      console.error(error);
    }

    setTodayRecord(data);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchTodayRecord();
  }, [userId]);

  // ✅ CHECK IN
  const handleCheckIn = async () => {
    if (todayRecord?.check_in) {
      setMessage("You have already checked in today");
      return;
    }

    setActionLoading(true);

    try {
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          user_id: userId,
          date: getTodayISO(),
          check_in: getCurrentTime(),
        })
        .select()
        .single();

      if (error) throw error;

      setTodayRecord(data);
      setMessage("✅ Check-in successful");

    } catch (err) {
      setMessage(err.message);
    }

    setActionLoading(false);
  };


  // ✅ CHECK OUT WITH FILE UPLOAD
  const confirmCheckOut = async () => {
    if (!taskTitle || !description || !timeSpent) {
      setMessage("Please fill all fields");
      return;
    }

    if (!todayRecord) {
      setMessage("No check-in record found for today");
      return;
    }

    setActionLoading(true);
    let fileUrl = todayRecord.file_url || null;

    try {
      // ✅ Upload file to Supabase Storage
      if (file) {
        const fileName = `${userId}/${Date.now()}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("documents")
          .getPublicUrl(fileName);

        fileUrl = data.publicUrl;
      }

      // ✅ Update attendance row with FULL form data
      const { data, error } = await supabase
        .from("attendance")
        .update({
          check_out: getCurrentTime(),
          task_title: taskTitle,
          description: description,
          time_spent: timeSpent,
          file_url: fileUrl,
        })
        .eq("id", todayRecord.id)
        .select()
        .single();

      if (error) throw error;

      // ✅ Update UI instantly
      setTodayRecord(data);
      setShowModal(false);
      setMessage("🎉 Check-out + Form submitted successfully!");

      // optional callback to redirect user or refresh
      if (onCheckout) {
        onCheckout();
      }

      // Reset form
      setTaskTitle("");
      setDescription("");
      setTimeSpent("");
      setFile(null);

    } catch (err) {
      setMessage(err.message);
    }

    setActionLoading(false);
  };


  if (loading) return <div>Loading...</div>;

  const hasCheckedIn = todayRecord?.check_in;
  const hasCheckedOut = todayRecord?.check_out;

  return (
    <div className="timer-card">
      <div className="date">
        {currentTime.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
      <div className="timer">
        {currentTime.toTimeString().split(" ")[0]}
      </div>

      <div className="button-group">
        <button
          onClick={handleCheckIn}
          disabled={hasCheckedIn || actionLoading}
          className="checkin"
        >
          Check In
        </button>

        <button
          onClick={() => setShowModal(true)}
          disabled={!hasCheckedIn || hasCheckedOut}
          className="checkout"
        >
          Check Out
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Check Out Form</h2>

            <div className="form-group">
              <label>Task Title</label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Upload Document</label>
              <input
                type="file"
                className="file-input"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <div className="form-group">
              <label>Time Spent</label>
              <input
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                onClick={confirmCheckOut}
                className="submit-btn"
                disabled={actionLoading}
              >
                Submit
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <div className="message">{message}</div>}
    </div>
  );
}

export default CheckInOut;
