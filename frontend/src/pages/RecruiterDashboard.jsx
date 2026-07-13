import React, { useEffect, useState } from "react";


function RecruiterDashboard() {


  const [candidates, setCandidates] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {


    fetch("http://127.0.0.1:5000/candidates")

      .then((response) => response.json())

      .then((data) => {

        setCandidates(data);

        setLoading(false);

      })

      .catch((error) => {

        console.log("Error fetching candidates:", error);

        setLoading(false);

      });


  }, []);




  return (

    <div className="min-h-screen bg-gray-100 px-6 py-10">


      <div className="max-w-7xl mx-auto">



        {/* Header */}

        <h1 className="text-4xl font-bold text-blue-600">

          Recruiter Dashboard

        </h1>


        <p className="text-gray-600 mt-2">

          Review candidates and manage hiring decisions.

        </p>





        {/* Statistics Cards */}

        <div className="grid md:grid-cols-3 gap-6 mt-8">



          <div className="bg-white rounded-xl shadow p-6">

            <p className="text-gray-500">

              Total Candidates

            </p>


            <h2 className="text-3xl font-bold text-blue-600 mt-3">

              {candidates.length}

            </h2>


          </div>




          <div className="bg-white rounded-xl shadow p-6">


            <p className="text-gray-500">

              Shortlisted

            </p>


            <h2 className="text-3xl font-bold text-green-600 mt-3">

              0

            </h2>


          </div>




          <div className="bg-white rounded-xl shadow p-6">


            <p className="text-gray-500">

              Interviews Pending

            </p>


            <h2 className="text-3xl font-bold text-orange-500 mt-3">

              {candidates.length}

            </h2>


          </div>



        </div>





        {/* Candidate List */}


        <div className="mt-10">


          {
            loading ? (

              <p className="text-gray-600">
                Loading candidates...
              </p>


            ) : candidates.length === 0 ? (


              <p className="text-gray-600">
                No candidates found.
              </p>


            ) : (


              <div className="space-y-6">


                {
                  candidates.map((candidate, index) => (


                    <div

                      key={candidate.email}

                      className="bg-white rounded-2xl shadow p-8"

                    >



                      <div className="flex justify-between items-start">


                        <div>


                          <h2 className="text-2xl font-bold">

                            {candidate.name}

                          </h2>



                          <p className="text-gray-600 mt-2">

                            {candidate.email}

                          </p>


                        </div>



                        <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">

                          New

                        </span>


                      </div>





                      <div className="mt-6 space-y-4">



                        <p>

                          <b>Phone:</b>{" "}

                          {candidate.phone}

                        </p>



                        <p>

                          <b>Skills:</b>{" "}

                          {candidate.skills}

                        </p>




                        <p>

                          <b>Experience:</b>{" "}

                          {candidate.experience}

                        </p>




                        <p>

                          <b>Education:</b>{" "}

                          {candidate.education}

                        </p>




                        <p>

                          <b>Projects:</b>{" "}

                          {candidate.projects}

                        </p>

                        <p>
                          <b>Certifications:</b>{" "}

                          {candidate.certifications}
                        </p>

                        <p>
                        <b>Languages:</b>{" "}
                        {candidate.languages}
                        </p>

                      </div>





                      <div className="flex gap-4 mt-8">


                        <button

                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"

                        >

                          View Resume

                        </button>



                        <button

                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"

                        >

                          Shortlist

                        </button>




                        <button

                          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"

                        >

                          Reject

                        </button>


                      </div>




                    </div>


                  ))

                }


              </div>


            )

          }


        </div>




      </div>


    </div>

  );

}


export default RecruiterDashboard;