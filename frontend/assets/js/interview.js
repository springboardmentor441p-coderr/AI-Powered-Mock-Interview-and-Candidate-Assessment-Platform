/* ==========================================================
   SmartHire AI
   Interview Module
========================================================== */

"use strict";

/* ==========================================================
   Interview State
========================================================== */

const Interview={

    stream:null,

    recognition:null,

    timer:null,

    remainingSeconds:0,

    questions:[],

    currentQuestion:0,

    transcript:"",

    answers:[],

    isRecording:false,

    isInterviewStarted:false

};

/* ==========================================================
   DOM Elements
========================================================== */

const Elements={

    menuToggle:
        document.getElementById("menuToggle"),

    sidebar:
        document.querySelector(".sidebar"),

    logoutBtn:
        document.getElementById("logoutBtn"),

    setupForm:
        document.getElementById("setupForm"),

    jobRole:
        document.getElementById("jobRole"),

    difficulty:
        document.getElementById("difficulty"),

    duration:
        document.getElementById("duration"),

    questionCount:
        document.getElementById("questionCount"),

    cameraPreview:
        document.getElementById("cameraPreview"),

    cameraPlaceholder:
        document.getElementById("cameraPlaceholder"),

    cameraStatus:
        document.getElementById("cameraStatus"),

    micStatus:
        document.getElementById("micStatus"),

    startCameraBtn:
        document.getElementById("startCameraBtn"),

    startMicBtn:
        document.getElementById("startMicBtn"),

    startInterviewBtn:
        document.getElementById("startInterviewBtn"),

    pauseInterviewBtn:
        document.getElementById("pauseInterviewBtn"),

    endInterviewBtn:
        document.getElementById("endInterviewBtn"),

    timer:
        document.getElementById("timer"),

    questionText:
        document.getElementById("questionText"),

    questionNumber:
        document.getElementById("questionNumber"),

    confidenceScore:
        document.getElementById("confidenceScore"),

    speechStatus:
        document.getElementById("speechStatus"),

    transcript:
        document.getElementById("liveTranscript"),

    answerInput:
        document.getElementById("answerInput"),

    progressBar:
        document.getElementById("interviewProgressBar"),

    progressText:
        document.getElementById("progressText"),

    remainingQuestions:
        document.getElementById("remainingQuestions"),

    headerUserName:
        document.getElementById("headerUserName")

};

/* ==========================================================
   Initialize
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async()=>{

        try{

            checkAuthentication();

            initializeSidebar();

            initializeLogout();

            initializeCamera();

            initializeMicrophone();

            initializeInterview();

            await loadProfile();

        }

        catch(error){

            console.error(error);

            showToast(

                "Unable to initialize interview.",

                "error"

            );

        }

    }

);

/* ==========================================================
   Authentication
========================================================== */

function checkAuthentication(){

    if(!Session.getToken()){

        window.location.href="login.html";

    }

}

/* ==========================================================
   Sidebar
========================================================== */

function initializeSidebar(){

    if(!Elements.menuToggle) return;

    Elements.menuToggle.addEventListener(

        "click",

        ()=>{

            Elements.sidebar.classList.toggle(

                "active"

            );

        }

    );

}

/* ==========================================================
   Logout
========================================================== */

function initializeLogout(){

    if(!Elements.logoutBtn) return;

    Elements.logoutBtn.addEventListener(

        "click",

        ()=>{

            if(confirm(

                "Logout from SmartHire AI?"

            )){

                logout();

            }

        }

    );

}

/* ==========================================================
   Camera
========================================================== */

function initializeCamera(){

    Elements.startCameraBtn.addEventListener(

        "click",

        startCamera

    );

}

async function startCamera(){

    try{

        Interview.stream=

            await navigator.mediaDevices.getUserMedia({

                video:true,

                audio:false

            });

        Elements.cameraPreview.srcObject=

            Interview.stream;

        Elements.cameraPreview.style.display="block";

        Elements.cameraPlaceholder.style.display="none";

        Elements.cameraStatus.textContent=

            "Camera Connected";

        showToast(

            "Camera started successfully.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to access camera.",

            "error"

        );

    }

}

/* ==========================================================
   Microphone
========================================================== */

function initializeMicrophone(){

    Elements.startMicBtn.addEventListener(

        "click",

        enableMicrophone

    );

}

async function enableMicrophone(){

    try{

        await navigator.mediaDevices.getUserMedia({

            audio:true

        });

        Elements.micStatus.textContent=

            "Microphone Connected";

        showToast(

            "Microphone enabled.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Microphone permission denied.",

            "error"

        );

    }

}

/* ==========================================================
   Interview Setup
========================================================== */

function initializeInterview(){

    Elements.startInterviewBtn.addEventListener(

        "click",

        startInterview

    );

}

