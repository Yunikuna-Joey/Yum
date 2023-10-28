// login function (bring to next page)
function login() {
    const username = encodeURIComponent(
        document.getElementById('username').value
    );

    const password = encodeURIComponent(
        document.getElementById('password').value
    );

    const request = new XMLHttpRequest(); 

    request.open('POST', '/login');
    request.setRequestHeader('Content-Type', 'application/json');

    const data = JSON.stringify({username: username, password: password});
    

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                const response = JSON.parse(this.responseText);
                if (response.error) {
                    console.log('Error: ', response.error);
                    document.getElementById('error-response').innerHTML = response.error;
                }
                else {
                    console.log('Redirecting to: ', response.redirect);
                    window.location.href = response.redirect;
                }
            }

            else {
                console.error('Error:', this.status, this.statusText);
            }
        }
    };
    request.send(data);
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

    request.onreadystatechange = function () {
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
        }
        else {
            console.error('Error:', this.status, this.statusText);
        }
    };
    
    request.send(data)
    return false;
} 

// Google Maps Functions located here 
function initMap() {
    // creating the instance of a map within the provided html tag / position
    const map = new google.maps.Map(document.getElementById('map-section'), {
        // default values of 0, 0 
        center: {user_lat: 43.400344826187, user_lng: -80.3250596245924},
        zoom: 12 
    });
    // error seems to be in this first portion with center being declared 


    // // Using 'geolocation' support as a way to parse user lat and long 
    // if (navigator.geolocation) {        // I think this is when the user is prompted && presses allow location premissions
    //     navigator.geolocation.getCurrentPosition(function (position) {
    //         const user_coordinates = {
    //             user_lat: position.coords.latitude,
    //             user_lng: position.coords.longitude
    //         };
            
    //         // DEBUGGING PLEASE LAT AND LONG
    //         console.log('*************************************');
    //         console.log('Lat: ', user_coordinates.user_lat);
    //         console.log('Long: ', user_coordinates.user_lng);

    //         // Allow us to center the map on user location
    //         map.setCenter(user_coordinates);

    //         // Creating a marker to distinctly see where user is 
    //         const marker = new google.maps.Marker({
    //             position: user_coordinates, 
    //             map: map, 
    //             title: 'Current Location'
    //         });

    //     }, function(error) {
    //         // In the event that user denies access 
    //         console.error('Geolocation error: ', error)
    //     });
    // }

    // else {
    //     // In the event that geolocation is not supported by the browser
    //     console.error('Geolocation is not supported by your browser.');
    // } 
}

// function initMap() {
//     const map = new google.maps.Map(document.getElementById('hero'), {
//         center: { lat: 38.42510222646131, lng: -121.39244868818646}, 
//         zoom: 15
//     });

//     const marker = new google.maps.Marker({
//         position: {lat: 38.42510222646131 , lng: -121.39244868818646}, 
//         map: map, 
//         title: 'Boba'
//     });
// } 


function logout() {
    // debugging here 
    console.log('Javascript logout');
    
    const request = new XMLHttpRequest();
    request.open('POST', '/logout');
    request.send(); 

    request.onload = function () {
        const response = JSON.parse(this.responseText);
        if (response.error) {
            document.getElementById('error-response').innerHTML = response.error;
        }
        else {
            window.location.href = response.redirect;
        }
    }
}
