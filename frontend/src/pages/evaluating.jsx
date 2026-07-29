import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Evaluating() {

    const navigate = useNavigate();

    useEffect(() => {

    const timer = setTimeout(() => {

        const email = localStorage.getItem("candidateEmail");

        console.log("Candidate Email:", email);

        if (email) {

    console.log("Navigating to:", `/interview-results`);

    navigate("/results");

} else {

    console.error("Candidate email not found");

}

    }, 4000);

    return () => clearTimeout(timer);

}, [navigate]);

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white p-12 rounded-2xl shadow-xl text-center">

                <div className="text-7xl animate-pulse">
                    🤖
                </div>

                <h1 className="text-3xl font-bold mt-6">
                    AI is evaluating your interview...
                </h1>

                <p className="text-gray-600 mt-4">
                    Please wait while SmartHire analyzes your answers.
                </p>

                <div className="mt-8">

                    <div className="w-72 h-3 bg-gray-200 rounded-full overflow-hidden">

                        <div className="h-full bg-blue-600 animate-pulse w-full"></div>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Evaluating;