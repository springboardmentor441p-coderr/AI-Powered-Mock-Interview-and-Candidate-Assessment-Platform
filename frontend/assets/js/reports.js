/* =====================================================
   SmartHire AI
   Reports Module
   reports.js
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initializeReports();
});

/* =====================================================
   MAIN INITIALIZER
===================================================== */

async function initializeReports() {

    try {

        const reportData =
            await fetchLatestReport();

        const historyData =
            await fetchInterviewHistory();

        if (!reportData) {

            showEmptyState();
            return;
        }

        hideEmptyState();

        loadScores(reportData);

        loadStrengths(
            reportData.strengths
        );

        loadWeaknesses(
            reportData.weaknesses
        );

        loadFeedback(
            reportData.feedback
        );

        loadRecommendations(
            reportData.recommendations
        );

        loadInterviewHistory(
            historyData
        );

    } catch (error) {

        console.error(
            "Error loading report:",
            error
        );

        showEmptyState();
    }
}

/* =====================================================
   SCORE SECTION
===================================================== */

function loadScores(data) {

    setText("overallScore", data.overallScore);

    setText("technicalScore", data.technicalScore);

    setText("communicationScore", data.communicationScore);

    setText("problemSolvingScore", data.problemSolvingScore);

    setText("confidenceScore", data.confidenceScore);

    updateProgressBar(
        "technicalProgress",
        data.technicalScore
    );

    updateProgressBar(
        "communicationProgress",
        data.communicationScore
    );

    updateProgressBar(
        "problemSolvingProgress",
        data.problemSolvingScore
    );

    updateProgressBar(
        "confidenceProgress",
        data.confidenceScore
    );
}

/* =====================================================
   STRENGTHS
===================================================== */

function loadStrengths(strengths) {

    const container =
        document.getElementById("strengthsList");

    if (!container) return;

    container.innerHTML = "";

    strengths.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        container.appendChild(li);
    });
}

/* =====================================================
   WEAKNESSES
===================================================== */

function loadWeaknesses(weaknesses) {

    const container =
        document.getElementById("weaknessesList");

    if (!container) return;

    container.innerHTML = "";

    weaknesses.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        container.appendChild(li);
    });
}

/* =====================================================
   FEEDBACK
===================================================== */

function loadFeedback(feedback) {

    const container =
        document.getElementById("feedbackContainer");

    if (!container) return;

    container.innerHTML = "";

    feedback.forEach(item => {

        const card =
            document.createElement("div");

        card.classList.add("feedback-card");

        card.innerHTML = `
            <p>${item}</p>
        `;

        container.appendChild(card);
    });
}

/* =====================================================
   RECOMMENDATIONS
===================================================== */

function loadRecommendations(
    recommendations
) {

    const container =
        document.getElementById(
            "recommendationsContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    recommendations.forEach(item => {

        const card =
            document.createElement("div");

        card.classList.add(
            "recommendation-card"
        );

        card.innerHTML = `
            <p>${item}</p>
        `;

        container.appendChild(card);
    });
}

/* =====================================================
   INTERVIEW HISTORY
===================================================== */

function loadInterviewHistory(history) {

    const tableBody =
        document.getElementById(
            "historyTableBody"
        );

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!history || history.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No interview history available
                </td>
            </tr>
        `;

        return;
    }

    history.forEach(interview => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${interview.date}</td>
            <td>${interview.role}</td>
            <td>${interview.score}</td>
            <td>${interview.status}</td>
        `;

        tableBody.appendChild(row);
    });
}

/* =====================================================
   EMPTY STATE
===================================================== */

function showEmptyState() {

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const reportContent =
        document.getElementById(
            "reportContent"
        );

    if (emptyState)
        emptyState.style.display = "block";

    if (reportContent)
        reportContent.style.display = "none";
}

function hideEmptyState() {

    const emptyState =
        document.getElementById(
            "emptyState"
        );

    const reportContent =
        document.getElementById(
            "reportContent"
        );

    if (emptyState)
        emptyState.style.display = "none";

    if (reportContent)
        reportContent.style.display = "block";
}

/* =====================================================
   HELPERS
===================================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element)
        element.textContent = value;
}

function updateProgressBar(
    id,
    value
) {

    const bar =
        document.getElementById(id);

    if (!bar) return;

    bar.style.width = `${value}%`;
}

/* =====================================================
   FUTURE FLASK API
===================================================== */

async function fetchLatestReport() {

    try {

        const response =
            await fetch(
    "http://127.0.0.1:5000/api/reports/latest"
);

        if (!response.ok)
            throw new Error(
                "Failed to fetch report"
            );

        return await response.json();

    } catch (error) {

        console.error(error);

        return null;
    }
}

async function fetchInterviewHistory() {

    try {

        const response =
            await fetch(
                "http://127.0.0.1:5000/api/reports/history"
            );

        if (!response.ok) {

            throw new Error(
                "Failed to fetch history"
            );
        }

        return await response.json();

    } catch (error) {

        console.error(
            "History API Error:",
            error
        );

        return [];
    }
}

/* =====================================================
   MOCK DATA
===================================================== */

function getMockReportData() {

    return {

        overallScore: 84,

        technicalScore: 88,

        communicationScore: 80,

        problemSolvingScore: 85,

        confidenceScore: 82,

        strengths: [
            "Strong technical fundamentals",
            "Clear problem solving approach",
            "Good communication skills"
        ],

        weaknesses: [
            "Need better confidence",
            "Improve response speed"
        ],

        feedback: [
            "You demonstrated solid understanding of core concepts.",
            "Communication was effective but can be more concise.",
            "Confidence level was above average."
        ],

        recommendations: [
            "Practice more mock interviews",
            "Improve behavioral interview responses",
            "Focus on confidence building exercises"
        ],

        history: [
            {
                date: "2026-07-01",
                role: "Python Developer",
                score: 82,
                status: "Completed"
            },
            {
                date: "2026-07-10",
                role: "Backend Developer",
                score: 84,
                status: "Completed"
            },
            {
                date: "2026-07-15",
                role: "Software Engineer",
                score: 86,
                status: "Completed"
            }
        ]
    };
}