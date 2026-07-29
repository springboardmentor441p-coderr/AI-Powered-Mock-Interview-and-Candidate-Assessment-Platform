import { motion } from "framer-motion";
import AIAvatar from "../components/interview/AIAvatar";
import StatusBadge from "../components/interview/StatusBadge";
import TimerCard from "../components/interview/TimerCard";
import QuestionCard from "../components/interview/QuestionCard";
import TranscriptPanel from "../components/interview/TranscriptPanel";
import InterviewTips from "../components/interview/InterviewTips";
import VoiceAnimation from "../components/interview/VoiceAnimation";
import React, { useState, useEffect, useRef } from "react";
import { UltravoxSession } from "ultravox-client";
import { useNavigate } from "react-router-dom";

function Interview() {

    const navigate = useNavigate();

    const sessionRef = useRef(null);

    const [started, setStarted] = useState(false);
    const [status, setStatus] = useState("Not Connected");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const interviewEnded = useRef(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const transcriptRef = useRef("");
    const totalQuestions = 15;
    

    useEffect(() => {

    if (!started) return;

    const timer = setInterval(() => {

        setElapsedTime((prev) => prev + 1);

    }, 1000);

    return () => clearInterval(timer);

}, [started]);

    const formatTime = () => {

    const minutes = Math.floor(elapsedTime / 60);

    const seconds = elapsedTime % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};


const endInterview = async () => {

    if (interviewEnded.current) return;

    interviewEnded.current = true;


    if (sessionRef.current) {
        await sessionRef.current.leaveCall();
    }


    const response = await fetch(
        "http://127.0.0.1:5000/save-interview",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
           body: JSON.stringify({
    email: localStorage.getItem("candidateEmail"),
    transcript: transcriptRef.current
})
        }
    );


    const result = await response.json();

    console.log(result);


    navigate("/evaluating");

};
    const startInterview = async () => {

        try {

            const email = localStorage.getItem("candidateEmail");

            const response = await fetch(
                "http://127.0.0.1:5000/ultravox/session",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Unable to start interview.");
                return;
            }

            const session = new UltravoxSession();

            sessionRef.current = session;

           session.addEventListener("status", () => {

    console.log(session.status);

    setStatus(session.status);


    if (
        session.status === "disconnected" &&
        !interviewEnded.current
    ) {

        fetch("http://127.0.0.1:5000/update-interview-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: localStorage.getItem("candidateEmail"),
                status: "Incomplete"
            })
        });

    }

});

            session.addEventListener("transcripts", () => {

    const transcripts = session.transcripts;

    console.log(transcripts);

    const fullTranscript = transcripts
        .map(t => `${t.speaker}: ${t.text}`)
        .join("\n");

    setTranscript(fullTranscript);
    transcriptRef.current = fullTranscript;

    // Find the latest AI question
    const lastAgentMessage = [...transcripts]
        .reverse()
        .find(t => t.speaker === "agent");

    if (lastAgentMessage) {
        setCurrentQuestion(lastAgentMessage.text);
    }
const lastUserMessage = [...transcripts]
    .reverse()
    .find(t => t.speaker === "user");

if (lastAgentMessage) {
    setCurrentQuestion(lastAgentMessage.text);

    setCurrentQuestionIndex(prev => {
        if (prev < totalQuestions - 1) {
            return prev + 1;
        }
        return prev;
    });
}
    // End interview when AI finishes
    if (lastAgentMessage) {

        const text = lastAgentMessage.text.toLowerCase();

        if (
            text.includes("thank you for your time") ||
            text.includes("it was a pleasure speaking with you") ||
            text.includes("have a great day") ||
            text.includes("goodbye") ||
            text.includes("interview is complete") ||
            text.includes("interview has ended") ||
            text.includes("we have completed")
        ) {

            setTimeout(() => {
                endInterview();
            }, 3000);
        }
    }
});

            await session.joinCall(data.joinUrl);
await fetch("http://127.0.0.1:5000/update-interview-status", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        email: localStorage.getItem("candidateEmail"),
        status: "Interview Started"
    })
});
            setStarted(true);

        } catch (err) {

            console.log(err);

            alert("Unable to connect to Ultravox.");

        }

    };

    
   return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">

    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-10"
      >

        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            AI Mock Interview
          </h1>

          <p className="text-gray-500 mt-2">
            SmartHire AI Voice Interview Platform
          </p>
        </div>

        {started && <StatusBadge status={status} />}

      </motion.div>


      {!started ? (

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-16 text-center"
        >

          <AIAvatar />

          <h2 className="text-4xl font-bold mt-8">
            Ready to Begin?
          </h2>

          <p className="text-gray-600 text-lg mt-5 max-w-2xl mx-auto">

            SmartHire AI will conduct a personalized voice interview
            based on your uploaded resume. Answer naturally and
            confidently.

          </p>


          <button
            onClick={startInterview}
            className="
              mt-10 
              bg-blue-600 
              hover:bg-blue-700 
              text-white 
              px-10 
              py-4 
              rounded-2xl 
              text-lg 
              font-semibold 
              transition
            "
          >
            Start AI Interview
          </button>

        </motion.div>


      ) : (

        <div className="grid lg:grid-cols-12 gap-8">


          {/* LEFT PANEL */}
          <div className="lg:col-span-3 space-y-6">

            <AIAvatar />

            <TimerCard
              time={formatTime()}
            />

            <VoiceAnimation />

            

          </div>



          {/* CENTER PANEL */}
          <div className="lg:col-span-6 space-y-6">


            <QuestionCard
              question={currentQuestion}
            />


            <TranscriptPanel
              transcript={transcript}
            />


          </div>




          {/* RIGHT PANEL */}
          <div className="lg:col-span-3 space-y-6">


            <InterviewTips />



            {/* Question Progress */}

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <h3 className="font-semibold text-gray-800 mb-4">
                Interview Progress
              </h3>


              <div className="w-full bg-gray-200 rounded-full h-3">

                <div
                  className="
                    bg-blue-600 
                    h-3 
                    rounded-full 
                    transition-all 
                    duration-500
                  "
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / totalQuestions) * 100
                    }%`
                  }}
                />

              </div>


              <p className="text-sm text-gray-500 mt-3 text-center">

                Question {currentQuestionIndex + 1} of {totalQuestions}

              </p>


            </div>



            <button
              onClick={endInterview}
              className="
                w-full
                bg-red-600
                hover:bg-red-700
                text-white
                py-4
                rounded-2xl
                font-semibold
                transition
              "
            >
              End Interview
            </button>


          </div>


        </div>

      )}


    </div>

  </div>
);
}
export default Interview;