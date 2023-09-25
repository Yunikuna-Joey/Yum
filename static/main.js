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