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

// Google Maps Functions located here 

// *************** DISPLAY INITIAL MAP ***************
function initMap() {
    // initial coordinates 
    const initial_coords = { lat: 43.400344826187, lng: -80.3250596245924};

    // create the initial map 
    const map = new google.maps.Map(document.getElementById('map'), {
        center: initial_coords,
        zoom: 12
    });

    // this just ecentuates the center for now 
    const marker = new google.maps.Marker({
        position: initial_coords, 
        map: map, 
        title: 'Canadia Land restaurant'
    });

    // making use of geolocation to automatically determine user location 
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            
            // data being packed after prompt confirmation
            const user_coordinates = {
                user_lat: position.coords.latitude,
                user_long: position.coords.longitude
            };
            
            // User Coordinates are here 
            console.log('*********************'); 
            console.log('Lat: ', user_coordinates.user_lat); 
            console.log('Long: ', user_coordinates.user_long);

  

            // Modifies the center of user location 
            map.setCenter({lat: user_coordinates.user_lat, lng: user_coordinates.user_long});

            // Modifies the marker
            marker.setPosition({lat: user_coordinates.user_lat, lng: user_coordinates.user_long});
            marker.setTitle('Current Location')

            // using the helper function below to search nearby restaurants 
            searchPOI(user_coordinates);


        }, function(error) {
            // In the event that user denies access to location
            console.error('Geolocation error: ', error);
        });

    } // end of if statement block

    else {
        // In the event that geolocation is not supported by the browser
        console.error('Geolocation is not supported by your browser');
    } 

} // end of display map function  

// Helper to look for nearby POI based off user location
function searchPOI(user_coordinates) {
    const googPlaceService = new google.maps.places.PlacesService(map);

    const request = {
        location: {lat: user_coordinates.user_lat, lng: user_coordinates.user_long},        // this will be automatically parsed 
        radius: 8047,                                                                       // going to try and make this adjustable 8047 correlates to 5 miles 
        type: 'restaurant'                                                                  // going to see if I can make buttons to change this category 
    };

    googPlaceService.nearbySearch(request, callback);
    console.log('Search function');
} // end of search function 


// Experiment with this function to determine another way to display results 
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (let i = 0; i < results.length; i++) {
            createRestMarker(results[i]);
            console.log('Found', i, 'places');
        }
        console.log(' call back function');
    } // if statement end 

    else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.log('No results found');
    } // else if statement end 

    else if (status === google.maps.places.PlacesServiceStatus.ERROR) {
        console.log('Error processing that request');
    } // else if statement end 

} // end of marker list function 

function createRestMarker(place) {
    const marker = new google.maps.Marker({
        map: map, 
        position: place.geometry.location,
        title: place.name
    });

    // 'place' information window 
    const infowindow = new google.maps.InfoWindow({
        content: place.name
    });
    
    console.log('Before marker');

    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });

    console.log('After marker');
} // end of marker creation function 