import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Video, History, User, Bell, 
  PlusCircle, TrendingUp, Award, Target, Mic, Eye 
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the performance graph
const mockPerformanceData = [
  { name: 'Session 1', score: 65 },
  { name: 'Session 2', score: 72 },
  { name: 'Session 3', score: 68 },
  { name: 'Session 4', score: 85 },
  { name: 'Session 5', score: 92 },
];

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Resumes", icon: <FileText size={20} /> },
    { name: "New Interview", icon: <Video size={20} /> },
    { name: "Session History", icon: <History size={20} /> },
    { name: "Profile", icon: <User size={20} /> },
    { name: "Notifications", icon: <Bell size={20} /> },
  ];

  const handleStartInterview = () => {
    // We will build this page in the next step
    navigate("/setup-interview"); 
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <div style={styles.logoBadge}>AI</div>
          <h2 style={styles.logoText}>SmartHire</h2>
        </div>
        
        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <div
          key={item.name}
          onClick={() => {
            setActiveMenu(item.name);
            if (item.name === "Resumes") navigate("/resume-upload");
          }}
          style={{
            ...styles.menuItem,
            backgroundColor: activeMenu === item.name ? "#f0f7ff" : "transparent",
            color: activeMenu === item.name ? "#007BFF" : "#64748b",
            borderRight: activeMenu === item.name ? "3px solid #007BFF" : "3px solid transparent",
          }}
        >
          {item.icon}
          <span style={styles.menuText}>{item.name}</span>
        </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Header Section */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Dashboard Analytics</h1>
            <p style={styles.pageSubtitle}>Track your interview readiness and performance trends.</p>
          </div>
          <button onClick={handleStartInterview} style={styles.primaryButton}>
            <PlusCircle size={18} />
            Start New Interview
          </button>
        </header>

        {/* Top Statistics Grid */}
        <div style={styles.statsGrid}>
          <StatCard title="Overall Performance" value="84%" icon={<TrendingUp color="#10b981" />} trend="+5% this week" />
          <StatCard title="Total Sessions" value="12" icon={<Video color="#6366f1" />} trend="2 pending review" />
          <StatCard title="Best Score" value="92/100" icon={<Award color="#f59e0b" />} trend="Technical Round" />
          <StatCard title="Avg. Score" value="78/100" icon={<Target color="#3b82f6" />} trend="Consistent" />
        </div>

        {/* Bottom Section: Graph and Sub-metrics */}
        <div style={styles.bottomGrid}>
          {/* Performance Graph Card */}
          <div style={styles.chartCard}>
            <h3 style={styles.cardTitle}>Performance History</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Line type="monotone" dataKey="score" stroke="#007BFF" strokeWidth={3} dot={{r: 6, fill: '#007BFF', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Metric Cards */}
          <div style={styles.subMetricsColumn}>
            <div style={styles.subMetricCard}>
              <div style={styles.subMetricHeader}>
                <Mic size={24} color="#8b5cf6" />
                <span style={styles.subMetricTitle}>Communication Score</span>
              </div>
              <div style={styles.subMetricValue}>88%</div>
              <p style={styles.subMetricDetail}>Grammar, pacing, and filler words are excellent.</p>
            </div>
            
            <div style={styles.subMetricCard}>
              <div style={styles.subMetricHeader}>
                <Eye size={24} color="#ec4899" />
                <span style={styles.subMetricTitle}>Confidence Score</span>
              </div>
              <div style={styles.subMetricValue}>75%</div>
              <p style={styles.subMetricDetail}>Eye contact dropped during technical questions.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Component for Stat Cards
function StatCard({ title, value, icon, trend }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statHeader}>
        <span style={styles.statTitle}>{title}</span>
        <div style={styles.iconWrapper}>{icon}</div>
      </div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statTrend}>{trend}</div>
    </div>
  );
}

// Modern, Trending CSS Styles Object
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f8fafc", // Very soft slate background
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
  },
  logoContainer: {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  logoBadge: {
    backgroundColor: "#007BFF",
    color: "white",
    fontWeight: "bold",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "14px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  nav: {
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px 24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: "500",
    fontSize: "15px",
    gap: "12px",
  },
  menuText: {
    marginTop: "2px",
  },
  mainContent: {
    flex: 1,
    padding: "32px 40px",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  pageSubtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(0, 123, 255, 0.2)",
    transition: "background-color 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    border: "1px solid #f1f5f9",
  },
  statHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  statTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
  },
  iconWrapper: {
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "4px",
  },
  statTrend: {
    fontSize: "13px",
    color: "#10b981", // Green text for trend
    fontWeight: "500",
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "24px",
  },
  chartCard: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    border: "1px solid #f1f5f9",
    height: "350px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 20px 0",
  },
  chartContainer: {
    height: "280px",
    width: "100%",
  },
  subMetricsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  subMetricCard: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    border: "1px solid #f1f5f9",
    flex: 1,
  },
  subMetricHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  subMetricTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#475569",
  },
  subMetricValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },
  subMetricDetail: {
    fontSize: "13px",
    color: "#64748b",
    lineHeight: "1.5",
    margin: 0,
  },
};