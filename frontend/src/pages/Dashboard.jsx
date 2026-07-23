import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {

  const data = localStorage.getItem("resumeData");

  if (data) {
    setCandidate(JSON.parse(data));
  }

  setLoading(false);

}, []);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl font-semibold">
          Loading candidate details...
        </h2>
      </div>
    );
  }


  if (!candidate || candidate.message) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">

        <h2 className="text-2xl font-bold">
          No resume found
        </h2>

        <p className="text-gray-600 mt-3">
          Please upload your resume first.
        </p>

        <Link
          to="/upload"
          className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-xl"
        >
          Upload Resume
        </Link>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">

      <div className="max-w-6xl mx-auto">


        <h1 className="text-4xl font-bold text-blue-600">
          Candidate Dashboard
        </h1>


        <p className="text-gray-600 mt-2">
          Manage your resume and track your interview progress.
        </p>




        {/* Candidate Profile */}

        <div className="bg-white rounded-2xl shadow p-8 mt-8">

          <h2 className="text-2xl font-bold">
            {candidate.name}
          </h2>


          <p className="text-gray-600 mt-2">
            Email: {candidate.email}
          </p>


          <p className="text-gray-600 mt-2">
            Phone: {candidate.phone}
          </p>


          <p className="mt-3">
            Role: Candidate
          </p>


          <span className="inline-block mt-5 bg-green-100 text-green-700 px-5 py-2 rounded-full">
            Resume Uploaded ✓
          </span>

        </div>





        {/* Status Cards */}

        <div className="grid md:grid-cols-3 gap-6 mt-8">


          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-gray-500">
              Resume Status
            </p>


            <h2 className="text-xl font-bold text-green-600 mt-3">
              Uploaded ✓
            </h2>

          </div>




          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-gray-500">
              Interview Status
            </p>


            <h2 className="text-xl font-bold text-orange-500 mt-3">
              Not Started
            </h2>

          </div>




          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-gray-500">
              AI Resume Score
            </p>


            <h2 className="text-xl font-bold text-blue-600 mt-3">
              Pending
            </h2>

          </div>


        </div>







        {/* Resume Details */}

        <div className="bg-white rounded-xl shadow p-8 mt-8">


          <h2 className="text-2xl font-bold">
            Resume Details
          </h2>



          <div className="mt-5 space-y-5">


            <p>
              <b>Skills:</b>
              <br />

              {Array.isArray(candidate.skills)
                ? candidate.skills.join(", ")
                : candidate.skills}
            </p>




            <p>
              <b>Education:</b>
              <br />

              {candidate.education}
            </p>




            <p>
              <b>Experience:</b>
              <br />

              {candidate.experience}
            </p>




            <p>
              <b>Projects:</b>
              <br />

              {candidate.projects}
            </p>




            <p>
              <b>Certifications:</b>
              <br />

              {candidate.certifications}
            </p>




            <p>
              <b>Languages:</b>
              <br />

              {candidate.languages}
            </p>


          </div>


        </div>







        {/* Interview Section */}

        <div className="bg-white rounded-xl shadow p-8 mt-8">


          <h2 className="text-2xl font-bold">
            AI Mock Interview
          </h2>


          <p className="text-gray-600 mt-3">
            Start your personalized interview based on your resume.
          </p>



          <Link
            to="/interview"
            className="inline-block mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700"
          >
            Start Interview
          </Link>


        </div>



      </div>

    </div>
  );
}


export default Dashboard;