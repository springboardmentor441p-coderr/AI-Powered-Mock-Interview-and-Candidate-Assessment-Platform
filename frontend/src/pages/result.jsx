import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Results() {

    const [result, setResult] = useState(null);

    useEffect(() => {

        fetch("http://127.0.0.1:5000/interview-results")
            .then((res) => res.json())
            .then((data) => {
                setResult(data);
            })
            .catch((err) => {
                console.log(err);
            });

    }, []);

    if (!result) {

        return (
            <div className="text-center mt-20 text-2xl">
                Loading Results...
            </div>
        );

    }
const downloadReport = () => {

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("SmartHire AI", 70, 20);

    doc.setFontSize(16);
    doc.text("Interview Assessment Report", 45, 30);

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

            ["Reason", result.recommendation_reason],

            ["AI Feedback", result.overall_feedback]

        ]

    });

    doc.save("SmartHire_Report.pdf");

};
const downloadReport = () => {
    alert("My new function is running");
};
    return (

<div className="min-h-screen bg-gray-100 py-12 px-6">

<div className="max-w-4xl mx-auto">

<div className="bg-white rounded-2xl shadow-xl p-10">

<h1 className="text-4xl font-bold text-center text-blue-600">
🎉 Interview Completed
</h1>

<p className="text-center text-gray-500 mt-3">
Candidate: <span className="font-semibold">{result.email}</span>
</p>

<p className="text-center text-gray-400 text-sm mt-1">
{result.date}
</p>

<div className="text-center mt-8">

<div className="text-7xl">
🏆
</div>

<h2 className="text-3xl font-bold mt-4">
Assessment Complete
</h2>

<p className="text-gray-500 mt-2">
Your AI interview has been successfully evaluated.
</p>

</div>

{/* Overall Score */}

<div className="mt-10 text-center">

<p className="text-gray-500 text-lg">
Overall Score
</p>

<h2
className={`text-7xl font-bold mt-2 ${
result.overall_score >= 80
? "text-green-600"
: result.overall_score >= 60
? "text-yellow-600"
: "text-red-600"
}`}
>
{result.overall_score}/100
</h2>

<div className="mt-4">

<span
className={`px-6 py-2 rounded-full font-bold ${
result.overall_score >= 80
? "bg-green-100 text-green-700"
: result.overall_score >= 60
? "bg-yellow-100 text-yellow-700"
: "bg-red-100 text-red-700"
}`}
>

{result.overall_score >= 80
? "Excellent Performance"
: result.overall_score >= 60
? "Good Performance"
: "Needs Improvement"}

</span>

</div>

</div>

{/* Score Cards */}

<div className="grid md:grid-cols-2 gap-8 mt-12">

<div>

<p className="font-semibold">
Technical Skills
</p>

<div className="w-full bg-gray-200 rounded-full h-5 mt-3">

<div
className="bg-green-600 h-5 rounded-full"
style={{
width: `${result.technical_score}%`
}}
></div>

</div>

<p className="mt-2 font-bold text-green-700">
{result.technical_score}/100
</p>

</div>

<div>

<p className="font-semibold">
Communication Skills
</p>

<div className="w-full bg-gray-200 rounded-full h-5 mt-3">

<div
className="bg-purple-600 h-5 rounded-full"
style={{
width: `${result.communication_score}%`
}}
></div>

</div>

<p className="mt-2 font-bold text-purple-700">
{result.communication_score}/100
</p>

</div>

</div>

{/* Recommendation */}

<div className="mt-12">

<h2 className="text-2xl font-bold">
AI Recommendation
</h2>

<div className="mt-4">

<span
className={`px-5 py-2 rounded-full font-bold ${
result.recommendation === "Recommended"
? "bg-green-100 text-green-700"
: result.recommendation === "Consider"
? "bg-yellow-100 text-yellow-700"
: "bg-red-100 text-red-700"
}`}
>

{result.recommendation}

</span>

</div>

<div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-5">

<h3 className="font-bold text-blue-700">
Reason
</h3>

<p className="mt-2 text-gray-700">
{result.recommendation_reason}
</p>

</div>

</div>

{/* Feedback */}

<div className="mt-12">

<h2 className="text-2xl font-bold">
AI Feedback
</h2>

<div className="bg-gray-100 rounded-xl p-6 mt-4 leading-8">

{result.overall_score === 0 ? (

<div className="text-center py-6">

<p className="text-red-600 text-xl font-semibold">
⚠ Interview was not completed.
</p>

<p className="text-gray-600 mt-3">
Please complete the interview to receive your AI evaluation.
</p>

</div>

) : (

<p>{result.overall_feedback}</p>

)}

</div>

</div>

{/* Buttons */}

<div className="flex justify-center gap-5 mt-10">

<button
onClick={downloadReport}
className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700"
>
📄 Download Report
</button>

<button
onClick={() => window.location.href="/dashboard"}
className="bg-gray-700 text-white px-6 py-3 rounded-xl hover:bg-gray-800"
>
Dashboard
</button>

<button
onClick={() => window.location.href="/interview"}
className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
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