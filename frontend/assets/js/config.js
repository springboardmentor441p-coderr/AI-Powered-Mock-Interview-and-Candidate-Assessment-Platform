/* ==========================================================
   SmartHire AI
   Global Configuration
========================================================== */

"use strict";

/* ==========================================================
   API Configuration
========================================================== */

const CONFIG = Object.freeze({

    API_BASE_URL: "http://127.0.0.1:5000/api",

    APP_NAME: "SmartHire AI",

    APP_VERSION: "1.0.0",

    REQUEST_TIMEOUT: 30000

});

/* ==========================================================
   API Endpoints
========================================================== */

const API = Object.freeze({

    AUTH: {

        LOGIN: `${CONFIG.API_BASE_URL}/auth/login`,

        REGISTER: `${CONFIG.API_BASE_URL}/auth/register`,

        LOGOUT: `${CONFIG.API_BASE_URL}/auth/logout`,

        VERIFY_OTP: `${CONFIG.API_BASE_URL}/auth/verify-otp`,

        RESEND_OTP: `${CONFIG.API_BASE_URL}/auth/resend-otp`,

        FORGOT_PASSWORD:
            `${CONFIG.API_BASE_URL}/auth/forgot-password`,

        RESET_PASSWORD:
            `${CONFIG.API_BASE_URL}/auth/reset-password`

    },

    USER: {

        PROFILE:
            `${CONFIG.API_BASE_URL}/user/profile`,

        UPDATE_PROFILE:
            `${CONFIG.API_BASE_URL}/user/profile/update`

    },

    RESUME: {

        UPLOAD:
            `${CONFIG.API_BASE_URL}/resume/upload`,

        DETAILS:
            `${CONFIG.API_BASE_URL}/resume/details`

    },

    INTERVIEW: {

        START:
            `${CONFIG.API_BASE_URL}/interview/start`,

        NEXT:
            `${CONFIG.API_BASE_URL}/interview/next-question`,

        SUBMIT:
            `${CONFIG.API_BASE_URL}/interview/submit`,

        RESULT:
            `${CONFIG.API_BASE_URL}/interview/result`

    },

    REPORT: {

        DASHBOARD:
            `${CONFIG.API_BASE_URL}/report/dashboard`,

        DOWNLOAD:
            `${CONFIG.API_BASE_URL}/report/download`

    },

    ADMIN: {

        DASHBOARD:
            `${CONFIG.API_BASE_URL}/admin/dashboard`,

        USERS:
            `${CONFIG.API_BASE_URL}/admin/users`

    }

});

/* ==========================================================
   Local Storage Keys
========================================================== */

const STORAGE = Object.freeze({

    ACCESS_TOKEN: "smarthire_access_token",

    REFRESH_TOKEN: "smarthire_refresh_token",

    USER: "smarthire_user",

    OTP_EMAIL: "otp_email",

    THEME: "smarthire_theme",

    INTERVIEW_ID: "interview_id"

});

/* ==========================================================
   Session Helper
========================================================== */

const Session = {

    setToken(token) {

        localStorage.setItem(
            STORAGE.ACCESS_TOKEN,
            token
        );

    },

    getToken() {

        return localStorage.getItem(
            STORAGE.ACCESS_TOKEN
        );

    },

    removeToken() {

        localStorage.removeItem(
            STORAGE.ACCESS_TOKEN
        );

    },

    setUser(user) {

        localStorage.setItem(

            STORAGE.USER,

            JSON.stringify(user)

        );

    },

    getUser() {

        const user =
            localStorage.getItem(STORAGE.USER);

        return user
            ? JSON.parse(user)
            : null;

    },

    clear() {

        localStorage.removeItem(
            STORAGE.ACCESS_TOKEN
        );

        localStorage.removeItem(
            STORAGE.REFRESH_TOKEN
        );

        localStorage.removeItem(
            STORAGE.USER
        );

        localStorage.removeItem(
            STORAGE.INTERVIEW_ID
        );

    }

};

/* ==========================================================
   Authorization Header
========================================================== */

function getAuthHeaders(isFormData = false) {

    const token = Session.getToken();

    const headers = {};

    if (!isFormData) {

        headers["Content-Type"] = "application/json";

    }

    if (token) {

        headers["Authorization"] = `Bearer ${token}`;

    }

    return headers;

}

/* ==========================================================
   Universal API Request
========================================================== */

async function apiRequest(

    url,

    method = "GET",

    body = null,

    isFormData = false

) {

    const options = {

        method: method,

        headers: getAuthHeaders(isFormData)

    };

    if (body !== null) {

        options.body = body;

    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {

        controller.abort();

    }, CONFIG.REQUEST_TIMEOUT);

    options.signal = controller.signal;

    try {

        const response = await fetch(

            url,

            options

        );

        clearTimeout(timeout);

        let data = {};

        try {

            data = await response.json();

        }

        catch (e) {

            data = {};

        }

        if (!response.ok) {

            throw new Error(

                data.message ||

                data.msg ||

                `HTTP ${response.status}`

            );

        }

        return data;

    }

    catch (error) {

        clearTimeout(timeout);

        throw error;

    }

}

/* ==========================================================
   Application Info
========================================================== */

console.log(

    `${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} Loaded`

);