import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RecruiterDashboard() {

    const navigate = useNavigate();

    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({
        totalCandidates: 0,
        completedInterviews: 0,
        pendingInterviews: 0,
        averageScore: 0
    });

    const [topCandidate, setTopCandidate] = useState(null);
    const [loading, setLoading] = useState(true);


    // Fetch recruiter dashboard data
    const fetchDashboardData = async () => {
    try {
        setLoading(true);

        const response = await fetch(
            "http://localhost:5000/candidates"
        );

        const data = await response.json();

        console.log("Candidates API response:", data);

        let candidateList = [];

        if (Array.isArray(data)) {
            candidateList = data;
        }
        else if (Array.isArray(data.candidates)) {
            candidateList = data.candidates;
        }
        else if (Array.isArray(data.data)) {
            candidateList = data.data;
        }
        else {
            console.error(
                "Unexpected API response format:",
                data
            );
        }

        setCandidates(candidateList);

        calculateStats(candidateList);

    } catch (error) {

        console.error(
            "Dashboard fetch error:",
            error
        );

    } finally {

        setLoading(false);

    }
};
const updateCandidateStatus = async(email, status)=>{

    try{

        console.log(
            "Updating:",
            email,
            status
        );


        const response = await fetch(
            "http://localhost:5000/update-candidate-status",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    email:email,

                    status:status

                })

            }
        );


        const data = await response.json();


        console.log(
            "Update response:",
            data
        );

