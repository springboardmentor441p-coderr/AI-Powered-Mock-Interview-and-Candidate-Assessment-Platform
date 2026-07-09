const questions = [
    "Welcome to SmartHire AI. Tell me about yourself.",
    "Why do you want to become a software engineer?",
    "Explain one project you have worked on."
];

let currentQuestion = 0;

const questionBox = document.getElementById("question");
const answerBox = document.getElementById("answer");

const startBtn = document.getElementById("startBtn");
const speakBtn = document.getElementById("speakBtn");
const listenBtn = document.getElementById("listenBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");


// Start Interview
startBtn.addEventListener("click", () => {

    questionBox.textContent = questions[currentQuestion];

    speakBtn.disabled = false;
    nextBtn.disabled = false;

});


// Text to Speech
speakBtn.addEventListener("click", () => {

    let speech = new SpeechSynthesisUtterance(
        questionBox.textContent
    );

    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);

});


// Speech to Text
listenBtn.addEventListener("click", () => {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser");
        return;
    }


    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.start();


    recognition.onresult = function(event) {

        let transcript =
            event.results[0][0].transcript;

        answerBox.value = transcript;

    };

});


// Next Question
nextBtn.addEventListener("click", () => {

    currentQuestion++;

    if(currentQuestion < questions.length){

        questionBox.textContent =
            questions[currentQuestion];

        answerBox.value = "";

    }
    else{

        questionBox.textContent =
            "Interview Completed";

        nextBtn.disabled = true;

    }

});


// End Interview
endBtn.addEventListener("click", () => {

    alert("Interview Ended");

    window.location.href="/";

});