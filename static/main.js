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

    if (confirm_password_reg !== password_reg) {
        document.getElementById('error-response').innerHTML = 'Passwords must match!'; 
        return;
    } 
    
    const data = {
        username: username_reg, 
        password: password_reg
    };

    const request = new XMLHttpRequest(); 
    request.open('POST', '/register', true); 
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        if (request.status === 200) {
            const data = JSON.parse(request.responseText); 
            if (data.error) {
                document.getElementById('error-response').innerHTML = data.error;
            } 
            else {
                window.location.href = data.redirect
            }
        }

        else {
            console.error('Error', request.status, request.statusText)
        }
    };

    request.onerror = function () {
        console.error('Request Failed');
    };

    request.send(JSON.stringify(data));

    

}