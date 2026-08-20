import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, CheckCircle, ArrowLeft, AlertCircle, Clock } from "lucide-react";
import axios from "axios";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  // State to hold the history of previously uploaded resumes
  const [pastResumes, setPastResumes] = useState([]);

  // Fetch past resumes from the backend when the page loads
  const fetchResumes = async () => {
    try {
      const userId = localStorage.getItem("smartHireUserId");
      
      // Security check: if no user is logged in, redirect to login
      if (!userId) {
        navigate("/");
        return;
      }

      // FIX: Dynamically fetch resumes for THIS specific user
      const response = await axios.get(`http://127.0.0.1:8000/api/user/resumes?user_id=${userId}`);
      if (response.data.resumes) {
        setPastResumes(response.data.resumes);
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [navigate]);

  // Handle Drag & Drop Events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      alert("Please upload a valid PDF or DOCX file.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/upload-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data.skills) {
        localStorage.setItem("userSkills", response.data.skills);
      }
      
      setUploadStatus("success");
      
      // Refresh the history list dynamically!
      fetchResumes();
      
      // Clear the upload box after 2 seconds so they can upload another one
      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backButton}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Resume Manager</h2>
        <div style={{ width: "160px" }}></div>
      </nav>

      <main style={styles.mainContent}>
        
        {/* Top Card: Upload a New Resume */}
        <div style={styles.card}>
          <div style={styles.headerText}>
            <h1 style={styles.title}>Upload a New Resume</h1>
            <p style={styles.subtitle}>Upload your latest resume in PDF or DOCX format to help our AI tailor your interview questions.</p>
          </div>

          <div 
            style={{
              ...styles.dropZone,
              borderColor: isDragging ? "#3b82f6" : "#e2e8f0",
              backgroundColor: isDragging ? "#eff6ff" : "#f8fafc"
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.docx,application/pdf"
              style={{ display: "none" }}
            />
            
            <div style={styles.uploadIconCircle}>
              <UploadCloud size={32} color="#3b82f6" />
            </div>
            <p style={styles.dropText}>
              <span style={styles.browseText}>Click to browse</span> or drag and drop your file here
            </p>
            <p style={styles.formatText}>Supported formats: PDF, DOCX (Max 5MB)</p>
          </div>

          {selectedFile && (
            <div style={styles.filePreviewRow}>
              <div style={styles.fileInfo}>
                <FileText size={24} color="#64748b" />
                <div>
                  <p style={styles.fileName}>{selectedFile.name}</p>
                  <p style={styles.fileSize}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {uploadStatus === "success" && <CheckCircle size={24} color="#10b981" />}
              {uploadStatus === "error" && <AlertCircle size={24} color="#ef4444" />}
            </div>
          )}

          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading || uploadStatus === "success"}
            style={{
              ...styles.uploadButton,
              backgroundColor: !selectedFile ? "#cbd5e1" : (uploadStatus === "success" ? "#10b981" : "#007BFF"),
              cursor: !selectedFile || isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? "Extracting Skills..." : (uploadStatus === "success" ? "Upload Complete!" : "Upload & Analyze")}
          </button>
        </div>

        {/* Bottom Card: History of Uploaded Resumes */}
        <div style={{...styles.card, marginTop: "24px"}}>
          <div style={styles.listHeader}>
            <h2 style={styles.listTitle}>Your Saved Resumes</h2>
            <span style={styles.badge}>{pastResumes.length} Files</span>
          </div>

          {pastResumes.length > 0 ? (
            <div style={styles.resumeList}>
              {pastResumes.map((resume) => (
                <div key={resume.id} style={styles.resumeListItem}>
                  <div style={styles.resumeListLeft}>
                    <div style={styles.fileIconBox}>
                      <FileText size={20} color="#3b82f6" />
                    </div>
                    <div>
                      <p style={styles.resumeListName}>{resume.filename}</p>
                      <p style={styles.resumeListDate}>
                        <Clock size={12} style={{marginRight: "4px"}}/> 
                        Available for AI Sessions
                      </p>
                    </div>
                  </div>
                  <div style={styles.resumeListRight}>
                    <span style={styles.readyBadge}><CheckCircle size={14}/> AI Ready</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <FileText size={32} color="#cbd5e1" style={{marginBottom: "12px"}}/>
              <p style={{margin: 0, color: "#64748b", fontSize: "14px"}}>No resumes uploaded yet.</p>
            </div>
          )}
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
  
  mainContent: { padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center" },
  card: { backgroundColor: "#ffffff", width: "100%", maxWidth: "600px", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0" },
  
  headerText: { textAlign: "center", marginBottom: "32px" },
  title: { fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#64748b", margin: 0, lineHeight: "1.5" },
  
  dropZone: { border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease", marginBottom: "24px" },
  uploadIconCircle: { width: "56px", height: "56px", backgroundColor: "#eff6ff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" },
  dropText: { fontSize: "15px", color: "#475569", margin: "0 0 6px 0" },
  browseText: { color: "#3b82f6", fontWeight: "600" },
  formatText: { fontSize: "12px", color: "#94a3b8", margin: 0 },
  
  filePreviewRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "24px" },
  fileInfo: { display: "flex", alignItems: "center", gap: "12px" },
  fileName: { fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" },
  fileSize: { fontSize: "12px", color: "#64748b", margin: 0 },
  uploadButton: { width: "100%", padding: "14px", borderRadius: "8px", border: "none", color: "white", fontSize: "15px", fontWeight: "600", transition: "all 0.2s", cursor: "pointer" },

  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  listTitle: { margin: 0, fontSize: "18px", fontWeight: "600", color: "#0f172a" },
  badge: { backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  
  resumeList: { display: "flex", flexDirection: "column", gap: "12px" },
  resumeListItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "10px", backgroundColor: "#f8fafc" },
  resumeListLeft: { display: "flex", alignItems: "center", gap: "16px" },
  fileIconBox: { padding: "10px", backgroundColor: "#eff6ff", borderRadius: "8px" },
  resumeListName: { margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#0f172a" },
  resumeListDate: { margin: 0, fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center" },
  readyBadge: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#10b981", backgroundColor: "#d1fae5", padding: "4px 10px", borderRadius: "12px" },
  
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", border: "1px dashed #e2e8f0", borderRadius: "10px", backgroundColor: "#f8fafc" }
};