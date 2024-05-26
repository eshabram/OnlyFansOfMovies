document.querySelector("#signupForm").addEventListener("submit",validateCredentials);

function validateCredentials(e){
  let errors = false;
  let username = document.querySelector("input[name=username]").value;
  let password = document.querySelector("input[name=password]").value;
 let rePassword = document.querySelector("#reEnter").value;

  document.querySelector("#invalidUser").style.color = "white";
  document.querySelector("#invalidUser").innerHTML = "";
  if(username.length < 5){
    document.querySelector("#invalidUser").style.color = "red";
  document.querySelector("#invalidUser").innerHTML = "Username should be atleast 5 characters and 1 digit";
    e.preventDefault();
  }
  document.querySelector("#invalidPass").style.color = "white";  document.querySelector("#invalidPass").innerHTML = "";
  
  if(password.length < 5){
  document.querySelector("#invalidPass").style.color = "red";  document.querySelector("#invalidPass").innerHTML = "Username should be atleast 5 characters and 1 digit";
    e.preventDefault();
  }

  document.querySelector("#nomatch").style.color = "white";  document.querySelector("#nomatch").innerHTML = "";
  if(password != rePassword){
    document.querySelector("#nomatch").style.color = "red";  document.querySelector("#nomatch").innerHTML = "Password did not match";
    e.preventDefault();
  }
}