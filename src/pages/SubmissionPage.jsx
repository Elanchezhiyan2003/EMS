import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import "./AttendancePage.css"; // reuse shared styles

function SubmissionPage({ user }) {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showTable, setShowTable] = useState(false);

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchSubmissions = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .not("check_out", "is", null)
      .order("date", { ascending: false });

    if (!error && data) {
      setRecords(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  const handleFilter = () => {
    if (!dateRange.from || !dateRange.to) return;

    const filtered = records.filter(
      (rec) => rec.date >= dateRange.from && rec.date <= dateRange.to
    );

    setFilteredRecords(filtered);
    setShowTable(true);
  };

  const resetFilter = () => {
    setDateRange({ from: "", to: "" });
    setFilteredRecords([]);
    setShowTable(false);
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>Submissions</h2>
      </div>

      {/* FILTER */}
      <div className="filter-row">
        <div className="filter-card">
          <label>From</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange({ ...dateRange, from: e.target.value })
            }
          />

          <label>To</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange({ ...dateRange, to: e.target.value })
            }
          />

          <button className="apply-btn" onClick={handleFilter}>
            Apply Filter
          </button>

          <button className="reset-btn" onClick={resetFilter}>
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-row">
        <div className="table-card">
          {loading ? (
            <p className="center-text">Loading...</p>
          ) : showTable && filteredRecords.length === 0 ? (
            <p className="center-text">No submissions in selected range</p>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Task</th>
                  <th>Description</th>
                  <th>Time</th>
                  <th>Document</th>
                </tr>
              </thead>
              <tbody>
                {(showTable ? filteredRecords : records).map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.date}</td>
                    <td>{rec.check_in || "-"}</td>
                    <td>{rec.check_out || "-"}</td>
                    <td>{rec.task_title || "-"}</td>
                    <td>{rec.description || "-"}</td>
                    <td>{rec.time_spent || "-"}</td>
                    <td>
                      {rec.file_url ? (
                        <a
                          href={rec.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionPage;
