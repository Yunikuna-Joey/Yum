// login function (bring to next page)
function login() {
    const username = encodeURIComponent(
        document.getElementById('username').value
    );

    const password = encodeURIComponent(
        document.getElementById('password').value
    );

    const xhttp = new XMLHttpRequest(); 

    xhttp.open('POST', '/login');
    xhttp.setRequestHeader('Content-Type', 'application/json');

    const data = JSON.stringify({username: username, password: password});
    xhttp.send(data);

    xhttp.onload = function() {
        const response = JSON.parse(this.responseText); 
        if (response.error) {
            document.getElementById('error-response').innerHTML = response.error;
        }
        else {
            window.location.href = response.redirect;
        }
    };
}

/* 
CREATE - POST 
READ - GET 
UPDATE - PUT
DELETE - DELETE 
*/ 
function loadregisterpage() {

    event.preventDefault(); 

    const request = new XMLHttpRequest(); 
    request.open('GET', '/loadregisterpage'); 
    request.send() 

    request.onload = function () {
        if (request.status == 200) {
            window.location.href = '/loadregisterpage';
        }
        else {
            console.error('Failed to load register page')
        } 
    };
}

// function responsible for action of registering 
function register() {
    const username_reg = encodeURIComponent(
        document.getElementById('username-reg').value
    );

    const password_reg = encodeURIComponent(
        document.getElementById('password-reg').value
    );

    // not sure if this will be needed 
    const confirm_password_reg = encodeURIComponent(
        document.getElementById('confirm-password-reg').value
    );

    const xhttp = new XMLHttpRequest(); 
    xhttp.open('POST', '/register'); 
    xhttp.setRequestHeader('Content-Type', 'application/json');
    const data = JSON.stringify({
        username: username_reg,
        password: password_reg, 
        confirmpass: confirm_password_reg,
    });

    xhttp.send(data);
    xhttp.onload = function () {
        const response = JSON.parse(this.responseText);
        if (response.error) {
            document.getElementById('error-response').innerHTML = response.error;
        }
        else {
            window.location.href = response.redirect; 
        }
    };
}