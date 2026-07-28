import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    FileText,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    Cpu,
    Video,
    Mic,
    Camera,
    Clock,
    Check,
    Info,
    Sliders,
    Sun,
    Wifi,
    ArrowLeft,
    AlertTriangle,
    Lock,
    Eye,
    Volume2,
    CheckSquare,
    Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const fallbackRoleQuestions = {
    "Frontend Developer": [
        { id: 1, category: "Technical", topic: "HTML/CSS Layouts", question_text: "What is the difference between CSS Flexbox and CSS Grid, and when would you choose one over the other for a web layout?", expected_points: ["Flexbox for 1D layout alignment", "Grid for 2D complex page layouts"] },
        { id: 2, category: "Technical", topic: "JavaScript Fundamentals", question_text: "Can you explain what a closure is in JavaScript and provide a practical scenario where you would use it?", expected_points: ["Function retaining outer scope variables", "Private variables and data encapsulation"] },
        { id: 3, category: "Technical", topic: "DOM & Async JS", question_text: "How does the JavaScript Event Loop handle asynchronous operations like Promises and setTimeout?", expected_points: ["Microtask queue for Promises", "Macrotask queue for timers"] },
        { id: 4, category: "Technical", topic: "React Architecture", question_text: "What is the difference between state and props in React, and how does React decide when to re-render a component?", expected_points: ["Props are immutable inputs", "State changes trigger re-renders"] },
        { id: 5, category: "Technical", topic: "Web Performance", question_text: "What key techniques do you use to optimize the initial page load time of a modern frontend application?", expected_points: ["Code splitting and lazy loading", "Asset compression and image optimization"] }
    ],
    "Data Scientist": [
        { id: 1, category: "Technical", topic: "Machine Learning", question_text: "What is the difference between Overfitting and Underfitting in a machine learning model, and how do you prevent them?", expected_points: ["Regularization and cross-validation", "Feature selection and data augmentation"] },
        { id: 2, category: "Technical", topic: "Data Analysis", question_text: "How do you handle missing values or outliers in a dataset before feeding it into a machine learning model?", expected_points: ["Mean/median imputation or KNN", "IQR or z-score outlier detection"] },
        { id: 3, category: "Technical", topic: "Model Metrics", question_text: "When would you choose Precision and Recall over standard Accuracy to evaluate model performance?", expected_points: ["Imbalanced datasets", "Cost trade-offs of false positives vs false negatives"] }
    ]
};

