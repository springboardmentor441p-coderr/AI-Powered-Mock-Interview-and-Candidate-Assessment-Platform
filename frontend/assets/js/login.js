const form = document.getElementById("loginForm");

form.addEventListener("submit", async function(e){

e.preventDefault();

const email=document.getElementById("email").value;

const password=document.getElementById("password").value;

if(email==="" || password===""){

alert("Fill all fields");

return;

}

try{

const response=await fetch("http://127.0.0.1:5000/api/auth/login",{

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

alert("Login Successful");

window.location.href="dashboard.html";

}

else{

alert(data.message);

}

}

catch(error){

alert("Backend not running");

}

});