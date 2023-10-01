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
    

    xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                const response = JSON.parse(this.responseText);
                if (response.error) {
                    document.getElementById('error-response').innerHTML = response.error;
                }
                else {
                    window.location.href = response.redirect;
                }
            }

            else {
                console.error('Error:', this.status, this.statusText);
            }
        }
    };
    xhttp.send(data);
    return false;

    // xhttp.onload = function() {
    //     const response = JSON.parse(this.responseText); 
    //     if (response.error) {
    //         document.getElementById('error-response').innerHTML = response.error;
    //     }
    //     else {
    //         window.location.href = response.redirect;
    //     }
    // };
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

function register() {
    const username = encodeURIComponent(
        document.getElementById('username-reg').value
    );

    const password = encodeURIComponent( 
        document.getElementById('password-reg').value
    );

    // not sure if needed 
    const confirmation = encodeURIComponent( 
        document.getElementById('confirm-password-reg').value
    );

    const request = new XMLHttpRequest(); 
    // routes into the Flask file 
    request.open('POST', '/register');
    request.setRequestHeader('Content-Type', 'application/json');

    const data = JSON.stringify({
        // key = varied name, value = declared values {dictionary}
        username: username,
        password: password,
        cpass: confirmation,
    });
    
    request.send(data)

    request.onload = function () {
        const response = JSON.parse(this.responseText);
        if (response.error) {
            document.getElementById('error-response').innerHTML = response.error;
        } 

        else {
            console.log('Ran onload');
            window.location.href = response.redirect;
        }
    };

} 