import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


function InterviewHistory() {

    const { email } = useParams();

    const navigate = useNavigate();


    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);



    useEffect(() => {


        fetch(
            `http://127.0.0.1:5000/interview-history/${email}`
        )

        .then((res) => res.json())

        .then((data) => {

            console.log("INTERVIEW HISTORY:", data);


            setHistory(
                data.interviews || []
            );


            setLoading(false);

        })


        .catch((err) => {

            console.log(err);

            setLoading(false);

        });


    }, [email]);




    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <h2 className="text-xl font-semibold">
                    Loading interview history...
                </h2>

            </div>

        );

    }





    return (

        <div className="min-h-screen bg-gray-100 px-8 py-10">


            <div className="max-w-6xl mx-auto">



                {/* Header */}

                <div className="flex justify-between items-center mb-8">


                    <div>

                        <h1 className="text-4xl font-bold text-blue-600">

                            Interview History

                        </h1>


                        <p className="text-gray-600 mt-2">

                            Candidate:
                            <b> {email}</b>

                        </p>


                    </div>



                    <button

                        onClick={() => navigate("/recruiter")}

                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"

                    >

                        Back

                    </button>



                </div>






                {
                    history.length === 0 ?


                    (

                        <div className="bg-white rounded-xl shadow p-10 text-center">

                            No interview history available.

                        </div>

                    )


                    :


                    (

                        history.map((item, index) => (


                            <div

                                key={item.id}

                                className="bg-white rounded-xl shadow-lg p-8 mb-8"

                            >



                                <h2 className="text-2xl font-bold">

                                    Interview Attempt {index + 1}

                                </h2>



                                <p className="text-gray-500 mt-2">

                                    {item.date}

                                </p>





                                {/* Scores */}

                                <div className="grid md:grid-cols-3 gap-6 mt-8">


                                    <div className="bg-blue-50 p-5 rounded-xl">

                                        <p className="text-gray-600">

                                            Overall Score

                                        </p>


                                        <h2 className="text-3xl font-bold text-blue-600">

                                            {item.score ?? "--"}/100

                                        </h2>


                                    </div>





                                    <div className="bg-green-50 p-5 rounded-xl">

                                        <p className="text-gray-600">

                                            Technical Score

                                        </p>


                                        <h2 className="text-3xl font-bold text-green-600">

                                            {item.technical_score ?? "--"}

                                        </h2>


                                    </div>






                                    <div className="bg-purple-50 p-5 rounded-xl">


                                        <p className="text-gray-600">

                                            Communication Score

                                        </p>


                                        <h2 className="text-3xl font-bold text-purple-600">

                                            {item.communication_score ?? "--"}

                                        </h2>


                                    </div>


                                </div>







                                {/* Interview Status */}

                                <div className="mt-8 bg-gray-50 rounded-xl p-6">


                                    <h3 className="text-xl font-bold">

                                        Interview Status

                                    </h3>


                                    <p

                                    className={`mt-2 font-semibold ${
                                        item.interview_status === "Completed"

                                        ?

                                        "text-green-600"

                                        :

                                        "text-red-600"

                                    }`}

                                    >

                                        {item.interview_status || "Not Available"}

                                    </p>
                                </div>








                                {/* Feedback */}


                                <div className="mt-8">


                                    <h3 className="text-xl font-bold">

                                        AI Feedback

                                    </h3>


                                    <p className="mt-3 text-gray-700">

                                        {item.feedback ||

                                        "No feedback available"}

                                    </p>


                                </div>









                                {/* Recommendation */}


                                <div className="mt-8">


                                    <h3 className="text-xl font-bold">

                                        AI Recommendation

                                    </h3>



                                    <p className="mt-3 font-semibold text-blue-600">

                                        {item.recommendation ||

                                        "Pending"}

                                    </p>




                                    <h4 className="font-semibold mt-5">

                                        Reason:

                                    </h4>



                                    <p className="text-gray-700 mt-2">

                                        {item.recommendation_reason ||

                                        "No reason available"}

                                    </p>


                                </div>









                                {/* Transcript */}


                                <div className="mt-8">


                                    <h3 className="text-xl font-bold">

                                        Interview Transcript

                                    </h3>




                                    <div className="mt-4 bg-gray-100 rounded-xl p-5 whitespace-pre-line text-gray-700">


                                        {

                                        item.transcript

                                        ?

                                        item.transcript

                                        :

                                        "No transcript available"

                                        }


                                    </div>


                                </div>





                            </div>


                        ))

                    )

                }




            </div>


        </div>

    );

}



export default InterviewHistory;