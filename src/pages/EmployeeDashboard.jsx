import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import CheckInOut from "../components/CheckInOut";
import AttendancePage from "./AttendancePage";
import LeaveRequest from "./LeaveRequest";
import "./EmployeeDashboard.css";
import ProfilePage from "./ProfilePage";
import SubmissionPage from "./SubmissionPage";
import { supabase } from "../supabase/client";

function EmployeeDashboard({ user, profile, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [profilePictureUrl, setProfilePictureUrl] = useState(profile?.profile_picture_url || null);

  // ---------- DATE FORMAT (NO TIMEZONE SHIFT)
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ---------- FETCH ATTENDANCE RECORDS
  const fetchAttendanceRecords = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setAttendanceRecords(data);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
  }, [user]);

  useEffect(() => {
    setProfilePictureUrl(profile?.profile_picture_url || null);
  }, [profile]);

  // ---------- REFRESH PROFILE PICTURE
  const refreshProfilePicture = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("profile_picture_url")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfilePictureUrl(data.profile_picture_url || null);
    }
  };

  // Refresh profile picture when returning to dashboard from profile page
  useEffect(() => {
    if (activeMenu === "dashboard") {
      refreshProfilePicture();
    }
  }, [activeMenu]);

  // ---------- CALENDAR ATTENDANCE COLORS
  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const formatted = formatLocalDate(date);
      const record = attendanceRecords.find((r) => r.date === formatted);
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
    <div className="dashboard-container">

      {/* MENU BUTTON */}
      <button
        className="menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2 className="logo">Employee Panel</h2>

        <ul className="menu">
          <li
            className={activeMenu === "dashboard" ? "active" : ""}
            onClick={() => setActiveMenu("dashboard")}
          >
            Dashboard
          </li>

          <li
            className={activeMenu === "attendance" ? "active" : ""}
            onClick={() => setActiveMenu("attendance")}
          >
            Attendance
          </li>

          <li
            className={activeMenu === "profile" ? "active" : ""}
            onClick={() => setActiveMenu("profile")}
          >
            Profile
          </li>
          <li
            className={activeMenu === "leave" ? "active" : ""}
            onClick={() => setActiveMenu("leave")}
          >
            Leave Management
          </li>
          <li
            className={activeMenu === "submissions" ? "active" : ""}
            onClick={() => setActiveMenu("submissions")}
          >
            Submissions
          </li>
          {/* other menu items can go here */}
        </ul>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {activeMenu === "dashboard" && (
          <>
            {/* PROFILE ICON - Dashboard Only */}
            <div className="profile-header">
              <div className="profile-group">
              <button
                className="profile-icon-btn"
                onClick={() => setActiveMenu("profile")}
                title={`Profile - ${profile?.name}`}
              >
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="profile-icon-img"
                  />
                ) : (
                  <svg
                    className="profile-icon-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </button>
              <span className="profile-name">{profile?.name}</span>
            </div>
            </div>

            <div className="welcome-section">
              <h1>Welcome, {profile?.name} 👋</h1>
              <p>Have a productive day!</p>
            </div>

            <div className="center-card">
              <CheckInOut
                userId={user.id}
                onCheckout={() => setActiveMenu("submissions")}
              />
            </div>

            <div className="dashboard-calendar-end">
              <h3>Monthly Calendar</h3>
              <Calendar
                value={calendarDate}
                onChange={setCalendarDate}
                className="small-calendar"
                tileClassName={tileClassName}
              />
            </div>
          </>
        )}

        {activeMenu === "attendance" && (
          <AttendancePage user={user} />
        )}
        {activeMenu === "profile" && (
          <ProfilePage user={user} onImageUpload={refreshProfilePicture} />
        )}
        {activeMenu === "leave" && (
          <LeaveRequest user={user} />
        )}
        {activeMenu === "submissions" && (
          <SubmissionPage user={user} />
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
