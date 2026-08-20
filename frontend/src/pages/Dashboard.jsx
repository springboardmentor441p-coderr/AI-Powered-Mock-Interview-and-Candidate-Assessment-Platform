import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, FileText, Video, History, 
  User, Bell, PlusCircle, TrendingUp, Target, 
  Mic, Award, LogOut 
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  
  // State to hold dynamic data fetched from the database
  const [stats, setStats] = useState({
    overallPerformance: 0,
    totalSessions: 0,
    bestScore: 0,
    avgScore: 0,
    communicationScore: 0
  });

  // Fetch dynamic stats when the dashboard loads
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Dynamically grab the logged-in user's ID
        const userId = localStorage.getItem("smartHireUserId");
        
        // If no user is logged in, redirect them back to the login screen
        if (!userId) {
          navigate("/");
          return;
        }

        // Pass the user_id as a query parameter to fetch exactly their data
        const response = await axios.get(`http://127.0.0.1:8000/api/user/dashboard-stats?user_id=${userId}`);
        
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching dynamic stats. Using fallback data.", error);
        setStats({
          overallPerformance: 0,
          totalSessions: 0,
          bestScore: 0,
          avgScore: 0,
          communicationScore: 0
        });
      }
    };
    
    fetchDashboardStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("smartHireUserId");
    navigate("/");
  };

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Resumes", icon: <FileText size={20} />, path: "/resumes" }, 
    { name: "New Interview", icon: <Video size={20} />, path: "/setup-interview" },
    { name: "Session History", icon: <History size={20} />, path: "/history" },
    { name: "Profile", icon: <User size={20} />, path: "/profile" },
    { name: "Notifications", icon: <Bell size={20} />, path: "/notifications" },
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <div style={styles.logoIcon}>AI</div>
          <h2 style={styles.logoText}>SmartHire</h2>
        </div>
        
        <nav style={styles.navMenu}>
          {menuItems.map((item) => (
            <div 
              key={item.name} 
              onClick={() => {
                setActiveMenu(item.name);
                navigate(item.path);
              }}
              style={{
                ...styles.navItem,
                backgroundColor: activeMenu === item.name ? "#eff6ff" : "transparent",
                color: activeMenu === item.name ? "#2563eb" : "#64748b",
                borderRight: activeMenu === item.name ? "3px solid #2563eb" : "3px solid transparent",
              }}
            >
              {item.icon}
              <span style={styles.navText}>{item.name}</span>
            </div>
          ))}

          {/* Secure Logout Button */}
          <div 
            onClick={handleLogout}
            style={{...styles.navItem, color: "#ef4444", marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: "24px"}}
          >
            <LogOut size={20} />
            <span style={styles.navText}>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard Analytics</h1>
            <p style={styles.pageSubtitle}>Track your interview readiness and performance trends.</p>
          </div>
          <button onClick={() => navigate("/setup-interview")} style={styles.primaryButton}>
            <PlusCircle size={18} /> Start New Interview
          </button>
        </header>

        {/* Dynamic Analytics Grid */}
        <div style={styles.gridContainer}>
          
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Overall Performance</h3>
              <TrendingUp size={20} color="#10b981" />
            </div>
            <div style={styles.statLarge}>{stats.overallPerformance}%</div>
            <p style={styles.statSubtext}>Based on all sessions</p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Total Sessions</h3>
              <Video size={20} color="#3b82f6" />
            </div>
            <div style={styles.statLarge}>{stats.totalSessions}</div>
            <p style={styles.statSubtext}>Interviews completed</p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Best Score</h3>
              <Award size={20} color="#f59e0b" />
            </div>
            <div style={styles.statLarge}>{stats.bestScore}<span style={styles.statSmall}>/100</span></div>
            <p style={styles.statSubtext}>Highest achievement</p>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Avg. Score</h3>
              <Target size={20} color="#3b82f6" />
            </div>
            <div style={styles.statLarge}>{stats.avgScore}<span style={styles.statSmall}>/100</span></div>
            <p style={styles.statSubtext}>Across all roles</p>
          </div>

          <div style={{...styles.card, gridColumn: "span 2", display: "flex", flexDirection: "column"}}>
             <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Performance History</h3>
            </div>
            <div style={styles.chartPlaceholder}>
              <div style={styles.mockChartLine}></div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Communication Score</h3>
              <Mic size={20} color="#8b5cf6" />
            </div>
            <div style={styles.statLarge}>{stats.communicationScore}%</div>
            <p style={styles.statSubtext}>Grammar, pacing, and filler words.</p>
          </div>

        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: "flex", width: "100vw", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  sidebar: { width: "260px", backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" },
  logoContainer: { padding: "24px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #f1f5f9" },
  logoIcon: { backgroundColor: "#2563eb", color: "white", padding: "6px 10px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px" },
  logoText: { fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 },
  navMenu: { padding: "24px 0", flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  navItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 24px", cursor: "pointer", transition: "all 0.2s", fontWeight: "500", fontSize: "15px" },
  navText: { marginTop: "2px" },
  
  mainContent: { flex: 1, padding: "40px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  pageTitle: { fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  pageSubtitle: { fontSize: "15px", color: "#64748b", margin: 0 },
  primaryButton: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "background-color 0.2s" },
  
  gridContainer: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" },
  card: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  cardTitle: { fontSize: "15px", fontWeight: "600", color: "#64748b", margin: 0 },
  statLarge: { fontSize: "36px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" },
  statSmall: { fontSize: "20px", color: "#94a3b8", fontWeight: "600", marginLeft: "4px" },
  statSubtext: { fontSize: "13px", color: "#10b981", margin: 0, fontWeight: "500" },
  
  chartPlaceholder: { flex: 1, borderTop: "1px dashed #e2e8f0", marginTop: "16px", position: "relative", minHeight: "120px" },
  mockChartLine: { position: "absolute", bottom: "20%", left: 0, right: 0, height: "2px", backgroundColor: "#3b82f6", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)" }
};