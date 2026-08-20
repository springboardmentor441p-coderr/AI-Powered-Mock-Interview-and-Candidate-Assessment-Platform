import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Home, Clock, Calendar, Briefcase, Award, BarChart2 
} from "lucide-react";

export default function SessionHistory() {
  const navigate = useNavigate();

  // State to hold real data from the database
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real history for the specific logged-in user
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userId = localStorage.getItem("smartHireUserId");
        
        // Security check: if no user is logged in, send them to the login screen
        if (!userId) {
          navigate("/");
          return;
        }

        // Pass the user_id in the URL to fetch only THEIR sessions
        const response = await axios.get(`http://127.0.0.1:8000/api/user/history?user_id=${userId}`);
        
        if (response.data.history) {
          setHistoryData(response.data.history);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, [navigate]);

  return (
    <div style={styles.container}>
      <nav style={styles.navBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
          <Home size={18} />
          Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Interview History</h2>
        <div style={{ width: "160px" }}></div> 
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.headerArea}>
          <div>
            <h1 style={styles.pageTitle}>Your Progress</h1>
            <p style={styles.pageSubtitle}>Review your past mock interviews and track your AI performance scores over time.</p>
          </div>
          <button onClick={() => navigate("/setup-interview")} style={styles.primaryButton}>
            Start New Interview
          </button>
        </div>

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div style={{...styles.col, flex: 2}}>Role / Domain</div>
            <div style={{...styles.col, flex: 1}}>Date</div>
            <div style={{...styles.col, flex: 1}}>Duration</div>
            <div style={{...styles.col, flex: 1}}>AI Score</div>
            <div style={{...styles.col, flex: 1}}>Action</div>
          </div>

          <div style={styles.tableBody}>
            {isLoading ? (
              <p style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>Loading your history...</p>
            ) : historyData.length > 0 ? (
              historyData.map((session) => (
                <div key={session.id} style={styles.tableRow}>
                  
                  <div style={{...styles.colItem, flex: 2, fontWeight: "600", color: "#0f172a"}}>
                    <Briefcase size={16} color="#64748b" />
                    {session.role}
                  </div>
                  
                  <div style={{...styles.colItem, flex: 1}}>
                    <Calendar size={16} color="#64748b" />
                    {session.date}
                  </div>
                  
                  <div style={{...styles.colItem, flex: 1}}>
                    <Clock size={16} color="#64748b" />
                    {session.duration}
                  </div>
                  
                  <div style={{...styles.colItem, flex: 1}}>
                    {session.status === "Completed" ? (
                      <div style={styles.scoreBadge}>
                        <Award size={14} color={session.score >= 80 ? "#10b981" : "#f59e0b"} />
                        <span style={{ color: session.score >= 80 ? "#065f46" : "#92400e", fontWeight: "700" }}>
                          {session.score}/100
                        </span>
                      </div>
                    ) : (
                      <span style={styles.abortedBadge}>Incomplete</span>
                    )}
                  </div>
                  
                  <div style={{...styles.colItem, flex: 1}}>
                    <button 
                      disabled={session.status !== "Completed"}
                      onClick={() => {
                        navigate("/summary", {
                          state: {
                            role: session.role,
                            score: session.score,
                            conversation: session.conversation, 
                            feedbacks: ["Historical feedback unavailable"], 
                            eyeContact: 85, 
                            confidence: 80,
                            posture: "Good"
                          }
                        });
                      }}
                      style={{
                        ...styles.actionButton,
                        opacity: session.status === "Completed" ? 1 : 0.5,
                        cursor: session.status === "Completed" ? "pointer" : "not-allowed"
                      }}
                    >
                      <BarChart2 size={14} /> Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
               <p style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No interviews completed yet. Start one today!</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif", color: "#0f172a" },
  navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" },
  backButton: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", color: "#475569", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  navTitle: { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 },
  mainContent: { padding: "48px 48px", maxWidth: "1100px", margin: "0 auto" },
  headerArea: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" },
  pageTitle: { margin: "0 0 8px 0", fontSize: "28px", fontWeight: "700" },
  pageSubtitle: { margin: 0, fontSize: "15px", color: "#64748b" },
  primaryButton: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "#007BFF", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  
  tableCard: { backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", overflow: "hidden" },
  tableHeader: { display: "flex", padding: "16px 24px", backgroundColor: "#f1f5f9", borderBottom: "1px solid #e2e8f0", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
  col: { paddingRight: "16px" },
  tableBody: { display: "flex", flexDirection: "column" },
  tableRow: { display: "flex", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9", transition: "background-color 0.2s" },
  colItem: { display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#475569", paddingRight: "16px" },
  
  scoreBadge: { display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px" },
  abortedBadge: { padding: "6px 12px", backgroundColor: "#f1f5f9", color: "#64748b", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  actionButton: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#0f172a", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }
};