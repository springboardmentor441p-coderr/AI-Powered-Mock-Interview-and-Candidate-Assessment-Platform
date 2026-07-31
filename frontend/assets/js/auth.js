/*
==========================================
SmartHire AI
Authentication JavaScript
==========================================
*/

const API = "http://127.0.0.1:5000";

// ---------------- Register ----------------

async function registerUser(event){

    event.preventDefault();

    const full_name = document.getElementById("full_name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const payload = {
        full_name,
        email,
        password,
        role:"candidate"
    };

    try{

        const response = await fetch(API + "/api/auth/register",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify(payload)

        });

        const data = await response.json();

        alert(data.message);

        if(response.ok){

            window.location.href="login.html";

        }

    }

    catch(err){

        console.log(err);

        alert("Server Error");

    }

}

// ---------------- Login ----------------

async function loginUser(event){

    event.preventDefault();

    const email=document.getElementById("email").value;
    const password=document.getElementById("password").value;

    try{

        const response=await fetch(API+"/api/auth/login",{

            method:"POST",

            headers:{
                "Content-Type":"application/json"
            },

            body:JSON.stringify({
                email,
                password
            })

        });

        const data=await response.json();

        if(response.ok){

            localStorage.setItem("token",data.access_token);

            localStorage.setItem("role",data.role);

            if(data.role==="candidate"){

                window.location.href="candidate_dashboard.html";

            }

            else if(data.role==="recruiter"){

                window.location.href="recruiter_dashboard.html";

            }

            else{

                window.location.href="admin_dashboard.html";

            }

        }

        else{

            alert(data.message);

        }

    }

    catch(error){

        console.log(error);

        alert("Unable to login");

    }

}

// ---------------- Logout ----------------

function logout(){

    localStorage.removeItem("token");
    localStorage.removeItem("role");

    window.location.href="login.html";

}

// ---------------- Authentication Check ----------------

function checkLogin(){

    const token=localStorage.getItem("token");

    if(!token){

        window.location.href="login.html";

    }

}