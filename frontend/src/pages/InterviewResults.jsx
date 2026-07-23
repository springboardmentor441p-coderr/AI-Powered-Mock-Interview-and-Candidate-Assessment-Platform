import React, { useEffect, useState } from "react";


function InterviewResults() {

    const [result, setResult] = useState(null);


    useEffect(() => {

        fetch("http://127.0.0.1:5000/interview-results")

            .then(res => res.json())

            .then(data => {
                setResult(data);
            })

            .catch(error => {
                console.log(error);
            });

    }, []);



    const getRecommendation = (score) => {

        if(score >= 85)
            return "Excellent performance. Recommended for the next round.";

        if(score >= 70)
            return "Good performance. Suitable for further evaluation.";

        if(score >= 50)
            return "Average performance. Needs some improvement.";

        return "Needs improvement before proceeding.";

    };



    const getInsights = () => {

        return {

            strengths:[
                "Good understanding of technical concepts",
                "Clear communication skills",
                "Logical problem-solving approach",
                "Professional attitude during interview"
            ],


            improvements:[
                "Provide more detailed technical explanations",
                "Use more real-world examples",
                "Explain project challenges more clearly"
            ]

        };

    };



    const ScoreCard = ({title, score, icon}) => (

        <div className="bg-white rounded-2xl shadow p-6">

            <div className="flex justify-between">

                <h3 className="font-semibold text-gray-600">
                    {title}
                </h3>

                <span className="text-2xl">
                    {icon}
                </span>

            </div>


            <p className="text-4xl font-bold text-blue-600 mt-4">

                {score || 0}

                <span className="text-xl text-gray-500">
                    /100
                </span>

            </p>



            <div className="w-full bg-gray-200 rounded-full h-3 mt-5">


                <div

                    className="bg-blue-600 h-3 rounded-full"

                    style={{
                        width:`${score || 0}%`
                    }}

                >

                </div>


            </div>


        </div>

    );



    if(!result){

        return (

            <div className="p-10 text-center">

                Loading results...

            </div>

        );

    }



    if(result.message){

        return (

            <div className="p-10 text-center">

                No interview completed yet.

            </div>

        );

    }



    const insights = getInsights();



    return (

<div className="min-h-screen bg-gray-100 px-6 py-10">


<div className="max-w-6xl mx-auto">



{/* Header */}

<div>

<h1 className="text-4xl font-bold text-blue-600">

    Interview Results

</h1>


<p className="text-gray-600 mt-2">

SmartHire AI Candidate Assessment Report

</p>


</div>





{/* Candidate Card */}

<div className="bg-white rounded-2xl shadow p-8 mt-8">


<h2 className="text-2xl font-bold">

Candidate Information

</h2>


<div className="mt-5 grid md:grid-cols-2 gap-5">


<div>

<p className="text-gray-500">
Email
</p>


<p className="font-semibold">

📧 {result.email}

</p>


</div>



<div>

<p className="text-gray-500">

Assessment Status

</p>


<p className="text-green-600 font-semibold">

Completed ✓

</p>


</div>


</div>


</div>





{/* Scores */}


<div className="grid md:grid-cols-3 gap-6 mt-8">


<ScoreCard

title="Overall AI Score"

score={result.overall_score}

icon="⭐"

/>



<ScoreCard

title="Technical Skills"

score={result.technical_score}

icon="💻"

/>




<ScoreCard

title="Communication"

score={result.communication_score}

icon="🎤"

/>



</div>






{/* Interview Summary */}


<div className="bg-white rounded-2xl shadow p-8 mt-8">


<h2 className="text-2xl font-bold">

Interview Summary

</h2>



<div className="grid md:grid-cols-3 gap-6 mt-6">


<div className="bg-blue-50 p-5 rounded-xl">

<p className="text-gray-600">

Interview Type

</p>


<h3 className="font-bold mt-2">

AI Voice Interview

</h3>

</div>




<div className="bg-green-50 p-5 rounded-xl">


<p className="text-gray-600">

Evaluation

</p>


<h3 className="font-bold mt-2">

Completed

</h3>


</div>





<div className="bg-purple-50 p-5 rounded-xl">


<p className="text-gray-600">

Performance

</p>


<h3 className="font-bold mt-2">

{result.overall_score >=70 ? "Good" : "Needs Improvement"}

</h3>


</div>


</div>


</div>







{/* Feedback */}


<div className="bg-white rounded-2xl shadow p-8 mt-8">


<h2 className="text-2xl font-bold">

AI Feedback

</h2>



<p className="mt-5 text-gray-700 leading-relaxed">

{result.overall_feedback || "No feedback available"}

</p>


</div>







{/* Strengths and Improvements */}


<div className="grid md:grid-cols-2 gap-6 mt-8">



<div className="bg-green-50 rounded-2xl shadow p-8">


<h2 className="text-xl font-bold text-green-700">

✅ Strengths

</h2>


<ul className="mt-5 space-y-3">


{insights.strengths.map((item,index)=>(

<li key={index}>

✓ {item}

</li>

))}


</ul>


</div>






<div className="bg-yellow-50 rounded-2xl shadow p-8">


<h2 className="text-xl font-bold text-yellow-700">

📌 Areas To Improve

</h2>


<ul className="mt-5 space-y-3">


{insights.improvements.map((item,index)=>(

<li key={index}>

• {item}

</li>

))}


</ul>


</div>



</div>







{/* Recommendation */}


<div className="bg-blue-50 rounded-2xl shadow p-8 mt-8">


<h2 className="text-2xl font-bold">

Recruiter Recommendation

</h2>



<p className="mt-4 text-gray-700">

{getRecommendation(result.overall_score)}

</p>


</div>






{/* Button */}


<div className="text-center mt-10">


<button

onClick={()=>window.print()}

className="bg-blue-600 text-white px-10 py-3 rounded-xl hover:bg-blue-700"

>

Download Report

</button>


</div>





</div>


</div>

    );

}


export default InterviewResults;