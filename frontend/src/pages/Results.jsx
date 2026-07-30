import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    const overall = result.overall_score * 10;
    const technical = result.technical_score * 10;
    const communication = result.communication_score * 10;

    const circleRadius = 80;
    const circumference = 2 * Math.PI * circleRadius;
    const offset = circumference - (overall / 100) * circumference;
        return (

        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">

            <div className="max-w-6xl mx-auto px-6 py-10">

                <motion.div

initial={{ opacity: 0, y: -30 }}

animate={{ opacity: 1, y: 0 }}

transition={{ duration: 0.7 }}

className="bg-white rounded-3xl shadow-xl p-10 mb-8"

>

<div className="flex flex-col lg:flex-row justify-between items-center">

<div>

<h1 className="text-4xl font-bold text-blue-700">

SmartHire AI Assessment Report

</h1>

<p className="text-gray-500 mt-3">

Your interview has been successfully evaluated.

</p>

</div>

<div className="relative w-52 h-52 mt-8 lg:mt-0">

<svg className="w-full h-full -rotate-90">

<circle

cx="104"

cy="104"

r={circleRadius}

stroke="#E5E7EB"

strokeWidth="12"

fill="none"

/>

<motion.circle

cx="104"

cy="104"

r={circleRadius}

stroke="#2563EB"

strokeWidth="12"

fill="none"

strokeLinecap="round"

strokeDasharray={circumference}

initial={{ strokeDashoffset: circumference }}

animate={{ strokeDashoffset: offset }}

transition={{ duration: 1.8 }}

 />

</svg>

<div className="absolute inset-0 flex flex-col justify-center items-center">

<h1 className="text-5xl font-bold text-blue-700">

{overall}

</h1>

<p className="text-gray-500">

Overall Score

</p>

</div>

</div>

</div>

</motion.div>



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



                {/* Professional Score Cards */}

<div className="grid md:grid-cols-3 gap-6 mb-8">

    {/* Overall */}

    <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 text-center"
    >

        <div className="text-5xl mb-4">
            ⭐
        </div>

        <p className="text-gray-500 font-medium">
            Overall Score
        </p>

        <h1 className="text-5xl font-bold text-blue-700 mt-3">
            {overall}/100
        </h1>

    </motion.div>

    {/* Technical */}

    <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-xl border border-green-100 p-8 text-center"
    >

        <div className="text-5xl mb-4">
            💻
        </div>

        <p className="text-gray-500 font-medium">
            Technical Score
        </p>

        <h1 className="text-5xl font-bold text-green-600 mt-3">
            {technical}/100
        </h1>

    </motion.div>

    {/* Communication */}

    <motion.div
        whileHover={{ y: -8, scale: 1.03 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8 text-center"
    >

        <div className="text-5xl mb-4">
            🗣️
        </div>

        <p className="text-gray-500 font-medium">
            Communication Score
        </p>

        <h1 className="text-5xl font-bold text-purple-600 mt-3">
            {communication}/100
        </h1>

    </motion.div>

</div>

{/* Performance Breakdown */}

<motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.7 }}
    className="bg-white rounded-3xl shadow-xl p-8 mb-8"
>

    <h2 className="text-2xl font-bold mb-8 text-gray-800">
        Performance Breakdown
    </h2>

    <div className="space-y-8">

        {/* Overall */}

        <div>

            <div className="flex justify-between mb-2">

                <span className="font-semibold text-gray-700">
                    ⭐ Overall Performance
                </span>

                <span className="font-bold text-blue-600">
                    {overall}%
                </span>

            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${overall}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                />

            </div>

        </div>

        {/* Technical */}

        <div>

            <div className="flex justify-between mb-2">

                <span className="font-semibold text-gray-700">
                    💻 Technical Knowledge
                </span>

                <span className="font-bold text-green-600">
                    {technical}%
                </span>

            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${technical}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
                />

            </div>

        </div>

        {/* Communication */}

        <div>

            <div className="flex justify-between mb-2">

                <span className="font-semibold text-gray-700">
                    🗣️ Communication Skills
                </span>

                <span className="font-bold text-purple-600">
                    {communication}%
                </span>

            </div>

            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">

                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${communication}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-700"
                />

            </div>

        </div>

    </div>

</motion.div>

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