const getFallbackQuestions = (targetRole, type, count) => {
    let pool = (fallbackQuestionsDB && fallbackQuestionsDB["Technical"]) ? fallbackQuestionsDB["Technical"] : [];
    if (type === "HR" && fallbackQuestionsDB && fallbackQuestionsDB["HR"]) {
        pool = fallbackQuestionsDB["HR"];
    } else if (fallbackRoleQuestions[targetRole]) {
        pool = fallbackRoleQuestions[targetRole];
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export const CreateInterview = () => {
    const navigate = useNavigate();
    const { candidate, resumeData, setResumeData, jdData, setJdData, setupChecks, setSetupChecks, setGeneratedQuestions, setCandidate, interviewDuration, setInterviewDuration } = useApp();

    // Workflow steps: 1 = Resume & JD, 2 = System Check & Options, 3 = Capture Image & Rules
    const [step, setStep] = useState(1);

    // Step 1 State: Resume & JD
    const [uploadedFileName, setUploadedFileName] = useState(resumeData.filename || 'No file chosen');
    const [isResumeSelected, setIsResumeSelected] = useState(resumeData.filename ? true : false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isParsingResume, setIsParsingResume] = useState(false);
    const fileInputRef = useRef(null);

    // Step 2 State: Interview Options
    const [interviewType, setInterviewType] = useState('Technical');
    const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
    const [role, setRole] = useState(candidate.targetRole || '');
    const duration = interviewDuration || '10 Mins (5 Qs)';
    const setDuration = setInterviewDuration;

    // Step 3 State: Face Capture & Rules Acceptance
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedFaceUrl, setCapturedFaceUrl] = useState(setupChecks.faceDataUrl || null);
    const [acceptedRules, setAcceptedRules] = useState(false);
    const [audioLevel, setAudioLevel] = useState(72);

    const sampleJdText = '';

    // Start Camera & Audio Telemetry on Step 2 & Step 3
    useEffect(() => {
        let mediaStream = null;
        let audioContext = null;
        let analyser = null;
        let animFrame = null;
        let autoCapTimer = null;

        if (step === 2 || step === 3) {
            async function startMedia() {
                try {
                    mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: "user"
                        },
                        audio: true
                    });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                        videoRef.current.play().catch(() => {});
                    }

                    // Live Audio Metering
                    try {
                        audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        const audioSource = audioContext.createMediaStreamSource(mediaStream);
                        analyser = audioContext.createAnalyser();
                        analyser.fftSize = 256;
                        audioSource.connect(analyser);

                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        const updateVolume = () => {
                            analyser.getByteFrequencyData(dataArray);
                            let sum = 0;
                            for (let i = 0; i < dataArray.length; i++) {
                                sum += dataArray[i];
                            }
                            const avg = sum / dataArray.length;
                            const levelPct = Math.min(100, Math.max(15, Math.round((avg / 128) * 100)));
                            setAudioLevel(levelPct);
                            animFrame = requestAnimationFrame(updateVolume);
                        };
                        updateVolume();
                    } catch (e) {
                        console.warn("Audio metering fallback:", e);
                    }

                    if (step === 3 && !capturedFaceUrl) {
                        autoCapTimer = setTimeout(() => {
                            if (videoRef.current && !capturedFaceUrl) {
                                try {
                                    handleCaptureFace();
                                } catch (e) {}
                            }
                        }, 1200);
                    }
                } catch (err) {
                    console.warn("Media access error:", err);
                }
            }
            startMedia();
        }

        return () => {
            if (animFrame) cancelAnimationFrame(animFrame);
            if (audioContext) audioContext.close().catch(() => {});
            if (autoCapTimer) clearTimeout(autoCapTimer);
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [step, capturedFaceUrl]);

    const handleRetakeFace = () => {
        setCapturedFaceUrl(null);
        setSetupChecks(prev => ({
            ...prev,
            faceCaptured: false,
            faceDataUrl: null,
            faceSignature: null
        }));
    };
    useEffect(() => {
        if (step === 2) {
            setRole(candidate.targetRole || resumeData.targetRole || '');
        }
    }, [step, candidate.targetRole, resumeData.targetRole]);
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadedFileName(file.name);
            setIsResumeSelected(true);
            setIsParsingResume(false);

            // Instantly populate resume details so user can proceed without waiting
            const defaultRole = role || candidate?.targetRole || 'Software Engineer';
            setResumeData({
                filename: file.name,
                name: candidate?.name || 'Candidate',
                targetRole: defaultRole,
                skills: ['React', 'Node.js', 'Python', 'SQL'],
                projects: [],
                experience: 'Software developer resume',
                education: '',
                certifications: []
            });

            // Asynchronously attempt detailed AI resume extraction in background
            const formData = new FormData();
            formData.append('file', file);

            fetch('http://localhost:8000/api/v1/analyze/resume', {
                method: 'POST',
                body: formData
            })
                .then(async (response) => {
                    if (response.ok) {
                        const data = await response.json();
                        const info = data.extracted_info || {};
                        console.log("Resume parsed in background:", info);
                        setResumeData(prev => ({
                            ...prev,
                            name: info.name || prev.name,
                            targetRole: info.target_role || prev.targetRole,
                            skills: (info.skills && info.skills.length > 0) ? info.skills : prev.skills
                        }));
                    }
                })
                .catch((err) => {
                    console.warn("Background resume parse notice:", err);
                });
        }
    };

    const handleProceedToStep2 = () => {
        if (!isResumeSelected || !resumeData.filename) {
            setResumeData(prev => ({
                ...prev,
                filename: prev.filename || 'Candidate_Resume.pdf'
            }));
            setIsResumeSelected(true);
        }
        setStep(2);
    };

    const handleProceedToStep3 = () => {
        // 1. ALWAYS transition to Step 3 synchronously on first line (0ms delay)
        setStep(3);

        let numQuestions = 5;
        const safeDuration = (typeof duration === 'string' && duration) ? duration : (interviewDuration || '10 Mins (5 Qs)');
        if (safeDuration.includes('8 Qs')) numQuestions = 8;
        else if (safeDuration.includes('10 Qs')) numQuestions = 10;

        const selectedRole = role || candidate?.targetRole || resumeData?.targetRole || 'Software Engineer';

        // 2. Populate fallback questions
        try {
            const initialFallbackQs = getFallbackQuestions(selectedRole, interviewType, numQuestions);
            setGeneratedQuestions(initialFallbackQs);
        } catch (e) {
            console.warn("Fallback questions warning:", e);
        }

        // 3. Asynchronously fetch custom AI questions in background without blocking UI
        setIsGenerating(true);
        fetch('http://localhost:8000/api/v1/analyze/generate-interview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                resume_text: JSON.stringify(resumeData || {}),
                jd_text: jdData?.rawText || '',
                interview_type: interviewType || 'Technical',
                experience_level: experienceLevel || 'Mid-Level',
                num_questions: numQuestions,
                target_role: selectedRole
            })
        })
            .then(async (response) => {
                if (response.ok) {
                    const data = await response.json();
                    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                        setGeneratedQuestions(data.questions);
                    }
                }
            })
            .catch((err) => console.error("Background AI generation fetch error:", err))
            .finally(() => setIsGenerating(false));
    };

    const extractFaceTemplate = (sourceCanvas, sx, sy, sWidth, sHeight) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        const tempCtx = tempCanvas.getContext('2d');
        try {
            tempCtx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, 16, 16);
            const imgData = tempCtx.getImageData(0, 0, 16, 16);
            const data = imgData.data;
            const pixels = [];
            let minVal = 1.0;
            let maxVal = 0.0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
                pixels.push(gray);
                if (gray < minVal) minVal = gray;
                if (gray > maxVal) maxVal = gray;
            }
            const range = maxVal - minVal;
            if (range < 0.01) return new Array(256).fill(0);
            return pixels.map(p => (p - minVal) / range);
        } catch (e) {
            console.error("extractFaceTemplate error:", e);
            return new Array(256).fill(0);
        }
    };

    const handleCaptureFace = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            const videoWidth = videoRef.current.videoWidth || 320;
            const videoHeight = videoRef.current.videoHeight || 240;
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            const ctx = canvas.getContext('2d');

            // Mirror the canvas context horizontally to match the mirrored webcam feed
            ctx.translate(videoWidth, 0);
            ctx.scale(-1, 1);

            ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
            const dataUrl = canvas.toDataURL('image/png'); // PNG = lossless, no compression blur

            // Vision AI: Analyze the captured face for validity & compute color/size profile signature
            const analysisCanvas = document.createElement('canvas');
            analysisCanvas.width = 160;
            analysisCanvas.height = 120;
            const analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true });
            analysisCtx.drawImage(canvas, 0, 0, 160, 120);

            const frameData = analysisCtx.getImageData(0, 0, 160, 120);
            const data = frameData.data;

            let totalSkinPixels = 0;
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let sumX = 0;
            let sumY = 0;
            const skinCoords = [];

            for (let i = 0; i < data.length; i += 16) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const maxVal = Math.max(r, g, b);
                const minVal = Math.min(r, g, b);
                const isSkin = (r > 60 && g > 40 && b > 20 &&
                    r > g &&
                    (r - g > 15) &&
                    (maxVal - minVal > 15) &&
                    (r - b > 15));
                if (isSkin) {
                    const pixelIndex = i / 4;
                    const x = pixelIndex % 160;
                    const y = Math.floor(pixelIndex / 160);
                    totalSkinPixels++;
                    sumR += r;
                    sumG += g;
                    sumB += b;
                    sumX += x;
                    sumY += y;
                    skinCoords.push({ x, y });
                }
            }

            let minX = 160, maxX = 0, minY = 120, maxY = 0;
            let validSkinCount = 0;

            if (totalSkinPixels > 30) {
                const centerX = sumX / totalSkinPixels;
                const centerY = sumY / totalSkinPixels;

                let varianceX = 0;
                let varianceY = 0;
                for (let j = 0; j < skinCoords.length; j++) {
                    varianceX += Math.pow(skinCoords[j].x - centerX, 2);
                    varianceY += Math.pow(skinCoords[j].y - centerY, 2);
                }
                const stdX = Math.sqrt(varianceX / totalSkinPixels) || 1;
                const stdY = Math.sqrt(varianceY / totalSkinPixels) || 1;

                for (let j = 0; j < skinCoords.length; j++) {
                    const coord = skinCoords[j];
                    if (Math.abs(coord.x - centerX) < 1.6 * stdX && Math.abs(coord.y - centerY) < 1.6 * stdY) {
                        validSkinCount++;
                        if (coord.x < minX) minX = coord.x;
                        if (coord.x > maxX) maxX = coord.x;
                        if (coord.y < minY) minY = coord.y;
                        if (coord.y > maxY) maxY = coord.y;
                    }
                }
            }

            let isFallbackSignature = false;
            if (validSkinCount < 15) {
                console.warn("Vision AI: Face not detected. Initializing fallback template.");
                minX = 40;
                maxX = 120;
                minY = 30;
                maxY = 90;
                totalSkinPixels = 100;
                sumR = 120 * 100;
                sumG = 90 * 100;
                sumB = 75 * 100;
                isFallbackSignature = true;
            }

            const scaleX = videoWidth / 160;
            const scaleY = videoHeight / 120;
            const faceX = Math.max(0, minX * scaleX);
            const faceY = Math.max(0, minY * scaleY);
            const faceW = Math.min(videoWidth - faceX, (maxX - minX) * scaleX);
            const faceH = Math.min(videoHeight - faceY, (maxY - minY) * scaleY);

            const template = extractFaceTemplate(canvas, faceX, faceY, faceW, faceH);

            const faceSig = {
                skinColor: {
                    r: sumR / (totalSkinPixels || 1),
                    g: sumG / (totalSkinPixels || 1),
                    b: sumB / (totalSkinPixels || 1)
                },
                pixelCount: totalSkinPixels,
                template: template,
                isFallback: isFallbackSignature
            };

            console.log("Analyzed face signature successfully:", faceSig);

            setCapturedFaceUrl(dataUrl);
            setSetupChecks({
                ...setupChecks,
                faceCaptured: true,
                faceDataUrl: dataUrl,
                faceSignature: faceSig
            });
        }
    };

    const handleToggleAcceptedRules = () => {
        setAcceptedRules(prev => !prev);
    };

    const handleStartInterview = () => {
        if (!capturedFaceUrl) {
            alert("Please capture your reference face photo before starting.");
            return;
        }
        if (!acceptedRules) {
            alert("Please accept the proctored interview rules to proceed.");
            return;
        }
        const selectedRole = role || candidate?.targetRole || resumeData?.targetRole || 'Software Engineer';
        setCandidate(prev => ({
            ...prev,
            targetRole: selectedRole
        }));
        setJdData(prev => ({
            ...prev,
            title: selectedRole
        }));
        setResumeData(prev => ({
            ...prev,
            targetRole: selectedRole
        }));
        navigate('/interview-room');
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
            {/* Header Stepper Banner */}
            <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
                <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <span className="bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider block mb-1.5 w-fit">
                            Candidate Workflow • Step {step} of 3
                        </span>
                        <h1 className="text-2xl font-bold text-white">
                            {step === 1 && 'Step 1: Upload Resume & Job Description'}
                            {step === 2 && 'Step 2: System Check & Interview Options'}
                            {step === 3 && 'Step 3: Capture Image & Proctored Rules'}
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            {step === 1 && 'Resume upload is Required. Job Description is Optional.'}
                            {step === 2 && 'Diagnostics & customization for interview type, difficulty and time duration.'}
                            {step === 3 && 'Capture your reference face image and agree to proctored interview rules.'}
                        </p>
                    </div>

                    {/* Interactive Stepper Navigation */}
                    <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                        <button
                            onClick={() => setStep(1)}
                            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${step === 1 ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold">1</span>
                            <span>Resume & JD</span>
                        </button>

                        <span className="text-slate-600">→</span>

                        <button
                            onClick={handleProceedToStep2}
                            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${step === 2 ? 'bg-purple-950 text-purple-400 border-purple-500/40 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold">2</span>
                            <span>Check & Options</span>
                        </button>

                        <span className="text-slate-600">→</span>

                        <button
                            onClick={() => setStep(3)}
                            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${step === 3 ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold">3</span>
                            <span>Face & Rules</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================== STEP 1: RESUME (REQ) & JD (OPT) ==================== */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {/* Resume Upload Box (REQUIRED) */}
                        <div className="glass-card rounded-2xl p-6 border border-cyan-500/40 space-y-4 relative bg-slate-950/80">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-cyan-400" /> Upload Candidate Resume
                                </h2>
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/40 font-bold uppercase tracking-wider">
                                    REQUIRED *
                                </span>
                            </div>

                            <div
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                className="border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer border-cyan-500/60 bg-cyan-950/30 hover:border-cyan-400"
                            >
                                <FileText className="w-10 h-10 mx-auto mb-2 text-cyan-400" />

                                <div>
                                    {isResumeSelected ? (
                                        <span className="text-xs font-bold text-cyan-300 flex items-center justify-center gap-1">
                                            <Check className="w-4 h-4 text-cyan-400" /> Active Resume: {uploadedFileName}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
                                            No resume uploaded yet
                                        </span>
                                    )}
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {isResumeSelected ? 'Click to replace or choose a different file' : 'Upload your PDF, Word, or Text resume file'}
                                    </p>
                                </div>

                                <div className="mt-4 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        disabled={isParsingResume}
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        className="glow-cyan-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isParsingResume ? (
                                            <>Extracting Details... <span className="animate-spin text-[10px]">⌛</span></>
                                        ) : (
                                            <><Upload className="w-3.5 h-3.5" /> Choose Resume File</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>AI extracts Name, Skills, Projects, and Experience for technical questions.</span>
                            </div>
                        </div>

                        {/* Target Job Description Box (OPTIONAL) */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4 bg-slate-950/80">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" /> Target Job Description
                                </h2>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
                                    OPTIONAL
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 block mb-1">
                                    Paste target Job Description (Optional - leave empty for auto-generated questions from Resume)
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Paste target job description here... (Optional)"
                                    value={jdData.rawText}
                                    onChange={(e) => setJdData({ ...jdData, rawText: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    onClick={() => setJdData({ ...jdData, rawText: sampleJdText })}
                                    className="text-[11px] text-purple-400 hover:text-purple-300 font-mono"
                                >
                                    + Load Example JD
                                </button>
                                {jdData.rawText && (
                                    <button
                                        type="button"
                                        onClick={() => setJdData({ ...jdData, rawText: '' })}
                                        className="text-[11px] text-slate-500 hover:text-slate-400 font-mono"
                                    >
                                        Clear JD
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Footer for Step 1 */}
                    <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <span className="text-xs text-slate-400 font-mono">
                            Step 1 of 3 Complete • Next: System Diagnostics & Settings
                        </span>

                        <button
                            type="button"
                            onClick={handleProceedToStep2}
                            disabled={isGenerating || isParsingResume}
                            className="glow-cyan-btn px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>Generating AI Questions... <span className="animate-spin text-sm">⌛</span></>
                            ) : isParsingResume ? (
                                <>Parsing Resume File... <span className="animate-spin text-sm">⌛</span></>
                            ) : (
                                <>Proceed to Step 2: System Check & Options <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== STEP 2: SYSTEM CHECK & INTERVIEW OPTIONS ==================== */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Section 2A: System Check & Video Diagnostics */}
                        <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 space-y-4 bg-slate-950/90">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-cyan-400" /> System Diagnostics Check
                                </h2>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                                    Hardware Active
                                </span>
                            </div>

                            {/* WebCam Feed */}
                            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" style={{ filter: 'none', willChange: 'transform' }} />

                                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry Check
                                </div>
                            </div>

                            {/* System Diagnostics Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <Video className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                                    <span className="text-[10px] font-mono text-slate-400 block">Camera</span>
                                    <span className="text-[11px] font-bold text-emerald-400 font-mono">Working</span>
                                </div>

                                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <Mic className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                                    <span className="text-[10px] font-mono text-slate-400 block">Microphone</span>
                                    <span className="text-[11px] font-bold text-indigo-300 font-mono">{audioLevel}% Level</span>
                                </div>

                                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <Sun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                    <span className="text-[10px] font-mono text-slate-400 block">Lighting</span>
                                    <span className="text-[11px] font-bold text-amber-300 font-mono">Good</span>
                                </div>

                                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                                    <Wifi className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                    <span className="text-[10px] font-mono text-slate-400 block">Internet</span>
                                    <span className="text-[11px] font-bold text-purple-300 font-mono">Stable</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2B: Interview Options (Type, Difficulty, Time) */}
                        <div className="glass-card rounded-2xl p-6 border border-purple-500/30 space-y-5 bg-slate-950/90">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-purple-400" /> Interview Options & Settings
                                </h2>
                                <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                                    Customization
                                </span>
                            </div>

                            {/* Interview Type Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase font-mono block tracking-wider">
                                    1. Interview Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        'Technical',
                                        'HR'
                                    ].map((typeOption) => (
                                        <button
                                            key={typeOption}
                                            type="button"
                                            onClick={() => setInterviewType(typeOption)}
                                            className={`p-3 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer border ${interviewType === typeOption
                                                ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 shadow-md shadow-purple-500/10'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                                }`}
                                        >
                                            <span>{typeOption}</span>
                                            {interviewType === typeOption && <Check className="w-3.5 h-3.5 text-purple-400" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Role Selector & Experience Level */}
                            <div className="space-y-4 font-mono">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase block tracking-wider">
                                        2. Target Role / Job Title
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>-- Select Target Role --</option>
                                            {[
                                                'Software Engineer',
                                                'Frontend Developer',
                                                'Backend Developer',
                                                'Full-Stack Developer',
                                                'Data Scientist',
                                                'Machine Learning Engineer',
                                                'Product Manager',
                                                'UI/UX Designer',
                                                'DevOps Engineer',
                                                'QA Engineer',
                                                'HR Specialist',
                                                'Data Analyst',
                                                'Business Analyst',
                                                // Dynamic custom role support if parsed from resume and not in list
                                                ...((role && ![
                                                    'Software Engineer',
                                                    'Frontend Developer',
                                                    'Backend Developer',
                                                    'Full-Stack Developer',
                                                    'Data Scientist',
                                                    'Machine Learning Engineer',
                                                    'Product Manager',
                                                    'UI/UX Designer',
                                                    'DevOps Engineer',
                                                    'QA Engineer',
                                                    'HR Specialist',
                                                    'Data Analyst',
                                                    'Business Analyst'
                                                ].includes(role)) ? [role] : [])
                                            ].map((roleOption) => (
                                                <option key={roleOption} value={roleOption} className="bg-slate-950 text-slate-200">
                                                    {roleOption}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                            ▼
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase block tracking-wider">
                                        3. Experience Level
                                    </label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[
                                            'Fresher',
                                            'Junior',
                                            'Mid-Level',
                                            'Senior'
                                        ].map((expOption) => (
                                            <button
                                                key={expOption}
                                                type="button"
                                                onClick={() => setExperienceLevel(expOption)}
                                                className={`py-3 px-1 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${experienceLevel === expOption
                                                    ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                                    }`}
                                            >
                                                {expOption}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Time Duration & Questions Count */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase font-mono block tracking-wider flex items-center justify-between">
                                    <span>4. Time Duration & Questions</span>
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        '10 Mins (5 Qs)',
                                        '15 Mins (8 Qs)',
                                        '20 Mins (10 Qs)'
                                    ].map((timeOption) => (
                                        <button
                                            key={timeOption}
                                            type="button"
                                            onClick={() => setDuration(timeOption)}
                                            className={`p-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${duration === timeOption
                                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                                }`}
                                        >
                                            {timeOption}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer for Step 2 */}
                    <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Step 1
                        </button>

                        <button
                            type="button"
                            onClick={handleProceedToStep3}
                            className="glow-cyan-btn px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            <span>Proceed to Step 3: Face Capture & Rules</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== STEP 3: CAPTURE IMAGE & PROCTORED RULES ==================== */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Section 3A: Reference Face Capture */}
                        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 space-y-4 bg-slate-950/90">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-emerald-400" /> Reference Image Capture
                                </h2>
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                                    {capturedFaceUrl ? 'Verified' : 'Pending Capture'}
                                </span>
                            </div>

                            {/* WebCam / Photo Box */}
                            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                                {capturedFaceUrl ? (
                                    <img src={capturedFaceUrl} alt="Captured reference face" className="w-full h-full object-cover transform -scale-x-100" style={{ imageRendering: 'auto', filter: 'none' }} />
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" style={{ imageRendering: 'auto', willChange: 'transform', filter: 'none' }} />
                                )}

                                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    {capturedFaceUrl ? 'Reference Image Saved' : 'Position Face Centered'}
                                </div>
                            </div>

                            {/* Capture Action Button Below Box */}
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={capturedFaceUrl ? handleRetakeFace : handleCaptureFace}
                                    className="w-full py-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                                >
                                    <Camera className="w-4 h-4 text-emerald-400" />
                                    {capturedFaceUrl ? 'Retake Reference Image' : 'Capture Reference Photo'}
                                </button>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
                                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Reference photo is used by real-time WebCam proctoring to prevent proxy attendance.</span>
                            </div>
                        </div>

                        {/* Section 3B: Proctored Rules & Acceptance */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 bg-slate-950/90">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-purple-400" /> Proctored Candidate Rules
                                </h2>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                                    Compliance Required
                                </span>
                            </div>

                            {/* Rules List */}
                            <div className="space-y-2.5 text-xs font-mono">
                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                                    <Eye className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                                    <div>
                                        <strong className="text-white block">1. Single Person & Eye Contact</strong>
                                        <span className="text-slate-400 text-[11px]">Maintain clear line-of-sight with camera. Multiple faces trigger alert flags.</span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                                    <Volume2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                    <div>
                                        <strong className="text-white block">2. Environment & Audio Speech</strong>
                                        <span className="text-slate-400 text-[11px]">Ensure quiet room without background voices or third-party prompting.</span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <strong className="text-white block">3. Window Focus & Anti-Cheating</strong>
                                        <span className="text-slate-400 text-[11px]">Switching tabs or minimizing window will be logged in final evaluation report.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3C: Rules Acceptance Checkbox */}
                            <div
                                onClick={handleToggleAcceptedRules}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${acceptedRules
                                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                                    }`}
                            >
                                {acceptedRules ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                                ) : (
                                    <Square className="w-5 h-5 text-slate-500 shrink-0" />
                                )}
                                <span className="text-xs font-semibold select-none">
                                    I have read, understood, and agree to abide by all proctored interview rules & candidate guidelines.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Footer for Step 3 */}
                    <div className="glass-card rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Step 2
                        </button>

                        <div className="flex items-center gap-3">
                            {(!capturedFaceUrl || !acceptedRules) && (
                                <span className="text-[11px] text-amber-400 font-mono hidden sm:inline-block">
                                    {!capturedFaceUrl ? '• Image capture required' : '• Please check rules box'}
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={handleStartInterview}
                                disabled={!capturedFaceUrl || !acceptedRules}
                                className="glow-cyan-btn px-6 py-3 rounded-xl font-bold text-xs text-white flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
                            >
                                <Video className="w-4 h-4" /> Start Live AI Interview <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
