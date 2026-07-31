/* ==========================================================
   SmartHire AI
   Profile Module
========================================================== */

"use strict";

/* ==========================================================
   Profile State
========================================================== */

const Profile = {

    data: {},

    completion: 0,

    photo: null

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

    saveProfileBtn:
        document.getElementById("saveProfileBtn"),

    resetProfileBtn:
        document.getElementById("resetProfileBtn"),

    changePasswordBtn:
        document.getElementById("changePasswordBtn"),

    profilePhoto:
        document.getElementById("profilePhoto"),

    profileImage:
        document.getElementById("profileImage"),

    profileName:
        document.getElementById("profileName"),

    headerUserName:
        document.getElementById("headerUserName"),

    profileCompletion:
        document.getElementById("profileCompletion"),

    completionBar:
        document.getElementById("completionBar"),

    completionText:
        document.getElementById("completionText")

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

            initializeEvents();

            await loadProfile();

        }

        catch(error){

            console.error(error);

            showToast(

                "Unable to load profile.",

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
   Events
========================================================== */

function initializeEvents(){

    if(Elements.profilePhoto){

        Elements.profilePhoto.addEventListener(

            "change",

            previewProfilePhoto

        );

    }

}

/* ==========================================================
   Load Profile
========================================================== */

async function loadProfile(){

    try{

        const response = await apiRequest(

            API.USER.PROFILE

        );

        Profile.data = response.data;

        populateProfile();

        updateCompletion();

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================
   Populate Fields
========================================================== */

function populateProfile(){

    const profile = Profile.data;

    setValue("fullName",profile.full_name);

    setValue("email",profile.email);

    setValue("phone",profile.phone);

    setValue("gender",profile.gender);

    setValue("dob",profile.date_of_birth);

    setValue("address",profile.address);

    setValue("city",profile.city);

    setValue("state",profile.state);

    setValue("country",profile.country);

    setValue("college",profile.college);

    setValue("university",profile.university);

    setValue("degree",profile.degree);

    setValue("branch",profile.branch);

    setValue("cgpa",profile.cgpa);

    setValue("graduationYear",profile.graduation_year);

    setValue("skills",profile.skills);

    setValue("certifications",profile.certifications);

    setValue("projects",profile.projects);

    setValue("experience",profile.experience);

    setValue("portfolio",profile.portfolio);

    setValue("linkedin",profile.linkedin);

    setValue("github",profile.github);

    if(profile.photo){

        Elements.profileImage.src = profile.photo;

    }

    Elements.profileName.textContent =

        profile.full_name || "Candidate";

    Elements.headerUserName.textContent =

        profile.full_name || "Candidate";

}

/* ==========================================================
   Helper
========================================================== */

function setValue(id,value){

    const element=document.getElementById(id);

    if(element){

        element.value=value || "";

    }

}
/* ==========================================================
   Save Profile
========================================================== */

if(Elements.saveProfileBtn){

    Elements.saveProfileBtn.addEventListener(

        "click",

        saveProfile

    );

}

async function saveProfile(){

    try{

        const payload = collectProfileData();

        validateProfile(payload);

        await apiRequest(

            API.USER.PROFILE,

            "PUT",

            payload

        );

        showToast(

            "Profile updated successfully.",

            "success"

        );

        Profile.data = payload;

        updateCompletion();

    }

    catch(error){

        console.error(error);

        showToast(

            error.message ||

            "Unable to update profile.",

            "error"

        );

    }

}

/* ==========================================================
   Collect Profile Data
========================================================== */

function collectProfileData(){

    return{

        full_name:getValue("fullName"),

        email:getValue("email"),

        phone:getValue("phone"),

        gender:getValue("gender"),

        date_of_birth:getValue("dob"),

        address:getValue("address"),

        city:getValue("city"),

        state:getValue("state"),

        country:getValue("country"),

        college:getValue("college"),

        university:getValue("university"),

        degree:getValue("degree"),

        branch:getValue("branch"),

        cgpa:getValue("cgpa"),

        graduation_year:getValue("graduationYear"),

        skills:getValue("skills"),

        certifications:getValue("certifications"),

        projects:getValue("projects"),

        experience:getValue("experience"),

        portfolio:getValue("portfolio"),

        linkedin:getValue("linkedin"),

        github:getValue("github")

    };

}

function getValue(id){

    const element=document.getElementById(id);

    return element ? element.value.trim() : "";

}

/* ==========================================================
   Validation
========================================================== */

function validateProfile(data){

    if(!data.full_name){

        throw new Error(

            "Full name is required."

        );

    }

    if(!data.email){

        throw new Error(

            "Email is required."

        );

    }

    if(data.phone && !/^[0-9]{10}$/.test(data.phone)){

        throw new Error(

            "Enter a valid mobile number."

        );

    }

}

/* ==========================================================
   Profile Completion
========================================================== */

function updateCompletion(){

    const fields=[

        "full_name",

        "email",

        "phone",

        "gender",

        "date_of_birth",

        "address",

        "city",

        "state",

        "country",

        "college",

        "university",

        "degree",

        "branch",

        "cgpa",

        "graduation_year",

        "skills",

        "projects",

        "linkedin",

        "github"

    ];

    let completed=0;

    fields.forEach(field=>{

        if(Profile.data[field]){

            completed++;

        }

    });

    const percentage=Math.round(

        (completed/fields.length)*100

    );

    Profile.completion=percentage;

    if(Elements.completionBar){

        Elements.completionBar.style.width=

            `${percentage}%`;

    }

    if(Elements.completionText){

        Elements.completionText.textContent=

            `${percentage}% Completed`;

    }

    if(Elements.profileCompletion){

        Elements.profileCompletion.textContent=

            `${percentage}% Complete`;

    }

}

/* ==========================================================
   Profile Photo Preview
========================================================== */

function previewProfilePhoto(event){

    const file=event.target.files[0];

    if(!file){

        return;

    }

    Profile.photo=file;

    const reader=new FileReader();

    reader.onload=function(e){

        Elements.profileImage.src=e.target.result;

    };

    reader.readAsDataURL(file);

    uploadProfilePhoto(file);

}

/* ==========================================================
   Upload Profile Photo
========================================================== */

async function uploadProfilePhoto(file){

    try{

        const formData=new FormData();

        formData.append(

            "photo",

            file

        );

        await apiRequest(

            API.USER.PHOTO,

            "POST",

            formData,

            true

        );

        showToast(

            "Profile photo updated.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            "Unable to upload photo.",

            "error"

        );

    }

}
/* ==========================================================
   Change Password
========================================================== */

if(Elements.changePasswordBtn){

    Elements.changePasswordBtn.addEventListener(

        "click",

        changePassword

    );

}

async function changePassword(){

    try{

        const currentPassword=getValue(

            "currentPassword"

        );

        const newPassword=getValue(

            "newPassword"

        );

        const confirmPassword=getValue(

            "confirmPassword"

        );

        if(!currentPassword){

            throw new Error(

                "Current password is required."

            );

        }

        if(newPassword.length<8){

            throw new Error(

                "Password must contain at least 8 characters."

            );

        }

        if(newPassword!==confirmPassword){

            throw new Error(

                "Passwords do not match."

            );

        }

        await apiRequest(

            API.USER.CHANGE_PASSWORD,

            "PUT",

            {

                current_password:currentPassword,

                new_password:newPassword

            }

        );

        document.getElementById(

            "passwordForm"

        ).reset();

        showToast(

            "Password updated successfully.",

            "success"

        );

    }

    catch(error){

        console.error(error);

        showToast(

            error.message ||

            "Unable to change password.",

            "error"

        );

    }

}

/* ==========================================================
   Reset Profile Form
========================================================== */

if(Elements.resetProfileBtn){

    Elements.resetProfileBtn.addEventListener(

        "click",

        ()=>{

            populateProfile();

            updateCompletion();

            showToast(

                "Profile restored.",

                "info"

            );

        }

    );

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

            "Unhandled Promise:",

            event.reason

        );

    }

);

/* ==========================================================
   Optional Auto Refresh
========================================================== */

function startProfileRefresh(){

    setInterval(async()=>{

        try{

            await loadProfile();

        }

        catch(error){

            console.error(error);

        }

    },600000);

}

startProfileRefresh();

/* ==========================================================
   Utility Functions
========================================================== */

function clearPasswordFields(){

    [

        "currentPassword",

        "newPassword",

        "confirmPassword"

    ].forEach(id=>{

        const element=document.getElementById(id);

        if(element){

            element.value="";

        }

    });

}

function disableButton(button,state){

    if(!button) return;

    button.disabled=state;

}

function setProfileImage(url){

    if(

        url &&

        Elements.profileImage

    ){

        Elements.profileImage.src=url;

    }

}

/* ==========================================================
   End of Profile Module
========================================================== */