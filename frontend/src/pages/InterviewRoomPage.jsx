import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, Volume2, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, VolumeX, Bot, User, MessageSquare, PhoneOff, Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import AudioWaveform from '../components/AudioWaveform';
import { submitQuestionAnswer, finishInterviewSession } from '../services/api';

export default function InterviewRoomPage({ sessionData, setActivePage, setFinalReport }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [candidateAnswersList, setCandidateAnswersList] = useState([]);
  const chatScrollRef = useRef(null);

  // DYNAMIC LIVE TELEMETRY BARS
  const [telemetry, setTelemetry] = useState({
    eyeContactPct: 91,
    attentionPct: 96,
    confidencePct: 85,
    presencePct: 98,
    emotion: 'Focused & Confident'
  });

  const recognitionRef = useRef(null);

  const activeDomain = sessionData?.domain || sessionData?.category || "Python Developer";
  const activeDifficulty = sessionData?.difficulty || "Medium";

  // COMPREHENSIVE 5-QUESTION ADAPTIVE BANKS PER ROLE & DIFFICULTY
  const domainQuestionsBank = {
    "Python Developer": {
      "Easy": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. To get started, please introduce yourself and summarize your experience writing Python code.",
          sample_answer: "Hello AIRA! I am Janitha Kavuturu. I am a Python developer with experience writing clean Python scripts, working with data structures like lists and dictionaries, and building web applications."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Lists vs Tuples)",
          question_text: "What is the key difference between Python Lists and Tuples, and when would you use a Dictionary?",
          sample_answer: "Lists are mutable and defined with square brackets, while Tuples are immutable and defined with parentheses. Dictionaries store key-value pairs for fast lookups."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Python Dictionaries)",
          question_text: "How do Python Dictionaries work, and how do you retrieve values safely using get()?",
          sample_answer: "Dictionaries store key-value pairs indexed by hashable keys. The get() method returns a default value if a key doesn't exist without raising KeyError."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Control Flow & Loops)",
          question_text: "What is the difference between range() and enumerate() when iterating through lists in a for loop?",
          sample_answer: "range() generates numbers, whereas enumerate() yields both index numbers and item values simultaneously during iteration."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (List Comprehensions)",
          question_text: "Explain what List Comprehension is in Python and why it is useful.",
          sample_answer: "List comprehension offers a compact one-line syntax to filter and transform iterables, like [x for x in numbers if x % 2 == 0]."
        }
      ],
      "Medium": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your Medium-level Python interview! Please introduce yourself, your experience with OOP, and your core projects.",
          sample_answer: "Hello AIRA! I am Janitha Kavuturu. I build Python applications using object-oriented principles, modular packages, and FastAPI backend frameworks."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (OOP & Decorators)",
          question_text: "What is a Python Decorator, and how does @classmethod differ from @staticmethod in a class?",
          sample_answer: "Decorators wrap functions to extend behavior. @classmethod receives cls as first argument, while @staticmethod behaves like a regular function without self or cls."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Generators & Memory)",
          question_text: "How do Python Generators using yield save memory compared to returning regular lists?",
          sample_answer: "Generators evaluate items lazily one at a time using yield iterators, keeping memory consumption low O(1) compared to loading large lists into RAM."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Exception Handling)",
          question_text: "How do try-except-else-finally blocks work when handling resource cleanups?",
          sample_answer: "try runs code, except catches errors, else executes if no exceptions occur, and finally ALWAYS runs to release open file/DB handles."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Context Managers)",
          question_text: "Explain how the 'with' statement works under the hood using __enter__ and __exit__ dunder methods.",
          sample_answer: "The 'with' statement invokes __enter__ to acquire resources and automatically calls __exit__ to guarantee cleanup even if exceptions occur."
        }
      ],
      "Hard": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your Senior Python interview! Introduce yourself and detail your experience with concurrency and Python internals.",
          sample_answer: "Hello AIRA! I am a senior Python engineer experienced in asyncio concurrency, GIL bottlenecks, metaprogramming, and high-throughput microservices."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Python GIL & Multi-threading)",
          question_text: "Explain how the Global Interpreter Lock (GIL) impacts CPU-bound vs I/O-bound tasks in multi-threading vs multiprocessing.",
          sample_answer: "The GIL prevents multi-threaded CPython from executing CPU-bound bytecode in parallel. CPU-bound tasks require multiprocessing, while I/O-bound tasks benefit from threading/asyncio."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Asyncio Event Loops)",
          question_text: "How does asyncio's cooperative event loop manage non-blocking socket I/O using async and await keywords?",
          sample_answer: "Asyncio runs a single-threaded event loop that pauses tasks at yield points (await) during socket I/O and context-switches to ready tasks without OS thread overhead."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Metaclasses)",
          question_text: "What is a Metaclass in Python, and how does __new__ differ from __init__ in type instantiation?",
          sample_answer: "Metaclasses are classes of classes defined by type. __new__ creates the class object in memory before creation, whereas __init__ initializes attributes after creation."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Garbage Collection & Ref Counting)",
          question_text: "How does CPython's reference counting combined with cyclical garbage collection detect reference cycles?",
          sample_answer: "CPython decrements ref counts to deallocate objects at 0, while the cyclic GC uses generation-based inspection to find unreferenceable circular clusters."
        }
      ]
    },
    "Data Structures & Algorithms (DSA)": {
      "Easy": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your DSA interview! Introduce yourself and share your knowledge of basic arrays and linked lists.",
          sample_answer: "Hello AIRA! I am Janitha Kavuturu. I have knowledge of basic data structures like Arrays, Linked Lists, Stacks, Queues, and searching algorithms."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Arrays vs Linked Lists)",
          question_text: "What is the difference between an Array and a Singly Linked List in memory layout and insertion time complexity?",
          sample_answer: "Arrays store elements in contiguous memory with O(1) index access. Linked Lists store node pointers across heap memory with O(1) head insertion."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Stack vs Queue)",
          question_text: "Explain the difference between a Stack (LIFO) and a Queue (FIFO) with real-world examples.",
          sample_answer: "Stacks use Last-In-First-Out like undo history or plate stacks. Queues use First-In-First-Out like printer jobs or ticket checkout lines."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Linear Search vs Binary Search)",
          question_text: "How does Binary Search achieve O(log N) time complexity compared to Linear Search O(N)?",
          sample_answer: "Binary search repeatedly cuts a sorted search space in half by comparing middle elements, whereas Linear search checks items sequentially."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Bubble vs Selection Sort)",
          question_text: "What is the main idea behind Bubble Sort vs Selection Sort?",
          sample_answer: "Bubble sort repeatedly swaps adjacent out-of-order pairs, while Selection sort repeatedly finds minimum elements and places them in sorted positions."
        }
      ],
      "Medium": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your Medium DSA interview! Introduce yourself and your experience with Trees, Graphs, and Hash Tables.",
          sample_answer: "Hello AIRA! I am Janitha Kavuturu. I solve algorithmic problems involving Binary Search Trees, BFS/DFS graph traversals, and dynamic programming."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Hash Collisions)",
          question_text: "How do Hash Tables resolve collisions using Separate Chaining vs Open Addressing (Linear Probing)?",
          sample_answer: "Separate Chaining stores colliding elements in bucket linked lists. Open Addressing probes consecutive array slots until an empty index is found."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (BST Search & Inorder Traversal)",
          question_text: "What are the properties of a Binary Search Tree (BST) and why does Inorder traversal yield sorted order?",
          sample_answer: "In a BST, left children are smaller than node value and right children are larger. Inorder traversal (Left-Node-Right) visits values in ascending order."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (BFS vs DFS Graphs)",
          question_text: "Compare Breadth-First Search (BFS) using Queues with Depth-First Search (DFS) using Stacks/Recursion.",
          sample_answer: "BFS explores neighbor layers level-by-level using a Queue for shortest path. DFS explores deep graph branches using Stack/Recursion."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Two Pointers & Sliding Window)",
          question_text: "How does the Two Pointers or Sliding Window technique reduce time complexity from O(N^2) to O(N)?",
          sample_answer: "Sliding Window maintains subarray states across moving left/right boundaries, avoiding redundant nested loops to achieve linear time O(N)."
        }
      ],
      "Hard": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your Advanced DSA interview! Introduce your background in Dynamic Programming, Heaps, and Graph Algorithms.",
          sample_answer: "Hello AIRA! I am an algorithm developer skilled in Dynamic Programming memoization, Min-Heaps, Dijkstra's algorithm, and Red-Black self-balancing trees."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Dijkstra's Shortest Path)",
          question_text: "Explain Dijkstra's algorithm using a Min-Heap priority queue for weighted graphs without negative edges.",
          sample_answer: "Dijkstra uses a Min-Heap to greedily extract unvisited nodes with smallest distance, relaxing outgoing neighbor edges in O((V + E) log V) time."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Dynamic Programming Memoization)",
          question_text: "How does Dynamic Programming transform exponential recursion O(2^N) into polynomial O(N) using Top-Down Memoization?",
          sample_answer: "DP identifies overlapping subproblems and optimal substructure, caching subproblem results in a lookup table to eliminate redundant recursive trees."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (AVL vs Red-Black Trees)",
          question_text: "What is the difference between AVL Trees (strict balance) and Red-Black Trees (color balance) during rotations?",
          sample_answer: "AVL trees enforce height differences <= 1 requiring frequent rotations, while Red-Black trees enforce color rules allowing faster insertions with fewer rotations."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Trie & Prefix Trees)",
          question_text: "How does a Trie data structure achieve O(L) time complexity for word prefix autocomplete lookups?",
          sample_answer: "Tries store characters in parent-child node chains indexed by string length L, enabling fast prefix match lookups independent of total dictionary size N."
        }
      ]
    },
    "AI / ML & Data Science": {
      "Easy": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your AI & Data Science interview! Introduce yourself and your experience with Python data packages.",
          sample_answer: "Hello AIRA! I am Janitha Kavuturu. I am an AI enthusiast experienced with Pandas dataframes, NumPy matrix calculations, and basic machine learning."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Supervised vs Unsupervised ML)",
          question_text: "What is the difference between Supervised Learning (Classification) and Unsupervised Learning (Clustering)?",
          sample_answer: "Supervised learning trains on labeled target output data, whereas Unsupervised learning discovers hidden patterns in unlabeled input datasets."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Overfitting vs Underfitting)",
          question_text: "How do you detect model Overfitting vs Underfitting on training and validation loss curves?",
          sample_answer: "Overfitting shows high training accuracy but poor validation accuracy. Underfitting shows poor performance on both training and test datasets."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Pandas Data Cleaning)",
          question_text: "How do you handle missing values in Pandas using dropna() vs fillna()?",
          sample_answer: "dropna() removes rows containing missing values, while fillna() replaces NaN entries with column means or medians."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Confusion Matrix)",
          question_text: "What are Precision and Recall metrics derived from a Confusion Matrix?",
          sample_answer: "Precision measures true positive accuracy among predicted positives, while Recall measures true positives retrieved out of total actual positive cases."
        }
      ],
      "Medium": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your Medium AI/ML interview! Introduce yourself, your background in model training, and RAG vector databases.",
          sample_answer: "Hello AIRA! I am a Data Scientist experienced in training Scikit-Learn models, tuning XGBoost hyper-parameters, and building RAG pipelines with ChromaDB."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (RAG Architecture)",
          question_text: "Explain how Retrieval-Augmented Generation (RAG) uses vector databases to ground LLM responses and prevent hallucinations.",
          sample_answer: "RAG converts documents into vector embeddings in ChromaDB, retrieves context via cosine similarity search, and injects context into prompts to ground LLM answers."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Random Forest vs XGBoost)",
          question_text: "Compare Bagging in Random Forest with Gradient Boosting in XGBoost.",
          sample_answer: "Random Forest builds decision trees in parallel via bootstrap aggregation. XGBoost builds trees sequentially to minimize residual errors of previous trees."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Feature Scaling)",
          question_text: "Why is Feature Scaling (StandardScaler vs MinMaxScaler) necessary for distance-based models like KNN and SVM?",
          sample_answer: "Distance-based models like KNN and SVM calculate Euclidean distances; unscaled large magnitude features dominate and distort gradient optimization."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Cross-Validation)",
          question_text: "How does K-Fold Cross-Validation prevent data leakage during train-test splitting?",
          sample_answer: "K-Fold splits data into K equal folds, training on K-1 folds and testing on the remaining fold iteratively to ensure robust out-of-sample evaluation."
        }
      ],
      "Hard": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: "Hello! My name is AIRA, your AI Interviewer. Welcome to your Senior AI/ML interview! Introduce your expertise in Transformer Self-Attention, LLM Fine-Tuning, and MLOps.",
          sample_answer: "Hello AIRA! I am a Senior AI Architect specializing in Transformer architectures, LoRA fine-tuning, Quantization, and scalable MLOps deployments."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Transformer Self-Attention)",
          question_text: "Explain scaled dot-product Self-Attention Q, K, V matrices and why Softmax scaling division by sqrt(d_k) is required.",
          sample_answer: "Self-attention computes Query-Key dot products scaled by 1/sqrt(d_k) to prevent extremely large magnitude gradients from pushing Softmax into vanishing gradient regions."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (LoRA & PEFT Fine-Tuning)",
          question_text: "How does Low-Rank Adaptation (LoRA) reduce trainable parameters during LLM fine-tuning?",
          sample_answer: "LoRA freezes pre-trained weight matrices and injects trainable rank-decomposition matrices A and B (r << d), drastically reducing memory and compute cost."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Model Quantization)",
          question_text: "What is the difference between Post-Training Quantization (PTQ) vs Quantization-Aware Training (QAT) for FP16 to INT8 conversion?",
          sample_answer: "PTQ quantizes weights after training causing slight accuracy degradation. QAT simulates quantization noise during backpropagation for near-zero loss."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Vector DB Indexing)",
          question_text: "Compare HNSW (Hierarchical Navigable Small World) with IVF-PQ (Inverted File Product Quantization) for million-scale vector search.",
          sample_answer: "HNSW builds multi-layer proximity graphs for high recall and fast search, while IVF-PQ clusters vector space and quantizes sub-vectors for low memory footprint."
        }
      ]
    }
  };

  const domainBank = domainQuestionsBank[activeDomain] || domainQuestionsBank["Python Developer"];
  const difficultyBank = domainBank[activeDifficulty] || domainBank["Medium"] || domainBank["Easy"];
  const questions = difficultyBank.slice(0, 5);
  const currentQ = questions[currentIdx] || questions[0];

  // REAL-TIME CONTINUOUS CONVERSATION THREAD CHAT HISTORY (MATCHING SCREENSHOT)
  const [chatThread, setChatThread] = useState([
    {
      id: 1,
      sender: 'INTERVIEWER',
      text: currentQ.question_text,
      type: 'interviewer'
    }
  ]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatThread, candidateAnswer]);

  // REAL PROCTORING VIOLATION HANDLER (ONLY TRIGGERS WHEN CANDIDATE ACTUALLY SWITCHES BROWSER TABS)
  const triggerProctoringViolation = (reasonText) => {
    setViolationCount(prev => {
      const nextCount = prev + 1;

      if (nextCount === 1) {
        setActivePopup({
          text: `🚨 MALPRACTICE WARNING (1/2): ${reasonText}! Return to interview room immediately.`,
          color: "bg-red-600/95 border-red-400 text-white font-bold"
        });
        setTimeout(() => setActivePopup(null), 5000);
      } else if (nextCount >= 2) {
        setActivePopup({
          text: "🚨 EXAM TERMINATED (2/2 VIOLATIONS): Session automatically cancelled due to tab switching violations.",
          color: "bg-red-700 border-red-500 text-white font-extrabold"
        });
        handleForceMalpracticeSubmit(reasonText);
      }

      return nextCount;
    });
  };

  // Tab switch listener ONLY
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerProctoringViolation("Browser Tab Switch Detected");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleForceMalpracticeSubmit = async (reasonText) => {
    stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const report = await finishInterviewSession(sessionData?.session_id || 1);
    
    const malpracticeReport = {
      ...report,
      overall_score: 35.0,
      performance_rating: "EXAM TERMINATED - Malpractice Penalty Applied",
      malpractice_flag: true,
      tab_switches: violationCount + 1,
      strengths: ["Initial webcam and microphone engagement recorded"],
      weaknesses: [`EXAM AUTO-TERMINATED: Multiple Tab Switches Recorded (${reasonText})`],
      improvement_tips: ["Do not switch browser tabs or open external windows during live proctored interviews."]
    };

    setFinalReport(malpracticeReport);
    setSubmitting(false);
    setActivePage('interview-report');
  };

  // Web Speech Synthesis (AIRA Natural Voiceover)
  const speakQuestion = (textToSpeak) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(textToSpeak || currentQ.question_text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        utterance.onstart = () => {
          setIsSpeaking(true);
          stopMicRecording();
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          startMicRecording();
        };
        
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      speakQuestion(currentQ.question_text);
    }, 400);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // CLEAN NON-LOOPING SPEECH RECOGNITION
  const startMicRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let cleanText = '';
        for (let i = 0; i < event.results.length; i++) {
          cleanText += event.results[i][0].transcript + ' ';
        }
        setCandidateAnswer(cleanText.trim());
      };

      recognition.onend = () => {
        if (isRecording && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Microphone access error:", err);
    }
  };

  const stopMicRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // REAL-TIME AI AGENT SUBMIT TURN HANDLER (BUILD CONVERSATION THREAD MATCHING SCREENSHOT)
  const handleNextQuestion = async () => {
    stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const spokenText = candidateAnswer.trim();
    const isAnswerProvided = spokenText.length > 0;
    const finalAnswerText = isAnswerProvided ? spokenText : "[No spoken answer provided]";

    // Append Candidate Answer Bubble (YOU) to Chat Thread
    const candidateBubble = {
      id: Date.now(),
      sender: 'YOU',
      text: finalAnswerText,
      type: 'candidate'
    };

    setChatThread(prev => [...prev, candidateBubble]);

    const answerEntry = {
      q_num: currentIdx + 1,
      q_text: currentQ.question_text,
      user_answer: finalAnswerText,
      sample_answer: currentQ.sample_answer,
      is_answered: isAnswerProvided
    };

    const updatedAnswers = [...candidateAnswersList, answerEntry];
    setCandidateAnswersList(updatedAnswers);

    await submitQuestionAnswer({
      session_id: sessionData?.session_id || 1,
      question_index: currentIdx + 1,
      question_text: currentQ.question_text,
      candidate_answer: finalAnswerText,
      transcript: finalAnswerText,
      eye_contact_ratio: telemetry.eyeContactPct / 100.0
    });

    setCandidateAnswer('');
    
    if (currentIdx < 4) {
      const nextQObj = questions[currentIdx + 1];
      let prefixPraise = "";

      if (!isAnswerProvided) {
        prefixPraise = "I notice you didn't speak an answer for that question. Please make sure to speak your answer aloud into your microphone! Moving on to our next question: ";
      } else if (spokenText.split(' ').length < 5) {
        prefixPraise = "Thanks for that brief response! Let's build further on that. Next question: ";
      } else {
        prefixPraise = "That's a solid explanation! Great realization to have. Now for our next question: ";
      }

      const nextInterviewerText = `${prefixPraise}${nextQObj.question_text}`;

      // Append Next Interviewer Question Bubble (INTERVIEWER) to Chat Thread
      setTimeout(() => {
        const interviewerBubble = {
          id: Date.now() + 1,
          sender: 'INTERVIEWER',
          text: nextInterviewerText,
          type: 'interviewer'
        };
        setChatThread(prev => [...prev, interviewerBubble]);
        speakQuestion(nextInterviewerText);
      }, 400);

      setCurrentIdx(prev => prev + 1);
      setSubmitting(false);
    } else {
      const report = await finishInterviewSession(sessionData?.session_id || 1);
      
      const answeredCount = updatedAnswers.filter(a => a.is_answered).length;
      const totalWords = updatedAnswers.reduce((acc, curr) => acc + (curr.is_answered ? curr.user_answer.split(' ').length : 0), 0);
      
      let dynamicOverallScore = 50.0;
      if (answeredCount === 0) {
        dynamicOverallScore = 45.0;
      } else {
        const completionPct = (answeredCount / 5) * 50;
        const depthPct = Math.min(30, (totalWords / 5) * 1.5);
        const visionPct = (telemetry.eyeContactPct / 100) * 20;
        dynamicOverallScore = Math.min(98.5, Math.max(45.0, Math.round(completionPct + depthPct + visionPct)));
      }

      let rating = "Needs Technical Refinement";
      if (dynamicOverallScore >= 90) rating = "Outstanding Candidate (Strong Hire)";
      else if (dynamicOverallScore >= 80) rating = "Recommended Candidate (Good Hire)";
      else if (dynamicOverallScore >= 65) rating = "Passable - Needs Practice";
      else rating = "Unsatisfactory - Unanswered Questions Detected";

      const fullCustomReport = {
        ...report,
        overall_score: dynamicOverallScore,
        performance_rating: rating,
        category: activeDomain,
        difficulty: activeDifficulty,
        eye_contact_score: telemetry.eyeContactPct,
        attention_score: telemetry.attentionPct,
        confidence_score: telemetry.confidencePct,
        answers_history: updatedAnswers,
        strengths: answeredCount > 0 ? [
          `Answered ${answeredCount} out of 5 questions in ${activeDomain} (${activeDifficulty} level)`,
          `Maintained ${telemetry.eyeContactPct}% eye contact and ${telemetry.attentionPct}% attention focus`,
          `Demonstrated microphone communication across real-time AI agent turns`
        ] : [
          `Attempted 5-question proctored interview session`,
          `Webcam and microphone hardware connected successfully`
        ],
        weaknesses: answeredCount < 5 ? [
          `Candidate left ${5 - answeredCount} questions unanswered (skipped without speaking)`,
          `Ensure you speak full structured answers into your microphone for every turn`
        ] : [
          `Elaborate further on real-world memory and execution trade-offs`,
          `Provide deeper code-level execution steps during live explanations`
        ],
        improvement_tips: [
          `Make sure to speak clear answers for all 5 interview questions`,
          `Maintain high eye contact with the camera while answering technical scenario questions`
        ]
      };

      setFinalReport(fullCustomReport);
      setSubmitting(false);
      setActivePage('interview-report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 pb-20 relative bg-slate-950 min-h-screen text-slate-100 font-sans">
      
      {/* REAL-TIME AI PROCTORING WARNING TOAST */}
      {activePopup && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border ${activePopup.color} shadow-2xl backdrop-blur-xl animate-bounce flex items-center gap-3`}>
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-semibold">{activePopup.text}</span>
        </div>
      )}

      {/* ROOM TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-3 px-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Real-Time AI Interview Agent <span className="text-[10px] text-cyan-400 font-mono font-normal">• Live Conversation Stream</span>
            </h1>
            <span className="text-[11px] text-indigo-300 font-mono">
              Domain: <strong className="text-white">{activeDomain}</strong> ({activeDifficulty} Level — {currentQ.question_number})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {violationCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs font-bold flex items-center gap-1">
              🚨 Tab Switch Violations: {violationCount}/2
            </span>
          )}

          <span className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold flex items-center gap-1.5">
            ● ON AIR - {formatTimer(timerSeconds)}
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT: CENTER REAL-TIME CONVERSATION CHAT THREAD (MATCHING USER SCREENSHOT EXACTLY) + RIGHT WEBCAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CENTER MAIN PANEL: REAL-TIME AI AGENT CONVERSATION THREAD (8 COLS - MATCHING SCREENSHOT) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-950/95 h-[520px] flex flex-col justify-between shadow-2xl">
            
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Real-Time AI Agent Conversation Thread
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> AIRA AI Agent Active
              </span>
            </div>

            {/* Scrollable Conversation Chat History (Matching Screenshot Bubbles & Flow Exactly) */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto pr-3 py-4 space-y-5 font-sans text-xs"
            >
              {chatThread.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col space-y-1.5 ${
                    msg.type === 'candidate' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                    msg.type === 'candidate' ? 'text-amber-400/90 pr-2' : 'text-slate-400 pl-2'
                  }`}>
                    {msg.sender}
                  </span>
                  
                  <div className={`p-4 rounded-2xl max-w-[88%] leading-relaxed shadow-xl text-xs font-sans ${
                    msg.type === 'candidate'
                      ? 'bg-amber-950/80 border border-amber-600/40 text-amber-100 rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Real-time Candidate Spoken Transcript Preview */}
              {candidateAnswer && (
                <div className="flex flex-col items-end space-y-1.5 animate-pulse">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold pr-2">
                    YOU (SPEAKING LIVE...):
                  </span>
                  <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-100 max-w-[88%] italic">
                    "{candidateAnswer}"
                  </div>
                </div>
              )}
            </div>

            {/* Thread Footer Prompt */}
            <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 text-center shrink-0">
              {isSpeaking ? "AIRA AI Agent is speaking prompt..." : "Speak into your microphone, then click Submit Answer to send turn."}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CANDIDATE WEBCAM & DYNAMIC LIVE VISION TELEMETRY BARS (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Candidate Webcam Box */}
          <div className="relative">
            <WebcamMonitor 
              onMetricsUpdate={(m) => setTelemetry(prev => ({ ...prev, ...m }))}
            />
          </div>

          {/* DYNAMIC TELEMETRY BARS */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl bg-slate-950/90">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">Face Assessment - Live</span>
            </div>

            {/* Metric 1: Eye Contact */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">EYE CONTACT</span>
                <span className="text-purple-400 font-bold font-mono">{telemetry.eyeContactPct}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.eyeContactPct}%` }} />
              </div>
            </div>

            {/* Metric 2: Attention */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">ATTENTION</span>
                <span className="text-purple-400 font-bold font-mono">{telemetry.attentionPct}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.attentionPct}%` }} />
              </div>
            </div>

            {/* Metric 3: Engagement */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">ENGAGEMENT</span>
                <span className="text-purple-400 font-bold font-mono">{telemetry.confidencePct}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.confidencePct}%` }} />
              </div>
            </div>

            {/* Emotion Detector */}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">ℹ EMOTION</span>
              <span className="text-amber-300 font-bold font-mono flex items-center gap-1">
                🙂 {telemetry.emotion}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM CONTROL BAR */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isRecording ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}
          >
            <Mic className="w-4 h-4 text-cyan-400" /> {isRecording ? "Mute Mic" : "Unmute Mic"}
          </button>
          
          <span className="text-xs text-slate-400 font-mono">Camera: <span className="text-emerald-400 font-bold">Active</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-2"
          >
            {submitting ? "Analyzing Response..." : (
              currentIdx < 4 ? (
                <>Submit Spoken Answer & Continue Conversation <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Complete Interview & Generate Report <PhoneOff className="w-4 h-4" /></>
              )
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
