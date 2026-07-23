import React, { useState, useEffect, useRef } from "react";
import { UltravoxSession } from "ultravox-client";
import { useNavigate } from "react-router-dom";

function Interview() {

    const navigate = useNavigate();

    const sessionRef = useRef(null);

    const [started, setStarted] = useState(false);
    const [status, setStatus] = useState("Not Connected");
    const [timeLeft, setTimeLeft] = useState(600);
    const [transcript, setTranscript] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const interviewEnded = useRef(false);
    

    useEffect(() => {

        if (!started) return;

        const timer = setInterval(() => {

            setTimeLeft((prev) => {

                if (prev <= 1) {

                    clearInterval(timer);

                    endInterview();

                    return 0;
                }

                return prev - 1;

            });

        }, 1000);

        return () => clearInterval(timer);

    }, [started, navigate]);

    const formatTime = () => {

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

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
                transcript
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

if (lastUserMessage) {
    setCandidateAnswer(lastUserMessage.text);
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
    <div className="min-h-screen bg-gray-100 px-6 py-10">

        <div className="max-w-5xl mx-auto">

            <h1 className="text-4xl font-bold text-blue-600">
                AI Mock Interview
            </h1>

            <p className="text-gray-600 mt-2">
                SmartHire AI Voice Interview
            </p>

            {!started ? (

                <div className="bg-white rounded-2xl shadow-lg p-10 mt-8 text-center">

                    <div className="text-7xl">
                        🤖
                    </div>

                    <h2 className="text-3xl font-bold mt-6">
                        Ready for your AI Interview?
                    </h2>

                    <p className="text-gray-600 mt-4">
                        Ultravox will conduct your interview based on your resume.
                    </p>

                    <button
                        onClick={startInterview}
                        className="mt-8 bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700"
                    >
                        🚀 Start Interview
                    </button>

                </div>

            ) : (

                <div className="grid lg:grid-cols-3 gap-6 mt-10">

                    <div className="bg-white rounded-xl shadow p-6 text-center">

                        <div className="text-7xl">
                            🤖
                        </div>

                        <h2 className="text-2xl font-bold mt-5">
                            SmartHire AI
                        </h2>

                        <p className="text-green-600 mt-3 font-semibold">
                            ● {status}
                        </p>

                        <p className="text-red-500 text-3xl font-bold mt-8">
                            ⏱ {formatTime()}
                        </p>

                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow p-8">

                        <h2 className="text-3xl font-bold">
                            Interview in Progress
                        </h2>

                        <div className="mt-6">

                            <h3 className="text-xl font-semibold text-blue-600">
                                Current Question
                            </h3>

                            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-5">
                                <p className="text-gray-800 text-lg leading-8">
                                    {currentQuestion || "Waiting for AI to ask the first question..."}
                                </p>
                            </div>

                            <p className="mt-6 text-lg text-gray-700">
                                🎤 Listening...
                            </p>

                        </div>

                        <p className="mt-3 text-gray-500">
                            Please answer naturally. The AI interviewer will ask
                            follow-up questions based on your responses.
                        </p>

                        <button
                            onClick={endInterview}
                            className="mt-10 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl"
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