setCandidates(prev =>
    prev.map(candidate =>
        candidate.email === email
            ? {
                ...candidate,
                recruiter_status: status
            }
            : candidate
    )
);
        // update UI immediately

        setCandidates(prev =>
            prev.map(candidate =>
                candidate.email === email
                ?
                {
                    ...candidate,
                    recruiter_status: status
                }
                :
                candidate
            )
        );


    }
    catch(error){

        console.error(
            "Update failed:",
            error
        );

    }

}
    // Calculate dashboard statistics
    const calculateStats = (candidateList = []) => {

    if (!Array.isArray(candidateList)) {
        candidateList = [];
    }
        const total = candidateList.length;

        const completed = candidateList.filter(
            (candidate) =>
                candidate.status === "Completed" ||
                candidate.score !== null
        ).length;


        const pending = total - completed;


        const scores = candidateList
            .filter(
                (candidate) =>
                    candidate.score !== null &&
                    candidate.score !== undefined
            )
            .map(
                (candidate) =>
                    Number(candidate.score)
            );


        const average =
            scores.length > 0
                ? Math.round(
                    scores.reduce(
                        (a, b) => a + b,
                        0
                    ) / scores.length
                )
                : 0;


        setStats({
            totalCandidates: total,
            completedInterviews: completed,
            pendingInterviews: pending,
            averageScore: average
        });


        if (scores.length > 0) {

            const highest =
                [...candidateList]
                    .filter(
                        (candidate) =>
                            candidate.score !== null &&
                            candidate.score !== undefined
                    )
                    .sort(
                        (a, b) =>
                            b.score - a.score
                    )[0];


            setTopCandidate(highest);

        }

    };


    useEffect(() => {

        fetchDashboardData();

    }, []);



    // Format interview date
    const formatDate = (date) => {

        if (!date) return "Not Scheduled";

        const formatted =
            new Date(date);

        return formatted.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };



    // Status badge color helper
    const getStatusStyle = (status) => {

        switch(status) {

            case "Completed":
                return "bg-green-100 text-green-700";

            case "Scheduled":
                return "bg-blue-100 text-blue-700";

            case "Pending":
                return "bg-yellow-100 text-yellow-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };



    return (

        <div className="min-h-screen bg-gray-100 p-8">

            <div className="max-w-7xl mx-auto">


                {/* Header */}

                <div className="flex justify-between items-center mb-8">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-800">
                            Recruiter Dashboard
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Monitor candidates and AI interview performance
                        </p>

                    </div>


                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Home
                    </button>

                </div>



                {/* Statistics Cards */}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">


                    <div className="bg-white rounded-xl shadow p-6">

                        <p className="text-gray-500">
                            Total Candidates
                        </p>

                        <h2 className="text-3xl font-bold text-blue-600">
                            {stats.totalCandidates}
                        </h2>

                    </div>



                    <div className="bg-white rounded-xl shadow p-6">

                        <p className="text-gray-500">
                            Completed Interviews
                        </p>

                        <h2 className="text-3xl font-bold text-green-600">
                            {stats.completedInterviews}
                        </h2>

                    </div>



                    <div className="bg-white rounded-xl shadow p-6">

                        <p className="text-gray-500">
                            Pending Interviews
                        </p>

                        <h2 className="text-3xl font-bold text-yellow-600">
                            {stats.pendingInterviews}
                        </h2>

                    </div>



                    <div className="bg-white rounded-xl shadow p-6">

                        <p className="text-gray-500">
                            Average Score
                        </p>

                        <h2 className="text-3xl font-bold text-purple-600">
                            {stats.averageScore}/100
                        </h2>

                    </div>


                </div>





                {/* Top Candidate */}

                {
                    topCandidate && (

                        <div className="bg-white rounded-xl shadow p-6 mb-8">


                            <h2 className="text-xl font-bold mb-4">
                                ⭐ Top Performing Candidate
                            </h2>


                            <div className="flex justify-between items-center">


                                <div>

                                    <h3 className="text-lg font-semibold">
                                        {topCandidate.name ||
                                            topCandidate.candidate_name ||
                                            "Candidate"}
                                    </h3>


                                    <p className="text-gray-500">
                                        {topCandidate.email ||
                                            topCandidate.candidate_email}
                                    </p>

                                </div>


                            </div>


                        </div>

                    )
                }
                                {/* Candidate Table */}

                <div className="bg-white rounded-xl shadow overflow-hidden">


                    <div className="flex justify-between items-center p-6">

                        <h2 className="text-xl font-bold text-gray-800">
                            Candidate Interviews
                        </h2>


                        


                    </div>



                    {
                        loading ? (

                            <div className="p-8 text-center text-gray-500">
                                Loading candidates...
                            </div>

                        ) : candidates.length === 0 ? (

                            <div className="p-8 text-center text-gray-500">
                                No candidates found
                            </div>

                        ) : (


                            <div className="overflow-x-auto">


                                <table className="w-full text-left">


                                    <thead className="bg-gray-50 border-b">


                                        <tr>

                                            <th className="px-6 py-4">
                                                Candidate
                                            </th>

                                            <th className="px-6 py-4">
                                                Email
                                            </th>

                                            <th className="px-6 py-4">
                                                Interview Date
                                            </th>

                                            <th className="px-6 py-4">
                                                Score
                                            </th>

                                            <th className="px-6 py-4">
                                                Status
                                            </th>

                                            <th className="px-6 py-4">
                                                Action
                                            </th>

                                        </tr>


                                    </thead>



                                    <tbody>


                                        {
                                            candidates.map(
                                                (candidate, index) => (


                                                    <tr
                                                        key={
                                                            candidate.id ||
                                                            index
                                                        }
                                                        className="border-b hover:bg-gray-50"
                                                    >


                                                        <td className="px-6 py-4 font-medium">

                                                            {
                                                                candidate.name ||
                                                                candidate.candidate_name ||
                                                                "Unknown"
                                                            }

                                                        </td>



                                                        <td className="px-6 py-4 text-gray-600">


                                                            {
                                                                candidate.email ||
                                                                candidate.candidate_email ||
                                                                "-"
                                                            }


                                                        </td>



                                                        <td className="px-6 py-4 text-gray-600">


                                                            {
                                                                formatDate(
                                                                    candidate.interview_date
                                                                )
                                                            }


                                                        </td>



                                                        <td className="px-6 py-4">


                                                            {
                                                                candidate.score !== null &&
                                                                candidate.score !== undefined
                                                                    ?

                                                                    <span className="font-semibold text-blue-600">

                                                                        {
                                                                            candidate.score
                                                                        }/100

                                                                    </span>

                                                                    :

                                                                    <span className="text-gray-400">

                                                                        N/A

                                                                    </span>

                                                            }


                                                        </td>



                                                        <td className="px-6 py-4">


                                                            <span
                                                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                                                                    candidate.status
                                                                )}`}
                                                            >

                                                                {
                                                                    candidate.status ||
                                                                    (
                                                                        candidate.score
                                                                            ?
                                                                            "Completed"
                                                                            :
                                                                            "Pending"
                                                                    )
                                                                }

                                                            </span>


                                                        </td>



<td className="px-4 py-3">

    <button
        onClick={() =>
            navigate(`/interview-results/${candidate.email}`)
        }
        className="bg-blue-600 text-white px-3 py-2 rounded mr-2"
    >
        View Result
    </button>


    {
        (!candidate.recruiter_status ||
        candidate.recruiter_status === "Pending") && (

        <>
            <button
                onClick={() =>
                    updateCandidateStatus(
                        candidate.email,
                        "Shortlisted"
                    )
                }
                className="bg-green-600 text-white px-3 py-2 rounded mr-2"
            >
                Shortlist
            </button>


            <button
                onClick={() =>
                    updateCandidateStatus(
                        candidate.email,
                        "Rejected"
                    )
                }
                className="bg-red-600 text-white px-3 py-2 rounded"
            >
                Reject
            </button>

        </>
    )}


    {
        candidate.recruiter_status === "Shortlisted" && (

            <span className="text-green-700 font-semibold">
                Shortlisted
            </span>

        )
    }


    {
        candidate.recruiter_status === "Rejected" && (

            <span className="text-red-700 font-semibold">
                Rejected
            </span>

        )
    }

</td>



                                                    </tr>


                                                )

                                            )
                                        }



                                    </tbody>


                                </table>


                            </div>


                        )

                    }


                </div>



            </div>


        </div>


    );


}





export default RecruiterDashboard;