/* ==========================================================
   Load Profile
========================================================== */

async function loadProfile(){

    try{

        const response=

            await apiRequest(

                API.PROFILE.GET

            );

        Elements.headerUserName.textContent=

            response.data.name;

    }

    catch(error){

        console.error(error);

    }

}
/* ==========================================================
   Start Interview
========================================================== */

async function startInterview(){

    try{

        if(!Elements.jobRole.value){

            showToast(

                "Please select a job role.",

                "warning"

            );

            return;

        }

        const payload={

            role:Elements.jobRole.value,

            difficulty:Elements.difficulty.value,

            duration:Number(Elements.duration.value),

            question_count:Number(Elements.questionCount.value)

        };

        const response=await apiRequest(

            API.INTERVIEW.START,

            "POST",

            payload

        );

        Interview.questions=response.data.questions || [];

        Interview.currentQuestion=0;

        Interview.answers=[];

        Interview.isInterviewStarted=true;

        Interview.remainingSeconds=

            payload.duration*60;

        startTimer();

        loadQuestion();

        updateProgress();

        Elements.startInterviewBtn.disabled=true;
        Elements.pauseInterviewBtn.disabled=false;
        Elements.endInterviewBtn.disabled=false;

        showToast(

            "Interview started successfully.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            error.message ||

            "Unable to start interview.",

            "error"

        );

    }

}

/* ==========================================================
   Timer
========================================================== */

function startTimer(){

    clearInterval(Interview.timer);

    updateTimerDisplay();

    Interview.timer=setInterval(()=>{

        Interview.remainingSeconds--;

        updateTimerDisplay();

        if(Interview.remainingSeconds<=0){

            clearInterval(Interview.timer);

            finishInterview();

        }

    },1000);

}

function updateTimerDisplay(){

    const minutes=Math.floor(

        Interview.remainingSeconds/60

    );

    const seconds=

        Interview.remainingSeconds%60;

    Elements.timer.textContent=

        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

}

/* ==========================================================
   Load Question
========================================================== */

function loadQuestion(){

    if(

        Interview.currentQuestion>=

        Interview.questions.length

    ){

        finishInterview();

        return;

    }

    Elements.questionText.textContent=

        Interview.questions[Interview.currentQuestion];

    Elements.questionNumber.textContent=

        `${Interview.currentQuestion+1} / ${Interview.questions.length}`;

    Elements.answerInput.value="";

    Elements.transcript.textContent="";

}

/* ==========================================================
   Speech Recognition
========================================================== */

function initializeSpeechRecognition(){

    const SpeechRecognition=

        window.SpeechRecognition ||

        window.webkitSpeechRecognition;

    if(!SpeechRecognition){

        showToast(

            "Speech Recognition not supported.",

            "warning"

        );

        return;

    }

    Interview.recognition=

        new SpeechRecognition();

    Interview.recognition.continuous=true;

    Interview.recognition.interimResults=true;

    Interview.recognition.lang="en-US";

    Interview.recognition.onstart=()=>{

        Interview.isRecording=true;

        Elements.speechStatus.textContent="Listening";

        document
            .getElementById("recordBtn")
            .classList.add("recording");

    };

    Interview.recognition.onresult=(event)=>{

        let transcript="";

        for(

            let i=event.resultIndex;

            i<event.results.length;

            i++

        ){

            transcript+=

                event.results[i][0].transcript;

        }

        Interview.transcript=transcript;

        Elements.transcript.textContent=

            transcript;

        Elements.answerInput.value=

            transcript;

    };

    Interview.recognition.onend=()=>{

        Interview.isRecording=false;

        Elements.speechStatus.textContent="Ready";

        document
            .getElementById("recordBtn")
            .classList.remove("recording");

    };

}

/* ==========================================================
   Recording Buttons
========================================================== */

document
.getElementById("recordBtn")
.addEventListener(

    "click",

    ()=>{

        if(

            !Interview.recognition

        ){

            initializeSpeechRecognition();

        }

        Interview.recognition.start();

    }

);

document
.getElementById("stopRecordBtn")
.addEventListener(

    "click",

    ()=>{

        if(

            Interview.recognition

        ){

            Interview.recognition.stop();

        }

    }

);

/* ==========================================================
   Submit Answer
========================================================== */

document
.getElementById("submitAnswerBtn")
.addEventListener(

    "click",

    async()=>{

        const answer=

            Elements.answerInput.value.trim();

        if(!answer){

            showToast(

                "Please answer the question.",

                "warning"

            );

            return;

        }

        Interview.answers.push({

            question:

                Interview.questions[Interview.currentQuestion],

            answer

        });

        showToast(

            "Answer submitted.",

            "success"

        );

        document
            .getElementById("nextQuestionBtn")
            .disabled=false;

    }

);

