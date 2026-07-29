import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();


  useEffect(() => {

    async function loadCandidate() {

      try {

        const resume = JSON.parse(localStorage.getItem("resumeData"));

        if (!resume || !resume.email) {
          setLoading(false);
          return;
        }


        const response = await fetch(
          `http://localhost:5000/candidate?email=${resume.email}`
        );


        const data = await response.json();

        setCandidate(data);


      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }
    }


    loadCandidate();

  }, []);



  const startInterview = async () => {

    try {

      await fetch("http://localhost:5000/start-interview", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email: candidate.email
        })

      });


      navigate("/interview");


    } catch (error) {

      console.error("Interview start error:", error);

    }

  };




  if (loading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold">
          Loading candidate details...
        </h2>
      </div>
    );

  }



  if (!candidate) {

    return (
      <div className="min-h-screen flex items-center justify-center">

        <h2 className="text-2xl font-bold text-red-600">
          Candidate not found
        </h2>

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

            <p>
              Interview Status
            </p>

            <h2 className="text-xl font-bold text-blue-600 mt-3">
              {candidate.interview_status || "Pending"}
            </h2>

          </div>





          <div className="bg-white rounded-xl shadow p-6">

            <p>
              Recruiter Decision
            </p>

            <h2 className="text-xl font-bold text-blue-600 mt-3">
              {candidate.recruiter_status || "Pending"}
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
              <b>Skills:</b><br />

              {Array.isArray(candidate.skills)
                ? candidate.skills.join(", ")
                : candidate.skills}

            </p>



            <p>
              <b>Education:</b><br />
              {candidate.education}
            </p>



            <p>
              <b>Experience:</b><br />
              {candidate.experience}
            </p>



            <p>
              <b>Projects:</b><br />
              {candidate.projects}
            </p>



            <p>
              <b>Certifications:</b><br />
              {candidate.certifications}
            </p>



            <p>
              <b>Languages:</b><br />
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
            Start your personalized AI interview based on your resume.
          </p>



          <button

            onClick={startInterview}

            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold"

          >

            Start Interview

          </button>


        </div>



      </div>

    </div>

  );

}


export default Dashboard;