import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Award, Eye, Activity, UserCheck, Home, FileText, CheckCircle, X, History 
} from "lucide-react";

export default function SessionSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};

  const [showTranscript, setShowTranscript] = useState(false);

  // FIX 1: Make the role dynamic so it matches the interview you just took
  const summaryData = {
    role: stateData.role || "Software Engineer", 
    score: stateData.score || 0,
    feedbacks: stateData.feedbacks || [],
    metrics: {
      eyeContact: stateData.eyeContact || 0,
      confidence: stateData.confidence || 0,
      posture: stateData.posture || "Unknown"
    },
    conversation: stateData.conversation || []
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Interview Complete</h1>
          <p style={styles.pageSubtitle}>Here is your SmartHire AI performance analysis for the {summaryData.role} role.</p>
        </div>
        
        {/* FIX 2: Added a direct link to the Session History page */}
        <div style={styles.headerButtons}>
          <button onClick={() => navigate("/history")} style={styles.historyButton}>
            <History size={18} />
            View History
          </button>
          <button onClick={() => navigate("/dashboard")} style={styles.homeButton}>
            <Home size={18} />
            Dashboard
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.grid}>
          
          <div style={styles.leftColumn}>
            <div style={styles.scoreCard}>
              <h2 style={styles.cardTitle}>Overall Score</h2>
              <div style={styles.scoreCircle}>
                <Award size={48} color={summaryData.score >= 80 ? "#10b981" : "#f59e0b"} />
                <span style={styles.scoreNumber}>{summaryData.score}</span>
                <span style={styles.scoreTotal}>/ 100</span>
              </div>
              <p style={styles.scoreText}>
                {summaryData.score >= 80 
                  ? "Great job! You are highly competitive for this role." 
                  : summaryData.score > 0 
                    ? "Good effort. Review the AI feedback to improve your technical answers."
                    : "No questions were answered to generate a score."}
              </p>
            </div>

            <div style={styles.metricsCard}>
              <h3 style={styles.cardTitle}>Behavioral Recap</h3>
              <div style={styles.metricRow}>
                <div style={styles.metricLabel}><Eye size={16} color="#64748b"/> Eye Contact</div>
                <div style={styles.metricValue}>{summaryData.metrics.eyeContact}%</div>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{...styles.progressBarFill, width: `${summaryData.metrics.eyeContact}%`, backgroundColor: "#3b82f6"}}></div>
              </div>

              <div style={styles.metricRow}>
                <div style={styles.metricLabel}><Activity size={16} color="#64748b"/> Confidence</div>
                <div style={styles.metricValue}>{summaryData.metrics.confidence}%</div>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{...styles.progressBarFill, width: `${summaryData.metrics.confidence}%`, backgroundColor: "#10b981"}}></div>
              </div>

              <div style={styles.metricRow}>
                <div style={styles.metricLabel}><UserCheck size={16} color="#64748b"/> Posture</div>
                <div style={styles.metricValue}>{summaryData.metrics.posture}</div>
              </div>
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div style={styles.feedbackCard}>
              <h2 style={styles.cardTitle}>Question-by-Question Feedback</h2>
              
              {summaryData.feedbacks.length > 0 ? (
                <div style={styles.feedbackSection}>
                  <ul style={styles.list}>
                    {summaryData.feedbacks.map((item, i) => (
                      <li key={i} style={styles.listItem}>
                        <CheckCircle size={16} color="#3b82f6" style={{flexShrink: 0, marginTop: "2px"}} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p style={{ color: "#64748b", fontStyle: "italic" }}>
                  No feedback collected during this session. Answer questions to generate AI feedback!
                </p>
              )}

              <div style={styles.actionBox}>
                <p style={styles.actionText}>Want to dive deeper into your answers?</p>
                <button onClick={() => setShowTranscript(true)} style={styles.primaryButton}>
                  <FileText size={18} /> Review Full Transcript
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Transcript Popup Modal */}
      {showTranscript && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Interview Transcript</h2>
              <button onClick={() => setShowTranscript(false)} style={styles.closeBtn}><X size={24} /></button>
            </div>
            
            <div style={styles.transcriptScrollArea}>
              {summaryData.conversation.map((msg, index) => (
                <div key={index} style={{
                  display: "flex", 
                  justifyContent: msg.role === "ai" ? "flex-start" : "flex-end",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    backgroundColor: msg.role === "ai" ? "#f1f5f9" : "#007BFF",
                    color: msg.role === "ai" ? "#0f172a" : "white",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    maxWidth: "80%",
                    lineHeight: "1.5"
                  }}>
                    <strong>{msg.role === "ai" ? "Interviewer: " : "You: "}</strong>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif", color: "#0f172a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "32px 48px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" },
  pageTitle: { margin: "0 0 8px 0", fontSize: "28px", fontWeight: "700" },
  pageSubtitle: { margin: 0, fontSize: "16px", color: "#64748b" },
  headerButtons: { display: "flex", gap: "12px" },
  homeButton: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#475569", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  historyButton: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", color: "#2563eb", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  mainContent: { padding: "40px 48px", maxWidth: "1200px", margin: "0 auto" },
  grid: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" },
  leftColumn: { display: "flex", flexDirection: "column", gap: "24px" },
  rightColumn: { display: "flex", flexDirection: "column" },
  scoreCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  cardTitle: { margin: "0 0 24px 0", fontSize: "18px", fontWeight: "600", alignSelf: "flex-start" },
  scoreCircle: { width: "160px", height: "160px", borderRadius: "50%", border: "8px solid #f8fafc", outline: "4px solid #10b981", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginBottom: "24px" },
  scoreNumber: { fontSize: "48px", fontWeight: "800", color: "#0f172a", lineHeight: "1" },
  scoreTotal: { fontSize: "16px", color: "#64748b", fontWeight: "600" },
  scoreText: { margin: 0, fontSize: "15px", color: "#475569", lineHeight: "1.5" },
  metricsCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
  metricRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", marginTop: "16px" },
  metricLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#475569" },
  metricValue: { fontSize: "15px", fontWeight: "700" },
  progressBarBg: { height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: "4px" },
  feedbackCard: { backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", height: "100%", display: "flex", flexDirection: "column" },
  feedbackSection: { marginBottom: "24px", flex: 1 },
  list: { margin: 0, paddingLeft: 0, listStyle: "none", color: "#475569" },
  listItem: { display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px", fontSize: "15px", lineHeight: "1.6", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  actionBox: { padding: "24px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" },
  actionText: { margin: 0, fontSize: "15px", fontWeight: "500", color: "#475569" },
  primaryButton: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "#007BFF", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "#ffffff", width: "90%", maxWidth: "800px", height: "80vh", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" },
  modalTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" },
  closeBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", borderRadius: "50%", transition: "background-color 0.2s" },
  transcriptScrollArea: { flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#ffffff" }
};