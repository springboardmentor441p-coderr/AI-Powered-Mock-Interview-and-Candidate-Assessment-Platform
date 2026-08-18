import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, BarChart, ListOrdered, PlayCircle, ArrowLeft, BrainCircuit } from "lucide-react";
import axios from "axios";

export default function SetupInterview() {
  const navigate = useNavigate();
  
  // State for our form selections
  const [interviewType, setInterviewType] = useState("Technical");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [topicCount, setTopicCount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSession = async () => {
    if (!role) {
      alert("Please enter a Domain/Role (e.g., Backend Engineering)");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send the choices to your Python FastAPI backend
      const response = await axios.post("http://127.0.0.1:8000/api/create-session/", {
        interview_type: interviewType,
        role_domain: role,
        difficulty: difficulty,
        topic_count: topicCount
      });

      console.log("Session created:", response.data);
      // Move to the live interview room (we will build this next)
      navigate("/live-interview", {
  state: {
    interviewType: interviewType,
    role: role,
    difficulty: difficulty
  }
});
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to connect to the backend. Is your FastAPI server running?");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <nav style={styles.navBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Configure Interview Session</h2>
        <div style={{ width: "140px" }}></div> {/* Spacer for centering */}
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.wizardCard}>
          
          {/* Section 1: Interview Type */}
          <div style={styles.section}>
            <label style={styles.label}>
              <BrainCircuit size={18} color="#007BFF" />
              Interview Type
            </label>
            <div style={styles.buttonGroup}>
              {["HR", "Technical", "Behavioral", "Aptitude"].map((type) => (
                <button
                  key={type}
                  onClick={() => setInterviewType(type)}
                  style={{
                    ...styles.selectionButton,
                    ...(interviewType === type ? styles.activeSelection : {})
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Domain/Role */}
          <div style={styles.section}>
            <label style={styles.label}>
              <Briefcase size={18} color="#007BFF" />
              Target Role or Domain
            </label>
            <input 
              type="text" 
              placeholder="e.g., Backend Engineering, UI/UX Design..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.textInput}
            />
          </div>

          {/* Section 3: Difficulty */}
          <div style={styles.section}>
            <label style={styles.label}>
              <BarChart size={18} color="#007BFF" />
              Difficulty Level
            </label>
            <div style={styles.buttonGroup}>
              {["Moderate", "Medium", "High"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  style={{
                    ...styles.selectionButton,
                    ...(difficulty === level ? styles.activeSelection : {})
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Number of Questions */}
          <div style={styles.section}>
            <label style={styles.label}>
              <ListOrdered size={18} color="#007BFF" />
              Number of Topics / Questions
            </label>
            <div style={styles.buttonGroup}>
              {[2, 3, 5, 10].map((count) => (
                <button
                  key={count}
                  onClick={() => setTopicCount(count)}
                  style={{
                    ...styles.selectionButton,
                    ...(topicCount === count ? styles.activeSelection : {})
                  }}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div style={styles.footer}>
            <button 
              onClick={handleCreateSession} 
              style={styles.submitButton}
              disabled={isSubmitting}
            >
              <PlayCircle size={20} />
              {isSubmitting ? "Generating AI Session..." : "Create Session & Go Live"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

// Modern UI Styles
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  navBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
  },
  navTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  mainContent: {
    padding: "40px 20px",
    display: "flex",
    justifyContent: "center",
  },
  wizardCard: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "650px",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    border: "1px solid #f1f5f9",
  },
  section: {
    marginBottom: "32px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "12px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  selectionButton: {
    flex: "1 1 auto",
    padding: "12px 16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  activeSelection: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
    color: "#1d4ed8",
    boxShadow: "0 0 0 1px #3b82f6",
  },
  textInput: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    transition: "border-color 0.2s",
  },
  footer: {
    marginTop: "40px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 28px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 123, 255, 0.2)",
    transition: "background-color 0.2s",
  }
};