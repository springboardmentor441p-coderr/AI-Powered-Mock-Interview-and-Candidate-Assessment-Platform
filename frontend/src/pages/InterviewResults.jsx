import React, { useEffect, useState } from "react";


function InterviewResults(){

    const [result,setResult] = useState(null);


    useEffect(()=>{


        fetch("http://127.0.0.1:5000/interview-results")

        .then(res=>res.json())

        .then(data=>{

            setResult(data);

        })

        .catch(error=>{

            console.log(error);

        });


    },[]);



    return(

        <div className="min-h-screen bg-gray-100 px-6 py-10">


            <div className="max-w-5xl mx-auto">


                <h1 className="text-4xl font-bold text-blue-600">

                    Interview Results

                </h1>



                {!result ? (

                    <p className="mt-8">
                        Loading results...
                    </p>

                ) : result.message ? (

                    <p className="mt-8">
                        No interview completed yet.
                    </p>

                ) : (


                    <div className="bg-white rounded-2xl shadow p-8 mt-8">


                        <h2 className="text-2xl font-bold">

                            Candidate Email

                        </h2>


                        <p className="mt-2">

                            {result.email}

                        </p>




                        <div className="mt-8">


                            <h2 className="text-2xl font-bold">

                                Answers

                            </h2>



                            <pre className="bg-gray-100 p-5 rounded-xl mt-4 whitespace-pre-wrap">

                                {result.answers}

                            </pre>


                        </div>





                        <div className="grid md:grid-cols-2 gap-6 mt-8">


                            <div className="bg-blue-50 p-5 rounded-xl">

                                <h3 className="font-bold">

                                    AI Score

                                </h3>


                                <p className="text-2xl mt-2">

                                    {result.score}/100

                                </p>


                            </div>



                            <div className="bg-green-50 p-5 rounded-xl">

                                <h3 className="font-bold">

                                    Feedback

                                </h3>


                                <p className="mt-2">

                                    {result.feedback || "Pending"}

                                </p>


                            </div>


                        </div>


                    </div>


                )}


            </div>


        </div>


    );

}


export default InterviewResults;