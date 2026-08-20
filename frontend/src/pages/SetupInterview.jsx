import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Briefcase, Target, Layers, FileText, ChevronRight, Video, ArrowLeft
} from "lucide-react";

export default function SetupInterview() {
  const navigate = useNavigate();
  
  // States for configuration
  const [interviewType, setInterviewType] = useState("Technical");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [availableResumes, setAvailableResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the SPECIFIC logged-in user's previously uploaded resumes
  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const userId = localStorage.getItem("smartHireUserId"); // Grab the secure ID
        
        // Pass the user_id in the API call so it only gets THEIR resumes
        const response = await axios.get(`http://127.0.0.1:8000/api/user/resumes?user_id=${userId || 1}`);
        
        if (response.data.resumes && response.data.resumes.length > 0) {
          setAvailableResumes(response.data.resumes);
          setSelectedResumeId(response.data.resumes[0].id); // Auto-select the first one
        }
      } catch (error) {
        console.error("Failed to fetch resumes:", error);
      }
    };
    fetchResumes();
  }, []);

  const handleStartInterview = async () => {
    setIsLoading(true);
    
    setTimeout(() => {
      // Pass the selected settings to the live room
      navigate("/live-interview", {
        state: {
          interviewType: interviewType,
          role: role,
          difficulty: difficulty,
          resumeId: selectedResumeId
        }
      });
    }, 1000);
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Session Setup</h2>
        <div style={{ width: "160px" }}></div>
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.setupCard}>
          <div style={styles.headerArea}>
            <div style={styles.iconBox}><Video size={24} color="#3b82f6" /></div>
            <h1 style={styles.title}>Configure Your Interview</h1>
            <p style={styles.subtitle}>Customize the AI's behavior and select the resume it will base its questions on.</p>
          </div>

          <form style={styles.form} onSubmit={(e) => { e.preventDefault(); handleStartInterview(); }}>
            
            {/* Interview Type Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Layers size={16} color="#64748b" /> Interview Type
              </label>
              <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} style={styles.select}>
                <option value="Technical">Technical</option>
                <option value="HR">HR / Cultural Fit</option>
                <option value="Behavioral">Behavioral</option>
                <option value="Aptitude">Aptitude & Logic</option>
              </select>
            </div>

            {/* Target Role Dropdown with "Other" text input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Briefcase size={16} color="#64748b" /> Target Role
              </label>
              
              <select 
                value={["Software Engineer", "Backend Engineering", "Frontend Developer", "Data Scientist", "Product Manager"].includes(role) ? role : "Other"} 
                onChange={(e) => {
                    if (e.target.value === "Other") {
                        setRole(""); 
                    } else {
                        setRole(e.target.value);
                    }
                }} 
                style={styles.select}
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Backend Engineering">Backend Engineering</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Other">Other (Type your own role)</option>
              </select>

              {!["Software Engineer", "Backend Engineering", "Frontend Developer", "Data Scientist", "Product Manager"].includes(role) && (
                <input
                  type="text"
                  placeholder="e.g., Cooling Centre Technician"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ ...styles.select, marginTop: '10px' }} 
                />
              )}
            </div>

            {/* Difficulty Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Target size={16} color="#64748b" /> Difficulty Level
              </label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={styles.select}>
                <option value="Entry Level">Entry Level</option>
                <option value="Medium">Medium (Mid-Level)</option>
                <option value="Hard">Hard (Senior)</option>
              </select>
            </div>

            {/* Resume Selection Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <FileText size={16} color="#64748b" /> Context Resume (AI Brain)
              </label>
              
              {availableResumes.length > 0 ? (
                <select 
                  value={selectedResumeId} 
                  onChange={(e) => setSelectedResumeId(e.target.value)} 
                  style={styles.select}
                >
                  {availableResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      📄 {resume.filename}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={styles.warningBox}>
                  No resumes found. The AI will ask general questions. 
                  {/* FIX: Corrected route from "/resume-upload" to "/resumes" */}
                  <button type="button" onClick={() => navigate("/resumes")} style={styles.linkButton}>
                    Upload a resume first.
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              style={styles.submitButton}
            >
              {isLoading ? "Preparing AI Room..." : "Create Session & Go Live"} 
              <ChevronRight size={18} />
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
  
  mainContent: { padding: "60px 20px", display: "flex", justifyContent: "center" },
  setupCard: { backgroundColor: "#ffffff", width: "100%", maxWidth: "600px", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  headerArea: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "40px" },
  iconBox: { width: "56px", height: "56px", backgroundColor: "#eff6ff", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  subtitle: { fontSize: "15px", color: "#64748b", margin: 0, lineHeight: "1.5" },
  
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#475569" },
  select: { width: "100%", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", color: "#0f172a", backgroundColor: "#f8fafc", cursor: "pointer", appearance: "auto" },
  
  warningBox: { padding: "12px 16px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "14px", color: "#92400e" },
  linkButton: { background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", padding: 0, marginLeft: "6px", fontSize: "14px" },
  
  submitButton: { display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", backgroundColor: "#007BFF", color: "white", padding: "16px", borderRadius: "8px", border: "none", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", marginTop: "16px" }
};