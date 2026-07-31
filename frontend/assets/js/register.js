const form = document.getElementById("registerForm");

const showPassword = document.getElementById("showPassword");

showPassword.addEventListener("change",()=>{

const password=document.getElementById("password");

const confirm=document.getElementById("confirmPassword");

password.type=showPassword.checked?"text":"password";

confirm.type=showPassword.checked?"text":"password";

});

form.addEventListener("submit",async function(e){

e.preventDefault();

const name=document.getElementById("name").value;

const email=document.getElementById("email").value;

const phone=document.getElementById("phone").value;

const role=document.getElementById("role").value;

const password=document.getElementById("password").value;

const confirm=document.getElementById("confirmPassword").value;

if(password!==confirm){

alert("Passwords do not match");

return;

}

try{

const response=await fetch("http://127.0.0.1:5000/api/auth/register",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

name,

email,

phone,

role,

password

})

});

const data=await response.json();

if(response.ok){

alert("Registration Successful");

window.location.href="login.html";

}

else{

alert(data.message);

}

}

catch(error){

alert("Backend Server Not Running");

}

});