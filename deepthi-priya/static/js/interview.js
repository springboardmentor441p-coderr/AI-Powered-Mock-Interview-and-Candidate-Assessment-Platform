const questions = [
    "Tell me about yourself.",
    "Why do you want to become a software engineer?",
    "Explain one project you have worked on."
];

let currentQuestion = 0;

const questionBox = document.getElementById("question");
const answerBox = document.getElementById("answer");
const startButton = document.getElementById("startBtn");
const nextButton = document.getElementById("nextBtn");
const endButton = document.getElementById("endBtn");


startButton.addEventListener("click", function () {

    currentQuestion = 0;

    questionBox.textContent = questions[currentQuestion];

    answerBox.value = "";

    nextButton.disabled = false;

});


nextButton.addEventListener("click", function () {

    currentQuestion++;

    if (currentQuestion < questions.length) {

        questionBox.textContent = questions[currentQuestion];
        answerBox.value = "";

    } else {

        questionBox.textContent = "Interview Completed!";
        nextButton.disabled = true;

    }

});


endButton.addEventListener("click", function () {

    alert("Interview Ended");

    window.location.href = "/";

});