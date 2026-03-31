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
  const [showRequests, setShowRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

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
    }
    setLoading(false);
  };

  return (
    <div className="leave-container">
      <div className="leave-line">
      <h2>Leave Request</h2>
      <button
        type="button"
        onClick={() => {
          fetchRequests();
          setShowRequests(true);
        }}
        className="status-btn"
      >
        Status
      </button>
      </div>
      {error && <p className="error-text">{error}</p>}

      {!showRequests ? (
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
          {/* <button
            type="button"
            onClick={() => {
              fetchRequests();
              setShowRequests(true);
            }}
            className="status-btn"
          >
            Status
          </button> */}
        </form>
      ) : (
        /* REQUESTS VIEW */
        <div className="request-list">
          <button
            className="back-btn"
            onClick={() => setShowRequests(false)}
          >
            ← New Request
          </button>

          <h3>Your Requests</h3>
          <div className="request-tabs">
            <button
              className={activeTab === 'pending' ? 'active' : ''}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={activeTab === 'approved' ? 'active' : ''}
              onClick={() => setActiveTab('approved')}
            >
              Approved
            </button>
          </div>

          {loading && <p>Loading…</p>}
          {!loading && requests.length === 0 && <p>No requests yet</p>}
          {!loading && requests.length > 0 && (
            <div>
              {activeTab === 'pending' && (
                <div className="request-column">
                  <h4>Pending</h4>
                  {requests.filter(r => r.status === 'pending').length === 0 ? (
                    <p>No pending requests</p>
                  ) : (
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests
                          .filter(r => r.status === 'pending')
                          .map((r) => (
                            <tr key={r.id}>
                              <td>{r.type}</td>
                              <td>{r.from_date}</td>
                              <td>{r.to_date}</td>
                              <td>{r.days}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'approved' && (
                <div className="request-column">
                  <h4>Approved</h4>
                  {requests.filter(r => r.status === 'approved').length === 0 ? (
                    <p>No approved requests</p>
                  ) : (
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests
                          .filter(r => r.status === 'approved')
                          .map((r) => (
                            <tr key={r.id}>
                              <td>{r.type}</td>
                              <td>{r.from_date}</td>
                              <td>{r.to_date}</td>
                              <td>{r.days}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeaveRequest;
