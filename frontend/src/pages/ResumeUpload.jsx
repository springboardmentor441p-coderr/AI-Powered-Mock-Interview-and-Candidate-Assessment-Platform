import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import axios from "axios";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' or 'error'

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
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  // Handle Clicking to Select File
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Only accept PDF or DOCX
    if (file.type === "application/pdf" || file.name.endsWith(".docx")) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      alert("Please upload a valid PDF or DOCX file.");
    }
  };

  // Send the file to your FastAPI backend
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    // Prepare the file as FormData (required for sending files via HTTP)
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/analyze-resume/1", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      console.log("Upload & Extraction successful:", response.data);
      
      // NEW: Save the extracted skills to the browser's local memory!
      if (response.data.skills) {
        localStorage.setItem("userSkills", response.data.skills);
      }
      
      setUploadStatus("success");
      
      setTimeout(() => {
        navigate("/dashboard");
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
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h2 style={styles.navTitle}>Upload Resume</h2>
        <div style={{ width: "140px" }}></div>
      </nav>

      <main style={styles.mainContent}>
        <div style={styles.uploadCard}>
          
          <div style={styles.headerText}>
            <h1 style={styles.title}>Let's analyze your skills</h1>
            <p style={styles.subtitle}>Upload your resume in PDF or DOCX format to help our AI tailor your interview questions.</p>
          </div>

          {/* Drag and Drop Zone */}
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

          {/* Selected File Preview */}
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

          {/* Action Button */}
          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading || uploadStatus === "success"}
            style={{
              ...styles.uploadButton,
              backgroundColor: !selectedFile ? "#cbd5e1" : (uploadStatus === "success" ? "#10b981" : "#007BFF"),
              cursor: !selectedFile || isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? "Uploading..." : (uploadStatus === "success" ? "Success! Redirecting..." : "Analyze Resume")}
          </button>
          
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" },
  navBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" },
  backButton: { display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", fontSize: "15px", fontWeight: "500", cursor: "pointer" },
  navTitle: { fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: 0 },
  mainContent: { padding: "60px 20px", display: "flex", justifyContent: "center" },
  uploadCard: { backgroundColor: "#ffffff", width: "100%", maxWidth: "600px", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", border: "1px solid #f1f5f9" },
  headerText: { textAlign: "center", marginBottom: "32px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" },
  subtitle: { fontSize: "15px", color: "#64748b", margin: 0, lineHeight: "1.5" },
  dropZone: { border: "2px dashed #e2e8f0", borderRadius: "12px", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease", marginBottom: "24px" },
  uploadIconCircle: { width: "64px", height: "64px", backgroundColor: "#eff6ff", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "16px" },
  dropText: { fontSize: "16px", color: "#475569", margin: "0 0 8px 0" },
  browseText: { color: "#3b82f6", fontWeight: "600" },
  formatText: { fontSize: "13px", color: "#94a3b8", margin: 0 },
  filePreviewRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "24px" },
  fileInfo: { display: "flex", alignItems: "center", gap: "12px" },
  fileName: { fontSize: "14px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" },
  fileSize: { fontSize: "12px", color: "#64748b", margin: 0 },
  uploadButton: { width: "100%", padding: "14px", borderRadius: "8px", border: "none", color: "white", fontSize: "16px", fontWeight: "600", transition: "background-color 0.2s" }
};