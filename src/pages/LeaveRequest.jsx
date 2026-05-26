import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import "./AttendancePage.css"; // reuse some styles

function LeaveRequest({ user }) {
  const [type, setType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRequests, setShowRequests] = useState(true);

  const fetchRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("leaves")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!type || !fromDate || !toDate) {
      setError("Please fill all required fields");
      return;
    }
    const days =
      Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;

    setLoading(true);
    const { data, error } = await supabase.from("leaves").insert([
      {
        user_id: user.id,
        type,
        from_date: fromDate,
        to_date: toDate,
        days,
        reason,
        status: "pending",
      },
    ]);
    if (error) {
      setError(error.message);
    } else {
      // reset form
      setType("");
      setFromDate("");
      setToDate("");
      setReason("");
      fetchRequests();
      setShowRequests(true);
      alert("Leave request submitted successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="leave-container">
      <div className="leave-header">
        <h2>Leave Management</h2>
        {!showRequests ? (
          <button
            type="button"
            onClick={() => {
              fetchRequests();
              setShowRequests(true);
            }}
            className="back-to-history-btn"
          >
            ← Back to History
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowRequests(false)}
            className="primary-btn"
          >
            + Leave Request
          </button>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}

      {showRequests ? (
        /* HISTORY VIEW */
        <div className="request-list">
          <h3>Request History</h3>

          {loading && <p>Loading…</p>}
          {!loading && requests.length === 0 && <p>No requests yet</p>}
          {!loading && requests.length > 0 && (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.type}</strong></td>
                    <td>{r.from_date}</td>
                    <td>{r.to_date}</td>
                    <td>{r.days}</td>
                    <td>
                      <span className={`status-badge ${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* FORM VIEW */
        <form className="leave-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Leave Type *</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">-- select --</option>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          <div className="form-group">
            <label>From *</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>To *</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="form-group full-width">
            <label>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Sending..." : "Submit Request"}
          </button>
        </form>
      )}
    </div>
  );
}

export default LeaveRequest;
