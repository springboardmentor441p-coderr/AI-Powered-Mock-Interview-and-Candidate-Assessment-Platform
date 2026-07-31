/* ==========================================================
   SmartHire AI
   Resume Module
========================================================== */

"use strict";

/* ==========================================================
   Resume State
========================================================== */

const Resume={

    file:null,

    uploaded:false,

    analysis:null

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

    dropZone:
        document.getElementById("dropZone"),

    resumeInput:
        document.getElementById("resumeFile"),

    browseButton:
        document.getElementById("browseResumeBtn"),

    uploadBar:
        document.getElementById("uploadProgressBar"),

    uploadStatus:
        document.getElementById("uploadStatus"),

    uploadPercentage:
        document.getElementById("uploadPercentage"),

    fileName:
        document.getElementById("resumeFileName"),

    fileSize:
        document.getElementById("resumeFileSize"),

    uploadDate:
        document.getElementById("resumeUploadDate"),

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

            initializeUpload();

            await loadResume();

        }

        catch(error){

            console.error(error);

            showToast(

                "Unable to load resume page.",

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
   Upload Events
========================================================== */

function initializeUpload(){

    Elements.browseButton.addEventListener(

        "click",

        ()=>{

            Elements.resumeInput.click();

        }

    );

    Elements.resumeInput.addEventListener(

        "change",

        event=>{

            const file=event.target.files[0];

            if(file){

                processResume(file);

            }

        }

    );

    Elements.dropZone.addEventListener(

        "dragover",

        event=>{

            event.preventDefault();

            Elements.dropZone.classList.add(

                "dragover"

            );

        }

    );

    Elements.dropZone.addEventListener(

        "dragleave",

        ()=>{

            Elements.dropZone.classList.remove(

                "dragover"

            );

        }

    );

    Elements.dropZone.addEventListener(

        "drop",

        event=>{

            event.preventDefault();

            Elements.dropZone.classList.remove(

                "dragover"

            );

            const file=

                event.dataTransfer.files[0];

            if(file){

                processResume(file);

            }

        }

    );

}

/* ==========================================================
   Validate Resume
========================================================== */

function processResume(file){

    const allowed=[

        "application/pdf",

        "application/msword",

        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    ];

    if(

        !allowed.includes(file.type)

    ){

        showToast(

            "Upload PDF or DOCX only.",

            "error"

        );

        return;

    }

    if(

        file.size>

        10*1024*1024

    ){

        showToast(

            "Maximum size is 10 MB.",

            "error"

        );

        return;

    }

    Resume.file=file;

    showSelectedResume(file);

    uploadResume(file);

}

/* ==========================================================
   Display Selected File
========================================================== */

function showSelectedResume(file){

    Elements.fileName.textContent=file.name;

    Elements.fileSize.textContent=

        formatBytes(file.size);

    Elements.uploadDate.textContent=

        new Date().toLocaleString();

}
/* ==========================================================
   Upload Resume
========================================================== */

async function uploadResume(file){

    try{

        Elements.dropZone.classList.add(

            "uploading"

        );

        const formData=new FormData();

        formData.append(

            "resume",

            file

        );

        simulateProgress(20);

        const response=await apiRequest(

            API.RESUME.UPLOAD,

            "POST",

            formData,

            true

        );

        simulateProgress(100);

        Resume.uploaded=true;

        Resume.analysis=response.data;

        showToast(

            "Resume uploaded successfully.",

            "success"

        );

        renderAnalysis();

    }

    catch(error){

        console.error(error);

        resetProgress();

        showToast(

            error.message ||

            "Resume upload failed.",

            "error"

        );

    }

    finally{

        Elements.dropZone.classList.remove(

            "uploading"

        );

    }

}

/* ==========================================================
   Upload Progress
========================================================== */

function simulateProgress(value){

    if(Elements.uploadBar){

        Elements.uploadBar.style.width=

            `${value}%`;

    }

    if(Elements.uploadPercentage){

        Elements.uploadPercentage.textContent=

            `${value}%`;

    }

    if(Elements.uploadStatus){

        Elements.uploadStatus.textContent=

            value===100

            ? "Analysis Complete"

            : "Uploading Resume...";

    }

}

function resetProgress(){

    simulateProgress(0);

    if(Elements.uploadStatus){

        Elements.uploadStatus.textContent=

            "Waiting for upload...";

    }

}

/* ==========================================================
   Render Analysis
========================================================== */

function renderAnalysis(){

    if(!Resume.analysis) return;

    updateATSScore();

    renderMatchedKeywords();

    renderMissingKeywords();

    renderRecommendations();

    renderStatistics();

}

/* ==========================================================
   ATS Score
========================================================== */

function updateATSScore(){

    const score=

        Resume.analysis.ats_score || 0;

    const scoreElement=

        document.getElementById("atsScore");

    const circle=

        document.getElementById("scoreProgress");

    const quality=

        document.getElementById("resumeQuality");

    const keywordCount=

        document.getElementById("keywordCount");

    const missingCount=

        document.getElementById("missingKeywordCount");

    const rating=

        document.getElementById("resumeRating");

    scoreElement.textContent=

        `${score}%`;

    const circumference=452;

    const offset=

        circumference-

        (score/100)*circumference;

    circle.style.strokeDashoffset=

        offset;

    quality.textContent=

        Resume.analysis.quality ||

        "Good";

    keywordCount.textContent=

        Resume.analysis.matched_keywords.length;

    missingCount.textContent=

        Resume.analysis.missing_keywords.length;

    rating.textContent=

        Resume.analysis.rating ||

        "A";

}

/* ==========================================================
   Matched Keywords
========================================================== */

function renderMatchedKeywords(){

    const container=

        document.getElementById(

            "matchedKeywords"

        );

    container.innerHTML="";

    Resume.analysis.matched_keywords.forEach(

        keyword=>{

            const chip=

                document.createElement(

                    "span"

                );

            chip.className=

                "keyword-chip matched";

            chip.textContent=keyword;

            container.appendChild(chip);

        }

    );

}

/* ==========================================================
   Missing Keywords
========================================================== */

function renderMissingKeywords(){

    const container=

        document.getElementById(

            "missingKeywords"

        );

    container.innerHTML="";

    Resume.analysis.missing_keywords.forEach(

        keyword=>{

            const chip=

                document.createElement(

                    "span"

                );

            chip.className=

                "keyword-chip missing";

            chip.textContent=keyword;

            container.appendChild(chip);

        }

    );

}
/* ==========================================================
   Render AI Recommendations
========================================================== */

function renderRecommendations(){

    const container =
        document.getElementById(
            "recommendationList"
        );

    if(!container) return;

    container.innerHTML = "";

    const recommendations =
        Resume.analysis.recommendations || [];

    if(recommendations.length === 0){

        container.innerHTML = `
            <div class="recommendation-item">
                <i class="fa-solid fa-circle-check"></i>
                <div>
                    <h4>Excellent Resume</h4>
                    <p>No major improvements suggested.</p>
                </div>
            </div>
        `;

        return;
    }

    recommendations.forEach(item=>{

        const div=document.createElement("div");

        div.className="recommendation-item";

        div.innerHTML=`

            <i class="fa-solid fa-lightbulb"></i>

            <div>

                <h4>Recommendation</h4>

                <p>${item}</p>

            </div>

        `;

        container.appendChild(div);

    });

}

/* ==========================================================
   Resume Statistics
========================================================== */

function renderStatistics(){

    const stats = Resume.analysis.statistics || {};

    document.getElementById("wordCount").textContent =
        stats.word_count || 0;

    document.getElementById("pageCount").textContent =
        stats.page_count || 0;

    document.getElementById("skillsCount").textContent =
        stats.skills_found || 0;

    document.getElementById("experienceYears").textContent =
        stats.experience_years || 0;

}

/* ==========================================================
   Download Resume
========================================================== */

document
.getElementById("downloadResumeBtn")
?.addEventListener(

    "click",

    ()=>{

        window.open(

            API.RESUME.DOWNLOAD,

            "_blank"

        );

    }

);

/* ==========================================================
   Replace Resume
========================================================== */

document
.getElementById("replaceResumeBtn")
?.addEventListener(

    "click",

    ()=>{

        Elements.resumeInput.click();

    }

);

/* ==========================================================
   Delete Resume
========================================================== */

document
.getElementById("deleteResumeBtn")
?.addEventListener(

    "click",

    async()=>{

        if(

            !confirm(

                "Delete uploaded resume?"

            )

        ){

            return;

        }

        try{

            await apiRequest(

                API.RESUME.DELETE,

                "DELETE"

            );

            Resume.file=null;

            Resume.analysis=null;

            resetResumePage();

            showToast(

                "Resume deleted successfully.",

                "success"

            );

        }

        catch(error){

            console.error(error);

            showToast(

                "Unable to delete resume.",

                "error"

            );

        }

    }

);

/* ==========================================================
   Load Existing Resume
========================================================== */

async function loadResume(){

    try{

        const response=await apiRequest(

            API.RESUME.GET

        );

        if(!response.data){

            return;

        }

        Resume.analysis=response.data;

        Elements.fileName.textContent=
            response.data.filename || "Resume.pdf";

        Elements.fileSize.textContent=
            response.data.file_size || "--";

        Elements.uploadDate.textContent=
            response.data.uploaded_at || "--";

        if(response.data.user_name){

            Elements.headerUserName.textContent =
                response.data.user_name;
        }

        simulateProgress(100);

        renderAnalysis();

        loadHistory();

    }

    catch(error){

        console.log(

            "No uploaded resume found."

        );

    }

}

/* ==========================================================
   Analysis History
========================================================== */

async function loadHistory(){

    try{

        const response=await apiRequest(

            API.RESUME.HISTORY

        );

        const tbody=document.getElementById(

            "historyTableBody"

        );

        tbody.innerHTML="";

        (response.data || []).forEach(item=>{

            tbody.innerHTML+=`

            <tr>

                <td>${item.date}</td>

                <td>${item.filename}</td>

                <td>${item.score}%</td>

                <td>

                    <span class="status-badge status-success">

                        ${item.status}

                    </span>

                </td>

            </tr>

            `;

        });

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================
   Reset Resume UI
========================================================== */

function resetResumePage(){

    Elements.fileName.textContent =
        "No Resume Uploaded";

    Elements.fileSize.textContent = "--";

    Elements.uploadDate.textContent =
        "Upload a resume to begin analysis";

    resetProgress();

    document.getElementById("atsScore").textContent="0%";
    document.getElementById("resumeQuality").textContent="-";
    document.getElementById("keywordCount").textContent="0";
    document.getElementById("missingKeywordCount").textContent="0";
    document.getElementById("resumeRating").textContent="-";

    document.getElementById("matchedKeywords").innerHTML="";
    document.getElementById("missingKeywords").innerHTML="";
    document.getElementById("recommendationList").innerHTML="";
    document.getElementById("historyTableBody").innerHTML="";

    document.getElementById("wordCount").textContent="0";
    document.getElementById("pageCount").textContent="0";
    document.getElementById("skillsCount").textContent="0";
    document.getElementById("experienceYears").textContent="0";

    const circle=document.getElementById("scoreProgress");

    if(circle){

        circle.style.strokeDashoffset=452;

    }

}

/* ==========================================================
   Utilities
========================================================== */

function formatBytes(bytes){

    if(bytes===0){

        return "0 Bytes";

    }

    const k=1024;

    const sizes=[

        "Bytes",

        "KB",

        "MB",

        "GB"

    ];

    const i=Math.floor(

        Math.log(bytes)/Math.log(k)

    );

    return (

        parseFloat(

            (bytes/Math.pow(k,i)).toFixed(2)

        )+

        " "+

        sizes[i]

    );

}

/* ==========================================================
   End of Resume Module
========================================================== */