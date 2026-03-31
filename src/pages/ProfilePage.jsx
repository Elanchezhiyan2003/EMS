import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import "./ProfilePage.css";

function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    position: "",
  });
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
    } else {
      setProfile(data);
      setEditData({
        name: data.name || "",
        position: data.position || "",
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!editData.name.trim()) {
      setMessage("Name cannot be empty");
      return;
    }

    setUpdating(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: editData.name,
          position: editData.position,
        })
        .eq("id", user.id);

      if (error) {
        setMessage("Error updating profile: " + error.message);
        console.error("Update error:", error);
      } else {
        setProfile((prev) => ({
          ...prev,
          name: editData.name,
          position: editData.position,
        }));
        setMessage("Profile updated successfully!");
        setIsEditing(false);

        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Unexpected error: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: profile.name || "",
      position: profile.position || "",
    });
    setIsEditing(false);
    setMessage("");
  };

  if (loading) return <div className="loading">Loading Profile...</div>;

  if (!profile) return <div className="error">No profile found</div>;

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>

      {message && (
        <div
          className={`message ${
            message.includes("success") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      <div className="profile-card">
        {/* Profile Image (default) */}
        <div className="profile-left">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Profile"
            className="profile-image"
          />
        </div>

        {/* Profile Details */}
        <div className="profile-right">
          {!isEditing ? (
            <>
              <div className="profile-field">
                <label>Name</label>
                <p>{profile.name}</p>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>

              <div className="profile-field">
                <label>Role</label>
                <p>{profile.role}</p>
              </div>

              <div className="profile-field">
                <label>Position</label>
                <p>{profile.position}</p>
              </div>

              <button
                className="edit-btn"
                onClick={() => setIsEditing(true)}
                disabled={updating}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <div className="profile-field">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="edit-input"
                  placeholder="Enter your name"
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p className="read-only">{profile.email}</p>
                <small className="read-only-text">
                  (Email cannot be changed here)
                </small>
              </div>

              <div className="profile-field">
                <label>Role</label>
                <p className="read-only">{profile.role}</p>
              </div>

              <div className="profile-field">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={editData.position}
                  onChange={handleEditChange}
                  className="edit-input"
                  placeholder="Enter your position"
                />
              </div>

              <div className="button-group">
                <button
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;