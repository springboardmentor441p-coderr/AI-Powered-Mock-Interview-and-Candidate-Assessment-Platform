import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Lock, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [identifier, setIdentifier] = useState(""); // Email or Mobile
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Strict Password Validation Rule: Letters, Numbers, and Special Characters
  const isPasswordComplex = (pwd) => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return hasLetter && hasNumber && hasSpecial && pwd.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Enforce complex password ONLY during Sign Up
    if (!isLoginView && !isPasswordComplex(password)) {
      setErrorMessage("Password must include at least one letter, one number, and one special character.");
      return;
    }

    setIsLoading(true);
    const endpoint = isLoginView ? "/api/login" : "/api/signup";

    try {
      const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, {
        email_or_mobile: identifier,
        password: password
      });

      if (response.data.error) {
        setErrorMessage(response.data.error); 
      } else {
        localStorage.setItem("smartHireUserId", response.data.user_id);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMessage("Could not connect to the server. Is Python running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>AI</div>
          <h2 style={styles.title}>SmartHire</h2>
          <p style={styles.subtitle}>
            {isLoginView ? "Welcome back. Please log in to continue." : "Create your account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {errorMessage && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email or Mobile Number</label>
            <div style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <input 
                type="text" 
                required 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email or 10-digit mobile" 
                style={styles.input} 
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                style={styles.input} 
              />
            </div>
            
            {/* Password rules hint for Sign Up mode */}
            {!isLoginView && (
              <div style={styles.passwordHint}>
                <CheckCircle2 size={12} color={/[a-zA-Z]/.test(password) ? "#10b981" : "#94a3b8"} /> Letter
                <CheckCircle2 size={12} color={/[0-9]/.test(password) ? "#10b981" : "#94a3b8"} style={{marginLeft: "8px"}}/> Number
                <CheckCircle2 size={12} color={/[!@#$%^&*]/.test(password) ? "#10b981" : "#94a3b8"} style={{marginLeft: "8px"}}/> Special Char
              </div>
            )}
          </div>

          <button type="submit" disabled={isLoading} style={styles.submitButton}>
            {isLoading ? "Processing..." : (isLoginView ? "Log In" : "Sign Up")} 
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            {isLoginView ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => { setIsLoginView(!isLoginView); setErrorMessage(""); setPassword(""); }} 
              style={styles.toggleButton}
            >
              {isLoginView ? "Sign up here" : "Log in here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  card: { width: "100%", maxWidth: "420px", backgroundColor: "white", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  header: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px", textAlign: "center" },
  logoIcon: { backgroundColor: "#2563eb", color: "white", padding: "10px 14px", borderRadius: "12px", fontWeight: "bold", fontSize: "20px", marginBottom: "16px" },
  title: { margin: "0 0 8px 0", fontSize: "24px", color: "#0f172a" },
  subtitle: { margin: 0, fontSize: "14px", color: "#64748b" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  errorBox: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fef2f2", color: "#ef4444", padding: "12px", borderRadius: "8px", fontSize: "13px", fontWeight: "500", border: "1px solid #fecaca", lineHeight: "1.4" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px" },
  input: { width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", boxSizing: "border-box" },
  passwordHint: { display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#64748b", marginTop: "4px" },
  submitButton: { display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backgroundColor: "#2563eb", color: "white", padding: "14px", borderRadius: "8px", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", marginTop: "8px", transition: "all 0.2s" },
  footer: { marginTop: "24px", textAlign: "center" },
  footerText: { fontSize: "13px", color: "#64748b" },
  toggleButton: { background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", marginLeft: "6px", fontSize: "13px" }
};