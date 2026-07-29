import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";


function InterviewResults() {

    const { email } = useParams();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);



    const formatScore = (score) => {

        if (score === null || score === undefined) {
            return 0;
        }

        // Handles old data (6 -> 60, 60 -> 60)
        return score <= 10 ? score * 10 : score;

    };




    useEffect(() => {


        const fetchResults = async () => {

            try {


                const response = await fetch(
                    `http://localhost:5000/interview-results/${email}`
                );


                const data = await response.json();


                console.log(
                    "Interview Results:",
                    data
                );


                setResult(data);



            } catch(error) {


                console.error(
                    "Result fetch error:",
                    error
                );


            } finally {

                setLoading(false);

            }

        };


        fetchResults();


    }, [email]);





    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <p className="text-gray-500">
                    Loading result...
                </p>

            </div>

        );

    }





    if (!result || !result.attempts) {


        return (

            <div className="min-h-screen flex items-center justify-center">

                <p className="text-red-500">
                    No interview results found
                </p>

            </div>

        );

    }





    return (

        <div className="min-h-screen bg-gray-100 px-6 py-10">


            <div className="max-w-6xl mx-auto">



                <h1 className="text-3xl font-bold text-gray-800 mb-8">
                    Interview Result
                </h1>





                {/* Candidate Details */}

                <div className="bg-white rounded-xl shadow p-6 mb-8">


                    <h2 className="text-xl font-semibold mb-4">
                        Candidate Details
                    </h2>


                    <p className="text-gray-700">

                        Email:
                        {" "}
                        <span className="font-medium">
                            {result.email}
                        </span>

                    </p>


                </div>







                {/* All Attempts */}

                {

                    result.attempts.map((attempt, index) => (


                        <div
                            key={index}
                            className="bg-white rounded-xl shadow p-8 mb-8"
                        >



                            <h2 className="text-2xl font-bold text-blue-600 mb-6">

                                Attempt {index + 1}

                            </h2>





                            {/* Interview Details */}


                            <div className="mb-6">


                                <p className="text-gray-700">

                                    <b>
                                        Interview Date:
                                    </b>

                                    {" "}

                                    {attempt.date}

                                </p>


                            </div>







                            {/* Scores */}


                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">


                                <div className="bg-gray-100 rounded-lg p-5 text-center">

                                    <p className="text-gray-500">
                                        Overall Score
                                    </p>


                                    <h3 className="text-3xl font-bold text-blue-600">

                                        {formatScore(attempt.overall_score)}/100

                                    </h3>


                                </div>






                                <div className="bg-gray-100 rounded-lg p-5 text-center">


                                    <p className="text-gray-500">
                                        Technical Score
                                    </p>


                                    <h3 className="text-3xl font-bold text-purple-600">

                                        {formatScore(attempt.technical_score)}/100

                                    </h3>


                                </div>






                                <div className="bg-gray-100 rounded-lg p-5 text-center">


                                    <p className="text-gray-500">
                                        Communication Score
                                    </p>


                                    <h3 className="text-3xl font-bold text-green-600">

                                        {formatScore(attempt.communication_score)}/100

                                    </h3>


                                </div>



                            </div>








                            {/* Feedback */}


                            <div className="mb-6">


                                <h3 className="text-xl font-semibold mb-2">
                                    AI Feedback
                                </h3>


                                <p className="text-gray-600">

                                    {attempt.overall_feedback}

                                </p>


                            </div>







                            {/* Recommendation */}


                            <div className="mb-8">


                                <h3 className="text-xl font-semibold mb-2">
                                    Recommendation
                                </h3>


                                <p
                                    className={
                                        attempt.recommendation === "Recommended"
                                        ? "text-green-600 font-bold"
                                        : "text-red-600 font-bold"
                                    }
                                >

                                    {attempt.recommendation}

                                </p>





                                <h4 className="font-semibold mt-4">

                                    Recommendation Reason

                                </h4>


                                <p className="text-gray-600">

                                    {attempt.recommendation_reason}

                                </p>



                            </div>









                            {/* Transcript */}


                            <div>


                                <h3 className="text-xl font-semibold mb-4">

                                    Interview Transcript

                                </h3>





                                {

                                    attempt.transcript &&
                                    attempt.transcript.length > 0

                                    ?


                                    attempt.transcript.map((item, i) => (


                                        <div
                                            key={i}
                                            className="border rounded-lg p-5 mb-4 bg-gray-50"
                                        >



                                            <p className="mb-2">

                                                <b>
                                                    Question:
                                                </b>

                                                {" "}

                                                {item.question}

                                            </p>





                                            <p className="mb-2">

                                                <b>
                                                    Candidate Answer:
                                                </b>

                                                {" "}

                                                {item.candidate_answer}

                                            </p>





                                            <p className="mb-2">

                                                <b>
                                                    Answer Score:
                                                </b>

                                                {" "}

                                                {formatScore(item.score)}/100

                                            </p>






                                            <p className="mb-2">

                                                <b>
                                                    Feedback:
                                                </b>

                                                {" "}

                                                {item.feedback}

                                            </p>







                                            <p className="mb-2">

                                                <b>
                                                    Strengths:
                                                </b>

                                                {" "}

                                                {item.strengths}

                                            </p>







                                            <p className="mb-2">

                                                <b>
                                                    Improvements:
                                                </b>

                                                {" "}

                                                {item.improvements}

                                            </p>







                                            <p>

                                                <b>
                                                    Ideal Answer:
                                                </b>

                                                {" "}

                                                {item.ideal_answer}

                                            </p>



                                        </div>


                                    ))



                                    :


                                    <p className="text-gray-500">

                                        Transcript not available

                                    </p>


                                }



                            </div>





                        </div>


                    ))

                }



            </div>


        </div>

    );

}


export default InterviewResults;