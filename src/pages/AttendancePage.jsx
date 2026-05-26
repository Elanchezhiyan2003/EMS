import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./AttendancePage.css";

// chart.js pie chart
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function AttendancePage({ user }) {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showTable, setShowTable] = useState(false);

  // ---------- DATE FORMAT (NO TIMEZONE SHIFT)
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ---------- CURRENT MONTH RANGE
  const getCurrentMonthRange = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      from: formatLocalDate(first),
      to: formatLocalDate(last),
    };
  };

  // ---------- WORKING DAYS (MON-FRI ONLY)
  const getWorkingDays = (from, to) => {
    if (!from || !to) return 0;

    const start = new Date(from);
    const end = new Date(to);
    let count = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
    }

    return count;
  };

  // ---------- FETCH ATTENDANCE
  const fetchAttendance = async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setRecords(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  // ---------- DEFAULT MONTH STATS
  const currentMonth = getCurrentMonthRange();

  const defaultWorkingDays = getWorkingDays(
    currentMonth.from,
    currentMonth.to
  );

  const defaultPresentDays = records.filter(
    (r) =>
      r.date >= currentMonth.from &&
      r.date <= currentMonth.to &&
      r.check_in
  ).length;

  const defaultAbsentDays = defaultWorkingDays - defaultPresentDays;

  const defaultPercentage =
    defaultWorkingDays > 0
      ? ((defaultPresentDays / defaultWorkingDays) * 100).toFixed(1)
      : 0;

  // ---------- FILTER APPLY
  const handleFilter = () => {
    if (!dateRange.from || !dateRange.to) return;

    const filtered = records.filter(
      (rec) =>
        rec.date >= dateRange.from &&
        rec.date <= dateRange.to
    );

    setFilteredRecords(filtered);
    setShowTable(true);
  };

  const resetFilter = () => {
    setDateRange({ from: "", to: "" });
    setFilteredRecords([]);
    setShowTable(false);
  };

  // ---------- FILTER STATS
  const filteredWorkingDays = getWorkingDays(
    dateRange.from,
    dateRange.to
  );

  const filteredPresentDays = filteredRecords.filter(
    (r) => r.check_in
  ).length;

  const filteredAbsentDays = filteredWorkingDays - filteredPresentDays;

  const filteredPercentage =
    filteredWorkingDays > 0
      ? ((filteredPresentDays / filteredWorkingDays) * 100).toFixed(1)
      : 0;

  // ---------- DISPLAY VALUES
  const workingDays = showTable
    ? filteredWorkingDays
    : defaultWorkingDays;

  const presentDays = showTable
    ? filteredPresentDays
    : defaultPresentDays;

  const absentDays = showTable
    ? filteredAbsentDays
    : defaultAbsentDays;

  const percentage = showTable
    ? filteredPercentage
    : defaultPercentage;

  // ---------- PIE CHART DATA
  const chartPresent = presentDays;
  const chartAbsent = absentDays;
  const chartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [chartPresent, chartAbsent],
        backgroundColor: ["#22c55e", "#ef4444"],
      },
    ],
  };

  // ---------- CALENDAR GREEN PRESENT DAYS
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const formatted = formatLocalDate(date);
      const record = records.find((r) => r.date === formatted);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const today = new Date();
      const isToday = formatLocalDate(date) === formatLocalDate(today);

      // Only mark working days (Monday-Friday) as present/absent
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (record && record.check_in) {
          return isToday ? ["present-day", "today"] : "present-day";
        } else if (!record) {
          // No record means absent for working days
          return isToday ? ["absent-day", "today"] : "absent-day";
        }
      }
    }
    return null;
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>Attendance Dashboard</h2>
      </div>

      {/* SUMMARY CARDS */}
      <div className="summary-row">
        <div className="summary-card">
          <span>Working Days</span>
          <h3>{workingDays}</h3>
        </div>

        <div className="summary-card present">
          <span>Days Present</span>
          <h3>{presentDays}</h3>
        </div>

        <div className="summary-card absent">
          <span>Days Absent</span>
          <h3>{absentDays}</h3>
        </div>

        <div className="summary-card percentage">
          <span>Attendance %</span>
          <h3>{percentage}%</h3>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="chart-row">
        <div className="chart-card">
          <Pie data={chartData} options={{ maintainAspectRatio: false }} />
        </div>
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

      {/* CALENDAR */}
      <div className="calendar-row">
        <div className="calendar-card small-calendar">
          <Calendar tileClassName={tileClassName} />
        </div>
      </div>

      {/* TABLE ONLY AFTER FILTER */}
      {showTable && (
        <div className="table-row">
          <div className="table-card">
            {loading ? (
              <p className="center-text">Loading...</p>
            ) : filteredRecords.length === 0 ? (
              <p className="center-text">
                No attendance in selected range
              </p>
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
                  {filteredRecords.map((rec) => (
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
      )}
    </div>
  );
}

export default AttendancePage;