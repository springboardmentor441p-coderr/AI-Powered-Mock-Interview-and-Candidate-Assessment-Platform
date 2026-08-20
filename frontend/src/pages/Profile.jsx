import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, User, Mail, Lock, Briefcase, GraduationCap, Save, Shield } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const userId = localStorage.getItem("smartHireUserId");

  const [profileData, setProfileData] = useState({
    fullName: "",
    emailOrMobile: "", 
    college: "",
    targetRole: "",
  });

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/user/profile?user_id=${userId}`);
        if (!response.data.error) {
          setProfileData({
            fullName: response.data.full_name || "",
            emailOrMobile: response.data.email_or_mobile || "",
            college: response.data.college || "",
            targetRole: response.data.target_role || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      }
    };
    fetchProfile();
  }, [navigate, userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.put("http://127.0.0.1:8000/api/user/profile", {
        user_id: parseInt(userId),
        full_name: profileData.fullName,
        college: profileData.college,
        target_role: profileData.targetRole
      });
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Account Profile</h2>
        <div style={{ width: "160px" }}></div>
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.card}>
          <div style={styles.headerArea}>
            <div style={styles.avatarCircle}>
              <User size={40} color="#3b82f6" />
            </div>
            <h1 style={styles.title}>Personal Information</h1>
            <p style={styles.subtitle}>Update your details to help SmartHire personalize your experience.</p>
          </div>

          <form style={styles.form} onSubmit={handleSave}>
            <div style={styles.grid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}><User size={16} color="#64748b"/> Full Name</label>
                <input type="text" value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} placeholder="e.g. John Doe" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}><Mail size={16} color="#64748b"/> Email / Mobile</label>
                <input type="text" value={profileData.emailOrMobile} disabled style={{...styles.input, backgroundColor: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed"}} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}><GraduationCap size={16} color="#64748b"/> College / University</label>
                <input type="text" value={profileData.college} onChange={(e) => setProfileData({...profileData, college: e.target.value})} placeholder="Enter your college" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}><Briefcase size={16} color="#64748b"/> Primary Target Role</label>
                <input type="text" value={profileData.targetRole} onChange={(e) => setProfileData({...profileData, targetRole: e.target.value})} placeholder="e.g. Software Engineer" style={styles.input} />
              </div>
            </div>

            <div style={styles.divider}></div>
            <button type="submit" disabled={isLoading} style={styles.submitButton}>
              {isLoading ? "Saving Changes..." : "Save Profile"} <Save size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" },
  backButton: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", color: "#475569", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  navTitle: { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 },
  mainContent: { padding: "48px 20px", display: "flex", justifyContent: "center" },
  card: { backgroundColor: "#ffffff", width: "100%", maxWidth: "700px", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  headerArea: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "40px" },
  avatarCircle: { width: "80px", height: "80px", backgroundColor: "#eff6ff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px", border: "4px solid #ffffff", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)" },
  title: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  subtitle: { fontSize: "15px", color: "#64748b", margin: 0 },
  form: { display: "flex", flexDirection: "column" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#475569" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", boxSizing: "border-box" },
  divider: { height: "1px", backgroundColor: "#e2e8f0", margin: "32px 0" },
  submitButton: { display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backgroundColor: "#007BFF", color: "white", padding: "16px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "600", cursor: "pointer" }
};