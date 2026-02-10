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
     
    // Listen for auth state changes
    // const { data: authListener } = supabase.auth.onAuthStateChange(
    //   async (event, session) => {
    //     console.log("Auth event:", event);
    //     console.log("Session:", session);
    //     if (session?.user) {
    //       console.log("User after auth change:", session.user);
          
    //       const { data: { user } } = await supabase.auth.getUser()
    //       console.log("Current user from getUser():", user);
    //       await fetchProfile(session.user);
    //       console.log("Profile after auth change:", profile);
    //     } else {
    //       setUser(null);
    //       setProfile(null);
    //     }
    //   }
    // );

    // return () => {
    //   authListener.subscription.unsubscribe();
    // };
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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;
      console.log("Fetched profile data:", data);
      setUser(authUser);
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
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
