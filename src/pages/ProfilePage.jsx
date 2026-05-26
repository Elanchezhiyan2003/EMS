import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import "./ProfilePage.css";

function ProfilePage({ user, onImageUpload }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    position: "",
  });
  
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      setMessage("Please select an image");
      return;
    }

    setUploadingImage(true);
    setMessage("");

    try {
      const fileExt = imageFile.name.split(".").pop();
      // Add timestamp to create unique filename and avoid caching issues
      const timestamp = Date.now();
      const fileName = `${user.id}-profile-${timestamp}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const imageUrl = data.publicUrl;

      console.log("Uploading image to:", filePath);
      console.log("Image URL:", imageUrl);

      // Update profile with image URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: imageUrl })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      console.log("Profile updated successfully");

      setProfile((prev) => ({
        ...prev,
        profile_picture_url: imageUrl,
      }));

      setMessage("Profile picture updated successfully!");
      setImageFile(null);
      setImagePreview(null);

      // Call callback to refresh dashboard profile icon
      if (onImageUpload) {
        onImageUpload();
      }

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Full error:", err);
      setMessage("Error uploading image: " + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading Profile...</div>;

  if (!profile) return <div className="profile-error">No profile found</div>;

  return (
    <div className="profile-wrapper">
      {message && (
        <div
          className={`profile-alert ${
            message.includes("success") ? "alert-success" : "alert-error"
          }`}
        >
          {message}
        </div>
      )}

      <div className="profile-header">
        <div className="profile-header-top">
          <h1>My Profile</h1>
          {!isEditing && (
            <button
              className="profile-edit-btn"
              onClick={() => setIsEditing(true)}
              disabled={updating}
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      <div className="profile-body">
        {/* Avatar & Basic Info */}
        <div className="profile-card-main">
          <div className="profile-avatar-box">
            <div className="avatar-icon">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile"
                  className="avatar-image"
                />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <div className="avatar-info">
              <h2>{profile.name}</h2>
              <p>{profile.position || "Employee"}</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="profile-info-grid">
              <div className="info-card">
                <label>Full Name</label>
                <p>{profile.name}</p>
              </div>

              <div className="info-card">
                <label>Email Address</label>
                <p>{profile.email}</p>
              </div>

              <div className="info-card">
                <label>Position</label>
                <p>{profile.position || "Not specified"}</p>
              </div>

              <div className="info-card">
                <label>Role</label>
                <p>{profile.role}</p>
              </div>
            </div>
          ) : (
            <form className="profile-form">
              {/* Profile Picture Upload */}
              <div className="form-group">
                <label>Profile Picture</label>
                <div className="image-upload-section">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                    </div>
                  ) : profile.profile_picture_url ? (
                    <div className="image-preview">
                      <img src={profile.profile_picture_url} alt="Current" />
                    </div>
                  ) : (
                    <div className="image-preview empty">
                      <p>No image selected</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-input"
                  />
                  {imageFile && (
                    <button
                      type="button"
                      className="btn-upload-image"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleEditChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  value={editData.position}
                  onChange={handleEditChange}
                  className="form-input"
                  placeholder="e.g., Senior Developer"
                />
              </div>

              <div className="form-group disabled">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="form-group disabled">
                <label>Role</label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSaveProfile}
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;