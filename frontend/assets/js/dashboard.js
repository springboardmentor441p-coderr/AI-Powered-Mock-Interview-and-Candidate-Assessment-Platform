/* ==========================================================
   SmartHire AI
   Dashboard JavaScript
   Version : 1.0
========================================================== */

"use strict";

/* ==========================================================
   Dashboard Controller
========================================================== */

const Dashboard = {

    user: null,

    stats: {},

    recommendations: [],

    recentInterviews: [],

    activities: [],

    upcomingInterviews: []

};

/* ==========================================================
   DOM Elements
========================================================== */

const Elements = {

    menuToggle:
        document.getElementById("menuToggle"),

    sidebar:
        document.querySelector(".sidebar"),

    logoutBtn:
        document.getElementById("logoutBtn"),

    dashboardSearch:
        document.getElementById("dashboardSearch"),

    welcomeName:
        document.getElementById("welcomeName"),

    userName:
        document.getElementById("userName"),

    totalInterviews:
        document.getElementById("totalInterviews"),

    atsScore:
        document.getElementById("atsScore"),

    averageScore:
        document.getElementById("averageScore"),

    skillLevel:
        document.getElementById("skillLevel"),

    resumeName:
        document.getElementById("resumeName"),

    resumeProgress:
        document.getElementById("resumeProgress"),

    resumeScoreText:
        document.getElementById("resumeScoreText"),

    recommendationContainer:
        document.getElementById("recommendationContainer"),

    interviewTable:
        document.getElementById("recentInterviewTable"),

    timeline:
        document.getElementById("activityTimeline"),

    upcomingContainer:
        document.getElementById("upcomingInterviewContainer")

};

/* ==========================================================
   Initialize Dashboard
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    async () => {

        try{

            checkAuthentication();

            initializeSidebar();

            initializeLogout();

            initializeSearch();

            await loadDashboard();

        }

        catch(error){

            console.error(error);

            showToast(
                error.message,
                "error"
            );

        }

    }

);

/* ==========================================================
   Authentication
========================================================== */

function checkAuthentication(){

    const token = Session.getToken();

    if(!token){

        window.location.href="login.html";

        return;

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

                "Are you sure you want to logout?"

            )){

                logout();

            }

        }

    );

}

/* ==========================================================
   Search
========================================================== */

function initializeSearch(){

    if(!Elements.dashboardSearch) return;

    Elements.dashboardSearch.addEventListener(

        "keyup",

        debounce(searchDashboard,300)

    );

}

function searchDashboard(event){

    const keyword = event.target.value

        .trim()

        .toLowerCase();

    console.log(

        "Searching:",

        keyword

    );

}
/* ==========================================================
   Load Dashboard
========================================================== */

async function loadDashboard(){

    try{

        await Promise.all([

            loadUserProfile(),

            loadDashboardStats(),

            loadResume(),

            loadRecentInterviews(),

            loadRecommendations(),

            loadPerformance(),

            loadUpcomingInterviews(),

            loadActivityTimeline()

        ]);

    }

    catch(error){

        console.error(

            "Dashboard Error:",

            error

        );

        showToast(

            "Unable to load dashboard.",

            "error"

        );

    }

}

/* ==========================================================
   User Profile
========================================================== */

