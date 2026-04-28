// script.js
const createAccount = document.getElementById('createAccount');
myAccount.addEventListener('submit',
function(event){
    //prevents the page from refreshing 
    event.preventDefault();
    //Getting input values
    const email =document.getElementById('email').value;
    const password=document.getElementById('password').value;
    //Storing data in localStorage (Temporary database in browser)
    const userData={
        email: email,
        password:password
    };
localStorage.setItem('currentUser',
JSON.stringify(userData));
//Redirecting to Home page 
  window.location.href="Home.html"
});