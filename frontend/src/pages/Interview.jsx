import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";


function Interview() {

  const navigate = useNavigate();


  const questions = [
    "Tell me about yourself.",
    "Explain your SmartHire AI project.",
    "What are your strengths and weaknesses?",
    "Explain your experience with Python.",
    "How do you handle challenges in a project?",
  ];


  const [started, setStarted] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answer, setAnswer] = useState("");

  const [answers, setAnswers] = useState([]);

  const [listening, setListening] = useState(false);

  const [timeLeft, setTimeLeft] = useState(1200);


  const recognitionRef = useRef(null);



  // Timer

  useEffect(() => {

    if(!started) return;


    const timer = setInterval(()=>{

      setTimeLeft(prev=>{

        if(prev <= 1){

          clearInterval(timer);

          return 0;

        }

        return prev - 1;

      });


    },1000);



    return ()=>clearInterval(timer);


  },[started]);





  const formatTime = () => {

    const minutes = Math.floor(timeLeft / 60);

    const seconds = timeLeft % 60;


    return `${minutes}:${seconds < 10 ? "0":""}${seconds}`;

  };






  // Speech Recognition

  const startSpeaking = () => {


    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;



    if(!SpeechRecognition){

      alert("Speech recognition not supported in this browser");

      return;

    }



    const recognition = new SpeechRecognition();


    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-US";



    recognition.onstart = ()=>{

      setListening(true);

    };



    recognition.onend = ()=>{

      setListening(false);

    };



    recognition.onresult = (event)=>{


      let finalText = "";



      for(
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ){

        if(event.results[i].isFinal){

          finalText += event.results[i][0].transcript;

        }

      }



      if(finalText.trim()){

        setAnswer(prev =>

          prev + " " + finalText

        );

      }


    };



    recognitionRef.current = recognition;


    recognition.start();


  };





  const stopSpeaking = ()=>{


    if(recognitionRef.current){

      recognitionRef.current.stop();

    }


  };






  const saveInterview = async(finalAnswers)=>{


    try{


      const response = await fetch(
        "http://127.0.0.1:5000/save-interview",
        {

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({

            email:"john.doe@gmail.com",

            answers:finalAnswers

          })

        }
      );



      const data = await response.json();


      console.log(data);



      if(response.ok){

        alert("Interview Completed Successfully 🎉");

        navigate("/results");

      }



    }
    catch(error){

      console.log(error);

      alert("Interview save failed");

    }


  };






  const nextQuestion = ()=>{


    if(!answer.trim()){

      alert("Please answer the question");

      return;

    }



    stopSpeaking();



    const currentAnswer={

      question:questions[currentQuestion],

      answer:answer

    };



    const updatedAnswers=[

      ...answers,

      currentAnswer

    ];



    setAnswers(updatedAnswers);

    setAnswer("");



    if(currentQuestion < questions.length-1){

      setCurrentQuestion(currentQuestion+1);

    }

    else{


      saveInterview(updatedAnswers);


    }


  };





  return (

<div className="min-h-screen bg-gray-100 px-6 py-10">


<div className="max-w-6xl mx-auto">


<h1 className="text-4xl font-bold text-blue-600">

AI Mock Interview

</h1>


<p className="text-gray-600 mt-2">

Practice interviews with SmartHire AI.

</p>



{
!started ?


<div className="bg-white rounded-2xl shadow-lg p-10 mt-8 text-center">


<div className="text-7xl">

🤖

</div>


<h2 className="text-3xl font-bold mt-6">

Ready for your AI Interview?

</h2>



<button

onClick={()=>setStarted(true)}

className="mt-8 bg-blue-600 text-white px-10 py-3 rounded-xl"

>

🚀 Start Interview

</button>


</div>


:

<>


<div className="w-full bg-gray-300 h-3 rounded-full mt-8">

<div

className="bg-blue-600 h-3 rounded-full"

style={{

width:`${((currentQuestion+1)/questions.length)*100}%`

}}

></div>

</div>



<div className="grid lg:grid-cols-3 gap-6 mt-8">


<div className="bg-white rounded-xl shadow p-6">


<div className="text-6xl text-center">

🤖

</div>


<h2 className="text-xl font-bold text-center mt-4">

AI Interviewer

</h2>


<p className="text-center text-green-600">

● Online

</p>



<p className="mt-8">

Question {currentQuestion+1}/{questions.length}

</p>



<p className="text-2xl font-bold text-red-500 mt-3">

⏱ {formatTime()}

</p>



</div>





<div className="lg:col-span-2 bg-white rounded-xl shadow p-8">


<p className="text-gray-600">

Question {currentQuestion+1}

</p>



<h2 className="text-2xl font-bold mt-4">

{questions[currentQuestion]}

</h2>



<button

onClick={listening ? stopSpeaking : startSpeaking}

className="mt-6 bg-purple-600 text-white px-8 py-3 rounded-xl"

>

{listening ? "🛑 Stop Speaking" : "🎤 Start Speaking"}

</button>



<textarea

value={answer}

onChange={(e)=>setAnswer(e.target.value)}

className="w-full h-40 border rounded-xl mt-6 p-4"

placeholder="Your answer will appear here..."

 />



<button

onClick={nextQuestion}

className="mt-6 bg-green-600 text-white px-8 py-3 rounded-xl"

>

{

currentQuestion===questions.length-1

?

"Finish Interview"

:

"Next Question →"

}

</button>


</div>


</div>

</>

}



</div>

</div>

  );

}


export default Interview;