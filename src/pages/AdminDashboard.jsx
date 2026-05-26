import { useEffect, useState, useRef } from "react"
import { Bar } from "react-chartjs-2"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"

import { supabase } from "../supabase/client"
import "./admin.css"

import EmployeeList from "./employees/EmployeeList"
import Attendance from "./Attendance"
import LeaveManagement from "./LeaveManagement"
import AvatarSelector from "../components/AvatarSelector"

// Register ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)



export default function AdminDashboard({ onLogout }) {

  const [time, setTime] = useState(new Date())
  const [page, setPage] = useState("dashboard")
  const [profileData, setProfileData] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false)
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false)
  const avatarDropdownRef = useRef(null)


  // Dashboard counts
  const [present, setPresent] = useState(0)
  const [absent, setAbsent] = useState(0)
  const [late, setLate] = useState(0)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [recentCheckins, setRecentCheckins] = useState([])

  const handleLogout = () => {
  onLogout();
};
  // Live Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(event.target)) {
        setIsAvatarDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchDashboardData()

    const channel = supabase
      .channel('dashboard_attendance_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch (e) { console.warn(e) }
    }
  }, [])

  useEffect(() => {
    if (page === 'profile') {
      fetchProfile()
    }
  }, [page])

async function fetchDashboardData() {

  const { data: empData } = await supabase
    .from("profiles")
    .select("*")

  const total = empData ? empData.length : 0
  setTotalEmployees(total)

  const today = new Date().toISOString().split("T")[0]

  const { data: attData } = await supabase
    .from("attendance")
    .select("*")
    .gte("check_in", today + "T00:00:00")
    .lte("check_in", today + "T23:59:59")

  let p = 0
  let l = 0

  if (attData) {
    attData.forEach(row => {
      const hour = new Date(row.check_in).getHours()
      if (hour >= 10) l++
      else p++
    })
  }

  const profileById = new Map((empData || []).map((p) => [p.id, p]))
  const recent = (attData || [])
    .filter((r) => r.check_in)
    .sort((a, b) => new Date(b.check_in) - new Date(a.check_in))
    .slice(0, 6)
    .map((r) => {
      const profile = profileById.get(r.user_id) || {}
      return {
        id: r.id,
        name: profile.name || 'Unknown',
        position: profile.position || 'Employee',
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Unknown')}&background=random`,
        check_in: r.check_in
      }
    })

  setRecentCheckins(recent)
  setPresent(p)
  setLate(l)
  setAbsent(total - (p + l))
}

// Fetch current admin's profile
async function fetchProfile() {
  setLoadingProfile(true)
  try {
    let userId = null
    if (supabase.auth && typeof supabase.auth.getUser === 'function') {
      const u = await supabase.auth.getUser()
      userId = u?.data?.user?.id
    } else if (supabase.auth && typeof supabase.auth.user === 'function') {
      const uu = supabase.auth.user()
      userId = uu?.id
    }
    if (!userId) {
      setLoadingProfile(false)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    setProfileData(data)
    setEditFormData(data)
  } catch (e) {
    console.error('Failed to load profile', e)
  }
  setLoadingProfile(false)
}

// Update profile
async function saveProfileChanges() {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(editFormData)
      .eq('id', profileData.id)
    if (error) throw error
    setProfileData(editFormData)
    setIsEditingProfile(false)
    alert('Profile updated successfully')
  } catch (e) {
    console.error('Failed to update profile', e)
    alert('Failed to update profile')
  }
}

// Handle avatar selection
async function handleAvatarSelect(avatarUrl) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ profile_photo: avatarUrl })
      .eq('id', profileData.id)

    if (error) throw error

    setProfileData({ ...profileData, profile_photo: avatarUrl })
    setIsAvatarDropdownOpen(false)
    alert('Profile photo updated successfully!')
  } catch (e) {
    console.error('Failed to update profile photo', e)
    alert(`Failed to update profile photo: ${e.message || JSON.stringify(e)}`)
  }
}

