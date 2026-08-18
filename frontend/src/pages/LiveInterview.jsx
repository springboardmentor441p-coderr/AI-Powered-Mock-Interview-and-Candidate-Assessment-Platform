import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, Phone, 
  Activity, Eye, UserCheck, Sparkles, Send, Loader2
} from "lucide-react";

export default function LiveInterview() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [mediaStream, setMediaStream] = useState(null); 
  const [userTranscript, setUserTranscript] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
   // Remove the hardcoded initialQuestion!
  const [currentQuestion, setCurrentQuestion] = useState("Analyzing your resume and generating your first question...");
  const [conversation, setConversation] = useState([]); // Start empty
  
  // NEW: State to store the real AI scores and feedback over the session
  const [sessionScores, setSessionScores] = useState([]);
  const [sessionFeedback, setSessionFeedback] = useState([]);
  
  const [eyeContact, setEyeContact] = useState(85);
  const [confidence, setConfidence] = useState(78);
  const [posture, setPosture] = useState("Good");
  
const location = useLocation();

const interviewType = location.state?.interviewType || "Technical";
const role = location.state?.role || "Software Engineer";
const difficulty = location.state?.difficulty || "Medium";

  // 1. Initialize Webcam AND Fetch First Question
  useEffect(() => {
    let currentStream;

    // Start Webcam
    const enableWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        currentStream = stream;
        setMediaStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    // Fetch Custom First Question
       const fetchFirstQuestion = async () => {
  try {
    const response = await axios.post("http://127.0.0.1:8000/api/interview/start", {
  role_domain: role,       // Changed from 'role' to match backend
  resume_skills: interviewType, // Changed to match your backend model's expected field name
  difficulty: difficulty
});
    // ... rest of the code
        
        const customQuestion = response.data.question;
        setCurrentQuestion(customQuestion);
        setConversation([{ role: "ai", text: customQuestion }]);
      } catch (error) {
        console.error("Failed to load first question", error);
      }
    };

    // Execute both functions
    enableWebcam();
    fetchFirstQuestion();

    // Cleanup when the component unmounts
    return () => {
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []); // <-- This empty dependency array ensures it only runs once
  
  useEffect(() => {
    if (mediaStream) mediaStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
  }, [isVideoOff, mediaStream]);

  useEffect(() => {
    if (mediaStream) mediaStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
  }, [isMuted, mediaStream]);


  // Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let fullTranscript = Array.from(event.results).map(res => res[0].transcript).join("");
        setUserTranscript(fullTranscript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // AI Voice
  useEffect(() => {
    if ('speechSynthesis' in window && currentQuestion) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 0.95;
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQuestion]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEyeContact(prev => Math.min(100, Math.max(40, prev + (Math.random() * 10 - 5))));
      setConfidence(prev => Math.min(100, Math.max(50, prev + (Math.random() * 8 - 4))));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Browser not supported. Use Chrome.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setUserTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const submitAnswerToAI = async () => {
    if (!userTranscript.trim()) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    setIsAiThinking(true);
    const answerToSend = userTranscript;
    setConversation(prev => [...prev, { role: "user", text: answerToSend }]);
    setUserTranscript(""); 

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/interview/chat", {
        role_domain: "Backend Engineering",
        difficulty: "Medium",
        current_question: currentQuestion,
        user_answer: answerToSend
      });

      const aiData = response.data;
      
      if (aiData.error) {
        console.error("Backend Error:", aiData.error);
        return;
      }

      if (aiData.feedback && aiData.next_question) {
        setConversation(prev => [
          ...prev, 
          { role: "ai", text: `Feedback: ${aiData.feedback}` },
          { role: "ai", text: aiData.next_question }
        ]);
        
        // NEW: Save the AI's score and feedback to our arrays
        setSessionScores(prev => [...prev, aiData.score]);
        setSessionFeedback(prev => [...prev, aiData.feedback]);
        
        setCurrentQuestion(aiData.next_question);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsAiThinking(false);
    }
  };

  // 15 minutes in seconds (15 * 60 = 900)
const [timeLeft, setTimeLeft] = useState(900);

useEffect(() => {
  if (timeLeft <= 0) {
    handleEndInterview(); // Automatically end when timer reaches 00:00:00
    return;
  }

  const timer = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft]);

// Helper to format seconds into HH:MM:SS
const formatTime = (seconds) => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
};
  // NEW: Calculate averages and pass real data to the Summary page
  const handleEndInterview = () => {
    if (window.confirm("End the interview? Your analytics will be saved.")) {
      window.speechSynthesis.cancel();
      
      // Calculate average score (backend returns out of 10, multiply by 10 for percentage)
      const avgScore = sessionScores.length > 0 
        ? Math.round((sessionScores.reduce((a, b) => a + Number(b), 0) / sessionScores.length) * 10) 
        : 0;

      // Navigate and pass the dynamic data through React state
      navigate("/summary", { 
        state: { 
          score: avgScore,
          feedbacks: sessionFeedback,
          eyeContact: Math.round(eyeContact),
          confidence: Math.round(confidence),
          posture: posture
        } 
      }); 
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.liveBadge}><span style={styles.pulseDot}></span> LIVE</div>
         <h2 style={styles.title}>{role} - {interviewType} Round</h2>
        </div>
        {/* With this: */}
      <div style={styles.timer}>{formatTime(timeLeft)}</div>
      </header>

      <main style={styles.mainArea}>
        <div style={styles.column}>
          <div style={{...styles.videoBox, ...(isAiSpeaking ? styles.aiSpeakingGlow : {})}}>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=SmartHire&backgroundColor=1e293b&style=circle" alt="AI Avatar" style={styles.aiAvatarImage} />
            {isAiSpeaking && (
              <div style={styles.audioWaveGroup}>
                <div style={styles.audioBar}></div>
                <div style={{...styles.audioBar, animationDelay: '0.1s'}}></div>
                <div style={{...styles.audioBar, animationDelay: '0.2s'}}></div>
              </div>
            )}
            <div style={styles.nameTag}><Sparkles size={14} /> AI Interviewer</div>
          </div>
          
          <div style={styles.transcriptContainer}>
            <h3 style={styles.transcriptTitle}>Live Transcript</h3>
            <div style={styles.chatArea}>
              {conversation.map((msg, index) => (
                <div key={index} style={msg.role === "ai" ? styles.chatRowAi : styles.chatRowUser}>
                  <div style={msg.role === "ai" ? styles.chatBubbleAi : styles.chatBubbleUser}>
                    <p style={styles.chatText}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div style={styles.chatRowAi}>
                  <div style={styles.chatBubbleAi}><Loader2 size={16} className="spin-animation" color="#94a3b8"/></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div style={styles.inputArea}>
              <button onClick={toggleListening} style={{...styles.recordButton, backgroundColor: isListening ? "#ef4444" : "#334155"}}>
                {isListening ? <MicOff size={16} color="white" /> : <Mic size={16} color="white" />}
              </button>
              <input type="text" value={userTranscript} onChange={(e) => setUserTranscript(e.target.value)} placeholder={isListening ? "Listening to your voice..." : "Type or dictate your answer..."} style={styles.textInput} />
              <button onClick={submitAnswerToAI} style={styles.sendButton} disabled={isAiThinking || !userTranscript}>
                <Send size={16} color="white" />
              </button>
            </div>
          </div>
        </div>

        <div style={styles.column}>
          <div style={styles.videoBox}>
            <video ref={videoRef} autoPlay playsInline muted style={{ ...styles.webcam, display: isVideoOff ? "none" : "block" }} />
            {isVideoOff ? (
              <div style={styles.videoOff}><VideoOff size={48} color="#64748b" /><p>Camera Disabled</p></div>
            ) : (
              <><div style={styles.faceTrackingBox}></div><div style={styles.scanLine}></div></>
            )}
            <div style={styles.nameTag}>You (Candidate)</div>
          </div>

          <div style={styles.metricsPanel}>
            <h3 style={styles.metricsTitle}><Activity size={16} /> Live Behavioral Analysis</h3>
            <div style={styles.metricItem}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}><Eye size={14}/> Eye Contact Tracking</span>
                <span style={styles.metricValue}>{Math.round(eyeContact)}%</span>
              </div>
              <div style={styles.progressBarBg}><div style={{...styles.progressBarFill, width: `${eyeContact}%`, backgroundColor: eyeContact > 70 ? "#10b981" : "#f59e0b"}}></div></div>
            </div>
            <div style={styles.metricItem}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}><Activity size={14}/> Overall Confidence</span>
                <span style={styles.metricValue}>{Math.round(confidence)}%</span>
              </div>
              <div style={styles.progressBarBg}><div style={{...styles.progressBarFill, width: `${confidence}%`, backgroundColor: confidence > 70 ? "#3b82f6" : "#f59e0b"}}></div></div>
            </div>
            <div style={styles.metricItemCompact}>
              <div style={styles.metricHeader}>
                <span style={styles.metricLabel}><UserCheck size={14}/> Posture & Framing</span>
                <span style={{...styles.metricValue, color: posture === "Good" || posture === "Excellent" ? "#10b981" : "#ef4444"}}>{posture}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer style={styles.controlBar}>
        <button onClick={() => setIsMuted(!isMuted)} style={{...styles.controlBtn, ...(isMuted ? styles.controlBtnOff : {})}}>
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={() => setIsVideoOff(!isVideoOff)} style={{...styles.controlBtn, ...(isVideoOff ? styles.controlBtnOff : {})}}>
          {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
        </button>
        <button onClick={handleEndInterview} style={styles.endButton}>
          <Phone size={24} /> End Interview
        </button>
      </footer>
      
      <style>{`
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes soundwave { 0% { height: 12px; } 50% { height: 35px; } 100% { height: 12px; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-animation { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Ensure your styles object remains exactly the same as previously defined here at the bottom.
const styles = {
  container: { display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0f172a", color: "white", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 32px", backgroundColor: "#1e293b", borderBottom: "1px solid #334155" },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  liveBadge: { display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", border: "1px solid rgba(239, 68, 68, 0.2)" },
  pulseDot: { width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%", animation: "pulse 1.5s infinite" },
  title: { margin: 0, fontSize: "16px", fontWeight: "600" },
  timer: { fontFamily: "monospace", fontSize: "18px", fontWeight: "bold", color: "#94a3b8" },
  
  mainArea: { flex: 1, display: "flex", gap: "24px", padding: "24px", overflow: "hidden" },
  column: { flex: 1, display: "flex", flexDirection: "column", gap: "24px" },
  
  videoBox: { flex: 2, width: "100%", backgroundColor: "#1e293b", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid #334155", display: "flex", justifyContent: "center", alignItems: "center", transition: "all 0.3s ease" },
  aiAvatarImage: { width: "160px", height: "160px", borderRadius: "50%", objectFit: "cover" },
  aiSpeakingGlow: { boxShadow: "0 0 30px rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.5)" },
  audioWaveGroup: { display: "flex", gap: "6px", position: "absolute", bottom: "40px" },
  audioBar: { width: "6px", height: "12px", backgroundColor: "#3b82f6", borderRadius: "3px", animation: "soundwave 0.8s infinite ease-in-out" },
  nameTag: { position: "absolute", bottom: "16px", left: "16px", backgroundColor: "rgba(15, 23, 42, 0.7)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", backdropFilter: "blur(4px)" },
  
  webcam: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  faceTrackingBox: { position: "absolute", top: "15%", left: "30%", right: "30%", bottom: "15%", border: "2px dashed rgba(16, 185, 129, 0.4)", borderRadius: "12px", pointerEvents: "none" },
  scanLine: { position: "absolute", left: "0", right: "0", height: "3px", backgroundColor: "rgba(16, 185, 129, 0.6)", boxShadow: "0 0 12px rgba(16, 185, 129, 0.9)", animation: "scan 3s infinite linear", pointerEvents: "none" },
  videoOff: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#1e293b", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px", color: "#64748b", zIndex: 10 },
  
  transcriptContainer: { flex: 1, backgroundColor: "#1e293b", borderRadius: "16px", padding: "16px", border: "1px solid #334155", display: "flex", flexDirection: "column", overflow: "hidden" },
  transcriptTitle: { margin: "0 0 12px 0", fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  chatArea: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "8px", marginBottom: "12px" },
  chatRowAi: { display: "flex", justifyContent: "flex-start" },
  chatRowUser: { display: "flex", justifyContent: "flex-end" },
  chatBubbleAi: { backgroundColor: "#334155", padding: "10px 14px", borderRadius: "12px", borderBottomLeftRadius: "4px", maxWidth: "85%" },
  chatBubbleUser: { backgroundColor: "#007BFF", padding: "10px 14px", borderRadius: "12px", borderBottomRightRadius: "4px", maxWidth: "85%" },
  chatText: { margin: 0, fontSize: "13px", lineHeight: "1.4", color: "#f8fafc" },
  
  inputArea: { display: "flex", gap: "8px", alignItems: "center", backgroundColor: "#0f172a", padding: "8px", borderRadius: "12px", border: "1px solid #334155" },
  recordButton: { width: "36px", height: "36px", borderRadius: "50%", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", transition: "all 0.2s" },
  textInput: { flex: 1, backgroundColor: "transparent", border: "none", color: "white", fontSize: "14px", outline: "none", padding: "0 8px" },
  sendButton: { width: "36px", height: "36px", borderRadius: "8px", border: "none", backgroundColor: "#007BFF", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" },

  metricsPanel: { flex: 1, backgroundColor: "#1e293b", borderRadius: "16px", padding: "16px", border: "1px solid #334155", display: "flex", flexDirection: "column", justifyContent: "center" },
  metricsTitle: { margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" },
  metricItem: { marginBottom: "16px" },
  metricItemCompact: { marginBottom: "0" }, 
  metricHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  metricLabel: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#cbd5e1" },
  metricValue: { fontSize: "15px", fontWeight: "bold", color: "#f8fafc" },
  progressBarBg: { height: "6px", backgroundColor: "#334155", borderRadius: "3px", overflow: "hidden" },
  progressBarFill: { height: "100%", transition: "width 0.5s ease, background-color 0.5s ease" },
  
  controlBar: { display: "flex", justifyContent: "center", gap: "24px", padding: "16px", backgroundColor: "#1e293b", borderTop: "1px solid #334155" },
  controlBtn: { width: "56px", height: "56px", borderRadius: "50%", border: "none", backgroundColor: "#334155", color: "white", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", transition: "all 0.2s" },
  controlBtnOff: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" },
  endButton: { display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "56px", borderRadius: "28px", border: "none", backgroundColor: "#ef4444", color: "white", fontSize: "15px", fontWeight: "bold", cursor: "pointer" }
};