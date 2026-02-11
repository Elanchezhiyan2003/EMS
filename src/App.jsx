import { useState, useEffect } from "react";
import { supabase } from "./supabase/client";
import Login from "./components/Login";
import Register from "./components/Register";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Initial session:", session);
        await fetchProfile(session.user);
      }
    } catch (err) {
      console.error("Error checking user:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (authUser) => {
    console.log("Fetching profile for user:", authUser);
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) throw error;

      // SELF-HEALING: Create profile if it exists in Auth but not in Database
      if (!data) {
        console.log("Profile missing in DB, creating fallback...");
        const meta = authUser.user_metadata || {};
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authUser.id,
              name: meta.full_name || meta.name || authUser.email.split("@")[0],
              email: authUser.email,
              role: "employee",
              position: "Member",
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        data = newProfile;
      }

      console.log("Final profile data:", data);
      setUser(authUser);
      setProfile(data);
    } catch (err) {
      console.error("Error fetching/creating profile:", err);
    }
  };

  const handleLogin = (authUser, userProfile) => {
    setUser(authUser);
    setProfile(userProfile);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const toggleAuthMode = () => {
    setShowRegister(!showRegister);
  };

  const handleProfileUpdate = () => {
    if (user) {
      fetchProfile(user);
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <h2>Loading...</h2>
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  if (user && profile) {
    if (profile.role === "admin") {
      return <AdminDashboard profile={profile} onLogout={handleLogout} />;
    } else {
      return (
        <EmployeeDashboard
          user={user}
          profile={profile}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
        />
      );
    }
  }

  // Show auth screens if not logged in
  return (
    <div className="app">
      {showRegister ? (
        <Register onToggle={toggleAuthMode} />
      ) : (
        <Login onToggle={toggleAuthMode} onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