// Handle avatar removal
async function handleRemoveProfilePic() {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ profile_photo: null })
      .eq('id', profileData.id)

    if (error) throw error

    setProfileData({ ...profileData, profile_photo: null })
    setIsAvatarDropdownOpen(false)
    alert('Profile photo removed successfully!')
  } catch (e) {
    console.error('Failed to remove profile photo', e)
    alert(`Failed to remove profile photo: ${e.message || JSON.stringify(e)}`)
  }
}


  // Fetch Dashboard Data
  
  // Chart Data
  const chartData = {
    labels: ["Present", "Absent", "Late"],
    datasets: [
      {
        label: "Employees",
        data: [present, absent, late],
        backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"]
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" }
    }
  }

  return (
  <div className="admin-container">

    {/* Sidebar */}
    <div className="sidebar">
      <h2>Admin Panel</h2>
      <ul>
        <li onClick={() => setPage("dashboard")}>Dashboard</li>
        <li onClick={() => setPage("employees")}>Employees</li>
        <li onClick={() => setPage("attendance")}>Attendance</li>
        <li onClick={() => setPage("leave")}>Leave Management</li>
        <li onClick={() => setPage("profile")}>Profile</li>
        <li onClick={onLogout}>Logout</li>

        
      </ul>
    </div>

    {/* MAIN CONTENT */}
    <div className="main">

      {/* DASHBOARD PAGE */}
      {page === "dashboard" && (
        <>
          <h1>Admin Dashboard</h1>

          <div className="cards">
            <div className="card blue">Total Employees <b>{totalEmployees}</b></div>
            <div className="card green">Present Today <b>{present}</b></div>
            <div className="card red">Absent Today <b>{absent}</b></div>
            <div className="card orange">Late Employees <b>{late}</b></div>
          </div>

          <div className="middle-section">
            <div className="chart-box">
              <h3>Attendance Report</h3>
              <Bar data={chartData} options={chartOptions} />
            </div>

            <div className="clock-box">
              <h3>Welcome Admin 👋</h3>
              <h2>{time.toLocaleTimeString()}</h2>
              <p>{time.toDateString()}</p>

              <div className="recent-checkins">
                <h4>Recent Check-ins</h4>
                {recentCheckins.length === 0 ? (
                  <p>No check-ins yet today</p>
                ) : (
                  <ul>
                    {recentCheckins.map((entry) => (
                      <li key={entry.id}>
                        <img src={entry.avatarUrl} alt={entry.name} />
                        <div>
                          <strong>{entry.name}</strong>
                          <span>{entry.position}</span>
                          <small>{new Date(entry.check_in).toLocaleTimeString()}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* EMPLOYEES PAGE */}
      {page === "employees" && <EmployeeList />}

      {/* ATTENDANCE PAGE */}
      {page === "attendance" && <Attendance />}

      {/* LEAVE MANAGEMENT */}
      {page === "leave" && <LeaveManagement />}

      {/* PROFILE PAGE */}
      {page === "profile" && (
        <div className="linkedin-profile">
          {loadingProfile ? (
            <p>Loading...</p>
          ) : profileData ? (
            <div className="profile-wrapper">
              {/* Profile Card */}
              <div className="profile-main-card">
                {/* Avatar */}
                <div className="profile-avatar-section">
                  <div className="profile-avatar-wrapper">
                    {profileData.profile_photo ? (
                      <img 
                        src={profileData.profile_photo} 
                        alt="Profile" 
                        className="profile-avatar-image"
                      />
                    ) : (
                      <div className="profile-avatar">{profileData.name?.charAt(0).toUpperCase()}</div>
                    )}
                    <div className="avatar-dropdown-container" ref={avatarDropdownRef}>
                      <button 
                        className="avatar-edit-icon" 
                        onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)} 
                        title="Profile photo options"
                      >
                        ⋮
                      </button>
                      {isAvatarDropdownOpen && (
                        <div className="avatar-dropdown-menu">
                          <button 
                            className="dropdown-option add-option"
                            onClick={() => {
                              setIsAvatarSelectorOpen(true)
                              setIsAvatarDropdownOpen(false)
                            }}
                          >
                            📤 Add Profile Photo
                          </button>
                          {profileData.profile_photo && (
                            <button 
                              className="dropdown-option remove-option"
                              onClick={handleRemoveProfilePic}
                            >
                              🗑️ Remove Profile Photo
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="profile-info">
                  <h1>{profileData.name}</h1>
                  <p className="profile-role">{profileData.role}</p>
                  <p className="profile-position">{profileData.position || 'Administrator'}</p>
                  {!isEditingProfile && (
                    <button className="btn-edit-profile" onClick={() => setIsEditingProfile(true)}>✏️ Edit Profile</button>
                  )}
                </div>
              </div>

              {/* Details Section */}
              {!isEditingProfile ? (
                <div className="profile-details-card">
                  <h2>About</h2>
                  <div className="details-grid">
                    <div className="detail-box">
                      
                      <div>
                        <p className="detail-label">Email</p>
                        <p className="detail-value">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="detail-box">
                      
                      <div>
                        <p className="detail-label">Employee ID</p>
                        <p className="detail-value">{profileData.employee_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="detail-box">
                      
                      <div>
                        <p className="detail-label">Position</p>
                        <p className="detail-value">{profileData.position || 'Administrator'}</p>
                      </div>
                    </div>
                    <div className="detail-box">
                      
                      <div>
                        <p className="detail-label">Role</p>
                        <p className="detail-value">{profileData.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="profile-edit-card">
                  <h2>Edit Profile</h2>
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" value={editFormData.name || ''} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input type="text" value={editFormData.position || ''} onChange={(e) => setEditFormData({...editFormData, position: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Employee ID</label>
                      <input type="text" value={editFormData.employee_id || ''} onChange={(e) => setEditFormData({...editFormData, employee_id: e.target.value})} />
                    </div>
                    <div className="form-buttons">
                      <button className="btn-save" onClick={saveProfileChanges}>Save Changes</button>
                      <button className="btn-cancel" onClick={() => { setIsEditingProfile(false); setEditFormData(profileData); }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No profile data found.</p>
          )}
        </div>
      )}

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={isAvatarSelectorOpen}
        onClose={() => setIsAvatarSelectorOpen(false)}
        onSelectAvatar={handleAvatarSelect}
        currentAvatar={profileData?.profile_photo}
      />

    </div>
  </div>
)
}