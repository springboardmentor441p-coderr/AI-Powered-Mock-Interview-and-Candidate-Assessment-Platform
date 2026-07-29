import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Results() {

    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchResult = async () => {

            try {

                const email = localStorage.getItem("candidateEmail");

                const response = await fetch(
                    `http://localhost:5000/candidate-results/${email}`
                );

                const data = await response.json();

                console.log("Candidate Result:", data);

                setResult(data);

            } catch (err) {

                console.log(err);

            } finally {

                setLoading(false);

            }

        };

        fetchResult();

    }, []);

    const downloadReport = () => {

        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("SmartHire AI", 70, 20);

        doc.setFontSize(16);
        doc.text("Candidate Interview Report", 55, 32);

        autoTable(doc, {

            startY: 45,

            head: [["Field", "Value"]],

            body: [

                ["Candidate Email", result.email],

                ["Interview Date", result.date],

                ["Overall Score", `${result.overall_score}/100`],

                ["Technical Score", `${result.technical_score}/100`],

                ["Communication Score", `${result.communication_score}/100`],

                ["Recommendation", result.recommendation],

                ["Recruiter Decision", result.recruiter_status],

                ["Reason", result.recommendation_reason],

                ["AI Feedback", result.overall_feedback]

            ]

        });

        doc.save("SmartHire_Report.pdf");

    };

    if (loading) {

        return (

            <div className="min-h-screen flex justify-center items-center">

                <h1 className="text-3xl font-bold">
                    Loading Results...
                </h1>

            </div>

        );

    }

    if (!result || result.error) {

        return (

            <div className="min-h-screen flex justify-center items-center">

                <h1 className="text-3xl text-red-600 font-bold">
                    No Interview Results Found
                </h1>

            </div>

        );

    }
        return (

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">

            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* Header */}

                <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">

                    <h1 className="text-4xl font-bold text-blue-700">

                        SmartHire AI Assessment Report

                    </h1>

                    <p className="text-gray-500 mt-3">

                        Your AI-powered interview evaluation is complete.

                    </p>

                </div>



                {/* Candidate Information */}

                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

                    <h2 className="text-2xl font-bold mb-6">

                        Candidate Information

                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">

                        <div>

                            <p className="text-gray-500">

                                Email

                            </p>

                            <h3 className="text-xl font-semibold">

                                {result.email}

                            </h3>

                        </div>

                        <div>

                            <p className="text-gray-500">

                                Interview Date

                            </p>

                            <h3 className="text-xl font-semibold">

                                {result.date}

                            </h3>

                        </div>

                    </div>

                </div>



                {/* Scores */}

                <div className="grid md:grid-cols-3 gap-6 mb-8">

                    <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

                        <p className="text-gray-500">

                            Overall Score

                        </p>

                        <h1 className="text-6xl font-bold text-blue-700 mt-3">

                            {result.overall_score * 10}/100

                        </h1>

                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

                        <p className="text-gray-500">

                            Technical Score

                        </p>

                        <h1 className="text-6xl font-bold text-green-600 mt-3">

                            {result.technical_score * 10}/100

                        </h1>

                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

                        <p className="text-gray-500">

                            Communication Score

                        </p>

                        <h1 className="text-6xl font-bold text-purple-600 mt-3">

                            {result.communication_score * 10}/100

                        </h1>

                    </div>

                </div>



                {/* AI Feedback */}

                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

                    <h2 className="text-2xl font-bold mb-5">

                        AI Feedback

                    </h2>

                    <p className="text-gray-700 leading-8">

                        {result.overall_feedback}

                    </p>

                </div>



                {/* Recommendation */}

                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

                    <h2 className="text-2xl font-bold mb-5">

                        AI Recommendation

                    </h2>

                    <span

                        className={`px-5 py-3 rounded-full font-bold text-lg ${

                            result.recommendation === "Recommended"

                                ? "bg-green-100 text-green-700"

                                : "bg-red-100 text-red-700"

                        }`}

                    >

                        {result.recommendation}

                    </span>

                    <p className="mt-6 text-gray-700 leading-8">

                        {result.recommendation_reason}

                    </p>

                </div>
                                {/* Recruiter Decision */}

                <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">

                    <h2 className="text-2xl font-bold mb-6">

                        Recruiter Decision

                    </h2>

                    <div className="flex items-center gap-5">

                        {result.recruiter_status === "Shortlisted" && (

                            <span className="px-6 py-3 rounded-full bg-green-100 text-green-700 font-bold text-lg">

                                ✅ Shortlisted

                            </span>

                        )}

                        {result.recruiter_status === "Rejected" && (

                            <span className="px-6 py-3 rounded-full bg-red-100 text-red-700 font-bold text-lg">

                                ❌ Rejected

                            </span>

                        )}

                        {result.recruiter_status === "Pending" && (

                            <span className="px-6 py-3 rounded-full bg-yellow-100 text-yellow-700 font-bold text-lg">

                                ⏳ Pending Recruiter Review

                            </span>

                        )}

                    </div>

                    <p className="mt-5 text-gray-600">

                        This status is updated automatically by the recruiter after reviewing your interview performance.

                    </p>

                </div>



                {/* Action Buttons */}

                <div className="bg-white rounded-3xl shadow-lg p-8">

                    <div className="flex flex-wrap justify-center gap-5">

                        <button
                            onClick={downloadReport}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-semibold transition"
                        >
                            📄 Download Report
                        </button>

                        <button
                            onClick={() => navigate("/dashboard")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition"
                        >
                            Dashboard
                        </button>

                        <button
                            onClick={() => navigate("/interview")}
                            className="bg-gray-800 hover:bg-black text-white px-8 py-4 rounded-2xl font-semibold transition"
                        >
                            Retake Interview
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Results;