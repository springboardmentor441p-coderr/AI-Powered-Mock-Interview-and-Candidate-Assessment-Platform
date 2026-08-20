import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Bell, CheckCircle, FileText, CheckCheck, MessageSquare } from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const userId = localStorage.getItem("smartHireUserId");

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    const fetchAlerts = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/user/notifications?user_id=${userId}`);
        if (response.data.notifications) {
          setNotifications(response.data.notifications);
        }
      } catch (error) {
        console.error("Failed to load notifications");
      }
    };
    fetchAlerts();
  }, [navigate, userId]);

  const markAllAsRead = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/api/user/notifications/read?user_id=${userId}`);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const getIcon = (type) => {
    if (type === "resume") return <FileText color="#3b82f6"/>;
    if (type === "feedback") return <MessageSquare color="#8b5cf6"/>;
    return <CheckCircle color="#10b981"/>;
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Notifications</h2>
        <button onClick={markAllAsRead} style={styles.markReadButton}>
          <CheckCheck size={16} /> Mark all as read
        </button>
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.card}>
          <div style={styles.headerArea}>
            <div style={styles.iconCircle}>
              <Bell size={24} color="#3b82f6" />
            </div>
            <h1 style={styles.title}>Your Updates</h1>
            <p style={styles.subtitle}>Stay on top of your interview feedback and system alerts.</p>
          </div>

          <div style={styles.listContainer}>
            {notifications.map((note) => (
              <div key={note.id} style={{
                ...styles.notificationItem,
                backgroundColor: note.isRead ? "#ffffff" : "#eff6ff",
                borderLeft: note.isRead ? "4px solid transparent" : "4px solid #3b82f6"
              }}>
                <div style={styles.noteIconBox}>
                  {getIcon(note.type)}
                </div>
                <div style={styles.noteContent}>
                  <div style={styles.noteHeader}>
                    <h3 style={styles.noteTitle}>{note.title}</h3>
                  </div>
                  <p style={styles.noteMessage}>{note.message}</p>
                </div>
                {!note.isRead && <div style={styles.unreadDot}></div>}
              </div>
            ))}
            {notifications.length === 0 && <p style={{textAlign: "center", color: "#64748b"}}>No notifications yet.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" },
  backButton: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: "8px", color: "#475569", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  navTitle: { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 },
  markReadButton: { display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#3b82f6", fontSize: "14px", fontWeight: "600", cursor: "pointer" },
  mainContent: { padding: "48px 20px", display: "flex", justifyContent: "center" },
  card: { backgroundColor: "#ffffff", width: "100%", maxWidth: "700px", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  headerArea: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "32px" },
  iconCircle: { width: "56px", height: "56px", backgroundColor: "#eff6ff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  subtitle: { fontSize: "15px", color: "#64748b", margin: 0 },
  listContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  notificationItem: { display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", position: "relative", transition: "all 0.2s" },
  noteIconBox: { backgroundColor: "#f8fafc", padding: "10px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" },
  noteContent: { flex: 1 },
  noteHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  noteTitle: { margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" },
  noteMessage: { margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.5" },
  unreadDot: { width: "10px", height: "10px", backgroundColor: "#3b82f6", borderRadius: "50%", position: "absolute", top: "24px", right: "20px" }
};