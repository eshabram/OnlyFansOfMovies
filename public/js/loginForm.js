document.querySelector("#loginForm").addEventListener("submit",validateCredentials);

function validateCredentials(e){
  let errors = false;
  let username = document.querySelector("input[name=username]").value;
  //alert(username);
  let password = document.querySelector("input[name=password]").value;
  //alert(password);
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
}
  
  //TO COMPLETE
  //add condition satisfying username and password
