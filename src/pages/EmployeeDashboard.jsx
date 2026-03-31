import { useState } from "react";
import CheckInOut from "../components/CheckInOut";
import AttendancePage from "./AttendancePage";
import LeaveRequest from "./LeaveRequest";
import "./EmployeeDashboard.css";
import ProfilePage from "./ProfilePage";
import SubmissionPage from "./SubmissionPage";

function EmployeeDashboard({ user, profile, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

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
          </>
        )}

        {activeMenu === "attendance" && (
          <AttendancePage user={user} />
        )}
        {activeMenu === "profile" && (
          <ProfilePage user={user} />
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
