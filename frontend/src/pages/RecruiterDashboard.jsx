import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RecruiterDashboard() {


    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({
    total_candidates: 0,
    completed_interviews: 0,
    average_score: 0,
    shortlisted: 0,
    
});
    const [topCandidate, setTopCandidate] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {

    fetch("http://127.0.0.1:5000/candidates")

        .then(response => response.json())

        .then(data => {

            console.log("API DATA:", data);

            setCandidates(data.candidates || []);

            setStats(data.stats || {});

            setTopCandidate(data.top_candidate || null);

            setLoading(false);

        })

        .catch(error => {

            console.log(error);

            setLoading(false);

        });


}, []);

const updateStatus = async (email, status) => {

    await fetch("http://127.0.0.1:5000/update-status", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            status
        })
    });

    window.location.reload();
};

    

        
   return (

<div className="min-h-screen bg-gray-100 px-8 py-10">

<div className="max-w-7xl mx-auto">


<h1 className="text-4xl font-bold text-blue-600">
    Recruiter Dashboard
</h1>


<p className="text-gray-600 mt-2">
    Review candidates and manage hiring decisions.
</p>



{/* Dashboard Cards */}

<div className="grid md:grid-cols-4 gap-6 mt-8">


<div className="bg-white rounded-xl shadow p-6">
<p className="text-gray-500">
Total Candidates
</p>

<h2 className="text-3xl font-bold text-blue-600 mt-3">
{stats.total_candidates || 0}
</h2>

</div>



<div className="bg-white rounded-xl shadow p-6">

<p className="text-gray-500">
Completed Interviews
</p>

<h2 className="text-3xl font-bold text-green-600 mt-3">
{stats.completed_interviews || 0}
</h2>

</div>




<div className="bg-white rounded-xl shadow p-6">

<p className="text-gray-500">
Average Score
</p>

<h2 className="text-3xl font-bold text-purple-600 mt-3">
{Math.round(stats.average_score || 0)}
</h2>

</div>




<div className="bg-white rounded-xl shadow p-6">

<p className="text-gray-500">
Shortlisted
</p>

<h2 className="text-3xl font-bold text-orange-600 mt-3">
{stats.shortlisted || 0}
</h2>

</div>


</div>





{/* Candidate Table */}

<div className="bg-white rounded-xl shadow mt-10 overflow-hidden">


<table className="w-full">


<thead className="bg-gray-200">

<tr>

<th className="p-4 text-left">
Candidate
</th>


<th className="p-4">
Email
</th>


<th className="p-4">
Score
</th>


<th className="p-4">
Technical
</th>


<th className="p-4">
Communication
</th>


<th className="p-4">
AI Recommendation
</th>


<th className="p-4">
Status
</th>


<th className="p-4">
Action
</th>


</tr>

</thead>



<tbody>


{
loading ?


<tr>

<td colSpan="8" className="text-center p-6">
Loading candidates...
</td>

</tr>


:


candidates
.sort((a,b)=>(b.score || 0)-(a.score || 0))
.map((candidate,index)=>(


<tr key={index} className="border-t">


<td className="p-4 font-semibold">
{candidate.name}
</td>



<td className="p-4">
{candidate.email}
</td>




<td className="p-4 text-blue-600 font-bold">

{candidate.score ?? "-"}/100

</td>




<td className="p-4">

{candidate.technical_score ?? "-"}

</td>




<td className="p-4">

{candidate.communication_score ?? "-"}

</td>





<td className="p-4">

{candidate.recommendation || "-"}

</td>





<td className="p-4">

<span
className={`px-3 py-1 rounded-full text-white ${
candidate.status === "Shortlisted"
? "bg-green-600"
: candidate.status === "Rejected"
? "bg-red-600"
: candidate.status === "Interview Completed"
? "bg-blue-600"
: "bg-yellow-500"
}`}

>

{candidate.status}

</span>

</td>





<td className="p-4">


<button

onClick={() =>
navigate(`/interview-history/${candidate.email}`)
}

className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"

>

View

</button>


</td>



</tr>


))


}



</tbody>


</table>


</div>




</div>


</div>


);
}
export default RecruiterDashboard;