/* ==========================================================
   Next Question
========================================================== */

document
.getElementById("nextQuestionBtn")
.addEventListener(

    "click",

    ()=>{

        Interview.currentQuestion++;

        updateProgress();

        loadQuestion();

        this.disabled=true;

    }

);

/* ==========================================================
   Progress
========================================================== */

function updateProgress(){

    const progress=

        ((Interview.currentQuestion)

        /

        Interview.questions.length)

        *100;

    Elements.progressBar.style.width=

        `${progress}%`;

    Elements.progressText.textContent=

        `${Math.round(progress)}% Completed`;

    Elements.remainingQuestions.textContent=

        `Remaining Questions: ${Interview.questions.length-Interview.currentQuestion}`;

}
/* ==========================================================
   Pause / Resume Interview
========================================================== */

Elements.pauseInterviewBtn.addEventListener(

    "click",

    ()=>{

        if(

            Interview.timer

        ){

            clearInterval(

                Interview.timer

            );

            Interview.timer=null;

            Elements.pauseInterviewBtn.innerHTML=

                '<i class="fa-solid fa-play"></i> Resume';

            showToast(

                "Interview paused.",

                "warning"

            );

        }

        else{

            startTimer();

            Elements.pauseInterviewBtn.innerHTML=

                '<i class="fa-solid fa-pause"></i> Pause';

            showToast(

                "Interview resumed.",

                "success"

            );

        }

    }

);

/* ==========================================================
   End Interview
========================================================== */

Elements.endInterviewBtn.addEventListener(

    "click",

    ()=>{

        if(

            confirm(

                "End the interview?"

            )

        ){

            finishInterview();

        }

    }

);

/* ==========================================================
   Finish Interview
========================================================== */

async function finishInterview(){

    clearInterval(

        Interview.timer

    );

    Interview.timer=null;

    stopCamera();

    stopRecognition();

    try{

        const payload={

            answers:

                Interview.answers,

            role:

                Elements.jobRole.value,

            difficulty:

                Elements.difficulty.value,

            duration:

                Number(

                    Elements.duration.value

                )

        };

        const response=

            await apiRequest(

                API.INTERVIEW.SUBMIT,

                "POST",

                payload

            );

        displayResult(

            response.data

        );

    }

    catch(error){

        console.error(

            error

        );

        showToast(

            "Unable to evaluate interview.",

            "error"

        );

    }

}

/* ==========================================================
   Stop Camera
========================================================== */

function stopCamera(){

    if(

        !Interview.stream

    ){

        return;

    }

    Interview.stream

    .getTracks()

    .forEach(

        track=>track.stop()

    );

    Elements.cameraPreview.srcObject=null;

    Elements.cameraPreview.style.display="none";

    Elements.cameraPlaceholder.style.display="flex";

    Elements.cameraStatus.textContent=

        "Camera Stopped";

}

/* ==========================================================
   Stop Speech Recognition
========================================================== */

function stopRecognition(){

    if(

        Interview.recognition

    ){

        Interview.recognition.stop();

    }

    Elements.speechStatus.textContent=

        "Stopped";

}

/* ==========================================================
   Display Interview Result
========================================================== */

function displayResult(result){

    Elements.questionText.innerHTML=`

        Interview Completed 🎉

    `;

    Elements.answerInput.value="";

    Elements.transcript.textContent="";

    document

    .getElementById(

        "confidenceScore"

    )

    .textContent=

        result.confidence ||

        "90%";

    document

    .getElementById(

        "progressText"

    )

    .textContent=

        "100% Completed";

    Elements.progressBar.style.width=

        "100%";

    const feedback=`

Overall Score : ${result.score}

Technical Skills : ${result.technical_score}

Communication : ${result.communication_score}

Confidence : ${result.confidence}

Feedback :

${result.feedback}

`;

    alert(

        feedback

    );

    showToast(

        "Interview completed successfully.",

        "success"

    );

}

/* ==========================================================
   Reset Controls
========================================================== */

function resetInterview(){

    Interview.currentQuestion=0;

    Interview.questions=[];

    Interview.answers=[];

    Interview.transcript="";

    Interview.isInterviewStarted=false;

    Elements.startInterviewBtn.disabled=false;

    Elements.pauseInterviewBtn.disabled=true;

    Elements.endInterviewBtn.disabled=true;

    document

    .getElementById(

        "nextQuestionBtn"

    ).disabled=true;

    Elements.questionNumber.textContent="0 / 0";

    Elements.timer.textContent="00:00";

}

/* ==========================================================
   Before Page Exit
========================================================== */

window.addEventListener(

    "beforeunload",

    ()=>{

        stopCamera();

        stopRecognition();

        clearInterval(

            Interview.timer

        );

    }

);

/* ==========================================================
   End of Interview Module
========================================================== */