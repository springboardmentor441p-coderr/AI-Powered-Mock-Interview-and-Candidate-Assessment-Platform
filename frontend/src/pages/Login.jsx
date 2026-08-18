import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";

export default function Login() {
  // State to toggle between Login and Sign Up screens
  const [isLogin, setIsLogin] = useState(true);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Checks for at least 1 letter, 1 number, 1 special character, and 8+ characters total
  const isValidPassword = (pass) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!loginId || !password) {
      alert("Please fill in all fields.");
      return;
    }

    // If they are signing up, verify the password is complex
    if (!isLogin && !isValidPassword(password)) {
      alert("Password must contain at least 8 characters, including a number, a letter, and a special character (like @, #, !).");
      return;
    }

    // If successful, take them to the Dashboard
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            {isLogin ? <LogIn size={32} color="#007BFF" /> : <UserPlus size={32} color="#007BFF" />}
          </div>
          <h1 style={styles.title}>{isLogin ? "Welcome back to stage" : "Create Account"}</h1>
          <p style={styles.subtitle}>
            {isLogin ? "Enter your details to access your dashboard." : "Join SmartHire AI to start practicing."}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <User size={20} color="#888" style={styles.inputIcon} />
            <input
              type="text"
              placeholder="Email or Mobile Number"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <Lock size={20} color="#888" style={styles.inputIcon} />
            <input
              type="password"
              placeholder={isLogin ? "Enter your Password" : "Create a complex password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          
          {/* Show a warning text only on the Sign Up screen */}
          {!isLogin && (
            <p style={styles.helperText}>
              *Must include letters, numbers, and special characters.
            </p>
          )}

          <button type="submit" style={styles.button}>
            {isLogin ? "Sign In" : "Sign Up"}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle between Login and Sign Up */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span 
              onClick={() => setIsLogin(!isLogin)} 
              style={styles.toggleLink}
            >
              {isLogin ? " Sign up" : " Log in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Modern, attractive CSS styles object
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f7f6", // Soft, modern background color
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)", // Professional soft drop shadow
    width: "100%",
    maxWidth: "400px",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "64px",
    height: "64px",
    backgroundColor: "#e6f2ff",
    borderRadius: "50%",
    margin: "0 auto 15px auto",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    color: "#111",
    fontWeight: "bold",
  },
  subtitle: {
    margin: "0",
    color: "#666",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
  },
  input: {
    width: "100%",
    padding: "14px 14px 14px 45px", // Extra padding on the left for the icon
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#fdfdfd",
    transition: "border-color 0.2s",
  },
  helperText: {
    margin: "-10px 0 0 0",
    fontSize: "12px",
    color: "#e74c3c", 
  },
  button: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007BFF", // Industry standard trust-blue
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  footer: {
    marginTop: "25px",
    textAlign: "center",
  },
  footerText: {
    color: "#666",
    fontSize: "14px",
    margin: "0",
  },
  toggleLink: {
    color: "#007BFF",
    fontWeight: "bold",
    cursor: "pointer",
    marginLeft: "5px",
  },
};