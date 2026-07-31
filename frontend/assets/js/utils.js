/* ==========================================================
   SmartHire AI
   Common Utility Functions
========================================================== */

"use strict";

/* ==========================================================
   Validators
========================================================== */

const Validator = {

    email(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value.trim()
        );

    },

    phone(value) {

        return /^[6-9]\d{9}$/.test(
            value.trim()
        );

    },

    otp(value) {

        return /^\d{6}$/.test(
            value.trim()
        );

    },

    password(value) {

        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^]).{8,}$/
            .test(value);

    }

};

/* ==========================================================
   DOM Helpers
========================================================== */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);

/* ==========================================================
   Error Helpers
========================================================== */

function showError(element, message) {

    if (!element) return;

    element.textContent = message;

}

function clearError(element) {

    if (!element) return;

    element.textContent = "";

}

function clearErrors() {

    document
        .querySelectorAll(".error")
        .forEach(error => {

            error.textContent = "";

        });

}

/* ==========================================================
   Password Toggle
========================================================== */

function enablePasswordToggle() {

    $$(".toggle-password").forEach(icon => {

        icon.addEventListener("click", () => {

            const input = document.getElementById(
                icon.dataset.target
            );

            if (!input) return;

            if (input.type === "password") {

                input.type = "text";

                icon.classList.replace(
                    "fa-eye",
                    "fa-eye-slash"
                );

            } else {

                input.type = "password";

                icon.classList.replace(
                    "fa-eye-slash",
                    "fa-eye"
                );

            }

        });

    });

}

/* ==========================================================
   Password Strength
========================================================== */

function updatePasswordStrength(
    passwordInput,
    bar,
    label
) {

    if (!passwordInput || !bar || !label) return;

    passwordInput.addEventListener("input", () => {

        const value = passwordInput.value;

        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        const widths = [
            "0%",
            "20%",
            "40%",
            "60%",
            "80%",
            "100%"
        ];

        const colors = [
            "#e5e7eb",
            "#ef4444",
            "#f97316",
            "#eab308",
            "#22c55e",
            "#16a34a"
        ];

        const labels = [
            "Password Strength",
            "Weak",
            "Fair",
            "Good",
            "Strong",
            "Very Strong"
        ];

        bar.style.width = widths[score];
        bar.style.background = colors[score];
        label.textContent = labels[score];

    });

}

/* ==========================================================
   Loading Button
========================================================== */

function setButtonLoading(
    button,
    text = "Loading..."
) {

    if (!button) return;

    button.dataset.original = button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        ${text}
    `;

}

function resetButton(button) {

    if (!button) return;

    button.disabled = false;

    if (button.dataset.original) {

        button.innerHTML =
            button.dataset.original;

    }

}

/* ==========================================================
   Toast Notification
========================================================== */

function showToast(
    message,
    type = "success"
) {

    alert(message);

}

/* ==========================================================
   Navigation
========================================================== */

function redirect(url) {

    window.location.href = url;

}

/* ==========================================================
   Logout
========================================================== */

function logout() {

    if (typeof Session !== "undefined") {

        Session.clear();

    }

    redirect("login.html");

}

/* ==========================================================
   Date Formatter
========================================================== */

function formatDate(date) {

    return new Date(date)
        .toLocaleDateString("en-IN", {

            day: "2-digit",

            month: "short",

            year: "numeric"

        });

}

/* ==========================================================
   Debounce
========================================================== */

function debounce(callback, delay = 300) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            callback(...args);

        }, delay);

    };

}

/* ==========================================================
   Form Reset
========================================================== */

function resetForm(form) {

    if (!form) return;

    form.reset();

    clearErrors();

}

/* ==========================================================
   Initialization
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        enablePasswordToggle();

    }
);