async function loadUserProfile(){

    try{

        const response = await apiRequest(

            API.USER.PROFILE

        );

        Dashboard.user = response.data;

        if(Elements.userName){

            Elements.userName.textContent =

                Dashboard.user.full_name;

        }

        if(Elements.welcomeName){

            Elements.welcomeName.textContent =

                Dashboard.user.full_name;

        }

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================
   Dashboard Statistics
========================================================== */

async function loadDashboardStats(){

    try{

        const response = await apiRequest(

            API.REPORT.DASHBOARD

        );

        Dashboard.stats = response.data;

        updateStatistics();

    }

    catch(error){

        console.error(error);

    }

}

function updateStatistics(){

    if(!Dashboard.stats) return;

    Elements.totalInterviews.textContent =

        Dashboard.stats.total_interviews || 0;

    Elements.atsScore.textContent =

        `${Dashboard.stats.ats_score || 0}%`;

    Elements.averageScore.textContent =

        `${Dashboard.stats.average_score || 0}%`;

    Elements.skillLevel.textContent =

        Dashboard.stats.skill_level || "Beginner";

}

/* ==========================================================
   Resume
========================================================== */

async function loadResume(){

    try{

        const response = await apiRequest(

            API.RESUME.DETAILS

        );

        const resume = response.data;

        Elements.resumeName.textContent =

            resume.file_name;

        Elements.resumeScoreText.textContent =

            `ATS Score : ${resume.ats_score}%`;

        Elements.resumeProgress.style.width =

            `${resume.ats_score}%`;

    }

    catch(error){

        Elements.resumeName.textContent =

            "No Resume Uploaded";

        Elements.resumeProgress.style.width =

            "0%";

        Elements.resumeScoreText.textContent =

            "ATS Score : 0%";

    }

}

/* ==========================================================
   Recent Interviews
========================================================== */

async function loadRecentInterviews(){

    try{

        const response = await apiRequest(

            API.INTERVIEW.RESULT

        );

        Dashboard.recentInterviews =

            response.data;

        renderInterviewTable();

    }

    catch(error){

        console.error(error);

    }

}

function renderInterviewTable(){

    if(!Elements.interviewTable) return;

    if(

        Dashboard.recentInterviews.length===0

    ){

        return;

    }

    Elements.interviewTable.innerHTML="";

    Dashboard.recentInterviews.forEach(

        interview=>{

            const row=document.createElement("tr");

            row.innerHTML=`

                <td>${formatDate(interview.date)}</td>

                <td>${interview.role}</td>

                <td>${interview.score}%</td>

                <td>

                    <span class="badge badge-success">

                        Completed

                    </span>

                </td>

            `;

            Elements.interviewTable.appendChild(

                row

            );

        }

    );

}

/* ==========================================================
   Performance
========================================================== */

async function loadPerformance(){

    try{

        const response=await apiRequest(

            API.REPORT.DASHBOARD

        );

        updatePerformance(

            response.data

        );

    }

    catch(error){

        console.error(error);

    }

}

function updatePerformance(data){

    updateProgress(

        "communicationProgress",

        "communicationScore",

        data.communication || 0

    );

    updateProgress(

        "technicalProgress",

        "technicalScore",

        data.technical || 0

    );

    updateProgress(

        "confidenceProgress",

        "confidenceScore",

        data.confidence || 0

    );

    updateProgress(

        "problemProgress",

        "problemScore",

        data.problem_solving || 0

    );

}

function updateProgress(

    progressId,

    textId,

    value

){

    const progress=document.getElementById(

        progressId

    );

    const score=document.getElementById(

        textId

    );

    if(progress){

        progress.style.width=`${value}%`;

    }

    if(score){

        score.textContent=`${value}%`;

    }

}
/* ==========================================================
   AI Recommendations
========================================================== */

async function loadRecommendations(){

    try{

        const response = await apiRequest(

            API.REPORT.RECOMMENDATIONS

        );

        Dashboard.recommendations =

            response.data || [];

        renderRecommendations();

    }

    catch(error){

        console.error(error);

    }

}

function renderRecommendations(){

    if(!Elements.recommendationContainer) return;

    Elements.recommendationContainer.innerHTML="";

    if(Dashboard.recommendations.length===0){

        Elements.recommendationContainer.innerHTML=`

            <div class="alert alert-info">

                No AI recommendations available.

            </div>

        `;

        return;

    }

    Dashboard.recommendations.forEach(item=>{

        const card=document.createElement("div");

        card.className="recommendation-card";

        card.innerHTML=`

            <h4>

                <i class="fa-solid fa-lightbulb"></i>

                ${item.title}

            </h4>

            <p>

                ${item.description}

            </p>

        `;

        Elements.recommendationContainer.appendChild(card);

    });

}

/* ==========================================================
   Upcoming Interviews
========================================================== */

async function loadUpcomingInterviews(){

    try{

        const response = await apiRequest(

            API.INTERVIEW.UPCOMING

        );

        Dashboard.upcomingInterviews =

            response.data || [];

        renderUpcomingInterviews();

    }

    catch(error){

        console.error(error);

    }

}

function renderUpcomingInterviews(){

    if(!Elements.upcomingContainer) return;

    Elements.upcomingContainer.innerHTML="";

    if(Dashboard.upcomingInterviews.length===0){

        Elements.upcomingContainer.innerHTML=`

            <div class="empty-state">

                <h3>No Upcoming Interviews</h3>

                <p>

                    Schedule a mock interview to get started.

                </p>

            </div>

        `;

        return;

    }

    Dashboard.upcomingInterviews.forEach(interview=>{

        const card=document.createElement("div");

        card.className="upcoming-card";

        card.innerHTML=`

            <div class="upcoming-info">

                <h3>${interview.role}</h3>

                <p>${interview.company}</p>

            </div>

            <div class="upcoming-time">

                <strong>${interview.date}</strong>

                <span>${interview.time}</span>

            </div>

        `;

        Elements.upcomingContainer.appendChild(card);

    });

}

/* ==========================================================
   Activity Timeline
========================================================== */

async function loadActivityTimeline(){

    try{

        const response = await apiRequest(

            API.USER.ACTIVITY

        );

        Dashboard.activities =

            response.data || [];

        renderTimeline();

    }

    catch(error){

        console.error(error);

    }

}

function renderTimeline(){

    if(!Elements.timeline) return;

    Elements.timeline.innerHTML="";

    if(Dashboard.activities.length===0){

        Elements.timeline.innerHTML=`

            <div class="timeline-item">

                <div class="timeline-dot"></div>

                <div class="timeline-content">

                    <h4>

                        Welcome to SmartHire AI

                    </h4>

                    <p>

                        Your activity will appear here.

                    </p>

                    <small>

                        Just Now

                    </small>

                </div>

            </div>

        `;

        return;

    }

    Dashboard.activities.forEach(activity=>{

        const item=document.createElement("div");

        item.className="timeline-item";

        item.innerHTML=`

            <div class="timeline-dot"></div>

            <div class="timeline-content">

                <h4>${activity.title}</h4>

                <p>${activity.description}</p>

                <small>${activity.time}</small>

            </div>

        `;

        Elements.timeline.appendChild(item);

    });

}

/* ==========================================================
   Dashboard Search
========================================================== */

function filterDashboard(keyword){

    keyword = keyword.toLowerCase();

    document

        .querySelectorAll(

            ".card,.stat-card,.quick-card"

        )

        .forEach(element=>{

            const text=element.innerText.toLowerCase();

            element.style.display=

                text.includes(keyword)

                ? ""

                : "none";

        });

}

if(Elements.dashboardSearch){

    Elements.dashboardSearch.addEventListener(

        "input",

        debounce(event=>{

            filterDashboard(

                event.target.value

            );

        },300)

    );

}

/* ==========================================================
   Auto Refresh
========================================================== */

function startAutoRefresh(){

    setInterval(async()=>{

        await loadDashboardStats();

    },300000);

}

/* ==========================================================
   Window Resize
========================================================== */

window.addEventListener(

    "resize",

    ()=>{

        if(

            window.innerWidth>992 &&

            Elements.sidebar

        ){

            Elements.sidebar.classList.remove(

                "active"

            );

        }

    }

);

/* ==========================================================
   Global Error Handler
========================================================== */

window.addEventListener(

    "unhandledrejection",

    event=>{

        console.error(

            event.reason

        );

    }

);

/* ==========================================================
   Initialize Auto Refresh
========================================================== */

startAutoRefresh();

/* ==========================================================
   End of Dashboard
========================================================== */