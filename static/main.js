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

function displaySearchResults(users, container) {
    container.innerHTML = '';

    if (users.length > 0) {
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.textContent = user.username;
            container.appendChild(userElement);
        }); 
    } 
    else {
        container.innerHTML = 'No matching users.';
    }
}

function searchUser() {
    const searchInput = document.getElementById('term');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', function() {
        const searchTerm = searchInput.value.trim();
        console.log(searchTerm);
        if (searchTerm !== '') {
            const request = new XMLHttpRequest();
            request.open('GET', `/search_users?term=${searchTerm}`, true);

            request.onload = function () {
                if (request.status === 200) {
                    const data = JSON.parse(request.responseText);
                    displaySearchResults(data, searchResults);
                }
                else {
                    console.error('Error: ', request.status);
                }
            };

            request.onerror = function () {
                console.error('Network error occurred');
            };

            request.send();
        }

        else {
            searchResults.innerHTML = '';
        }
    });
    
    console.log('Search function called');
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

// *Google Maps Functions located here 
let map; 
let googPlaceService;
const map_id = '{{ mapid }}';


// *************** DISPLAY INITIAL MAP *************** Commented out our const map id variable and added to the function to accept the variable instead 
function initMap() {
    // initial coordinates 
    const initial_coords = { lat: 43.400344826187, lng: -80.3250596245924};

    // create the initial map 
    map = new google.maps.Map(document.getElementById('map'), {
        center: initial_coords,
        zoom: 12,
        mapId: map_id
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
            
            // * User Coordinates are here [DEBUGGING]
            console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>') 
            console.log('Lat: ', user_coordinates.user_lat); 
            console.log('Long: ', user_coordinates.user_long);

  

            // Modifies the center of user location 
            map.setCenter({lat: user_coordinates.user_lat, lng: user_coordinates.user_long});

            // Modifies the marker
            marker.setPosition({lat: user_coordinates.user_lat, lng: user_coordinates.user_long});
            marker.setTitle('Current Location')

            // * using the helper function below to search nearby restaurants 
            // * comment out if you want to see the website without triggering the API 
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

    // * [DEBUGGING]
    console.log('Map id is: ', map_id);

} // end of display map function  


// Helper to look for nearby POI based off user location
function searchPOI(user_coordinates) {
    // this is supposedly creating a new instance of Places... so we are removing to test functionality 
    googPlaceService = new google.maps.places.PlacesService(map);

    const request = {
        location: {lat: user_coordinates.user_lat, lng: user_coordinates.user_long},        // this will be automatically parsed 
        radius: 100000,                                                                       // going to try and make this adjustable 8047 correlates to 5 miles 
        // refer to Places API documenatation for more categories to insert (possibly make buttons to change out the categories as per user request)
        types: ['food', 'restaurant', 'cafe', 'bakery', 'bar', 'meal_delivery', 'meal_takeaway', 'night_club'], 

        // * keywords is used for looking for specific restaurant names 'Bob's RESTAURANT', 'John's RESTAURANT' and etc
        keyword: 'coffee dessert restaurants'                          
    };

    googPlaceService.nearbySearch(request, callback);
    // * [DEBUGGING]
    console.log('Search function');
} // end of search function 


// Experiment with this function to determine another way to display results 
function callback(results, status, pagination) {
    total = 0;
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        // so far the loop is finishing with errors essentially 
        for (let i = 0; i < results.length; i++) {
            createRestMarker(results[i]);
            // * [DEBUGGING] 
            console.log('Found', i, 'places');
            total++;
        }

        // * logic to handle multiple markers within x radius
        if (pagination.hasNextPage) {
            pagination.nextPage();
        }
        else {
            // * [DEBUGGING]
            console.log('No more pages')
        }

        // * [DEBUGGING]
        console.log('call back function');
    } // if statement end 

    else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        // * [DEBUGGING]
        console.log('No results found');
    } // else if statement end 

    else if (status === google.maps.places.PlacesServiceStatus.ERROR) {
        // * [DEBUGGING]
        console.log('Error processing that request');
    } // else if statement end 

    // * [DEBUGGING]
    console.log('>>>>>>>>>>>>>>>>>>>>>>');
    console.log('Total places found', total);

} // end of marker list function 

function addMarkerModel(markerData) {
    const request = new XMLHttpRequest();
    
    request.open('POST', '/add_marker', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        // Successful request
        if (request.status === 200) {
            const data = JSON.parse(request.responseText); 
            // * [DEBUGGING]
            console.log(data)
        }
        else {
            console.error('Request Failed. Status: ', request.status);
        }
    };

    request.onerror = function() {
        console.error('Error adding marker');
    };

    const requestData = {
        lat: markerData.geometry.location.lat(), 
        lng: markerData.geometry.location.lng(), 
        title: markerData.name,
    };

    request.send(JSON.stringify(requestData));
}

// * Ongoing list to add in restaurants with custom typings for user to see 
const customTypeMappings = {
    "Leatherby's Family Creamery" : "Ice Cream Shop", 
}; 
let currentWindow = null; 
let currentMarker = null; 
function createRestMarker(place) {
    if (map instanceof google.maps.Map) {
        let customType = customTypeMappings[place.name];

        if (!customType && place.types && place.types.length > 0) {
            customType = place.types[0];
        }

        customType = customType || 'Restaurant';

        const marker = new google.maps.Marker({
            map: map, 
            position: place.geometry.location, 
            title: place.name, 
        }); 

        addMarkerModel(place);  

        // 'place' information window 
        const infowindow = new google.maps.InfoWindow({
            // content: `<strong>${place.name}</strong><br>Global Rating: ${place.rating || 'Not available'}`,
            content: `<strong>${place.name}</strong><br>
              Rating: ${place.rating || 'Not available'}<br>
              Reviews: ${place.reviewCount || 0}<br>
              Type: ${customType}`,

            // * this will list the other types associated with a marker 
            // * [work with this to achieve targeted behavior]
            // content: `<strong>${place.name}</strong><br>
            //   Rating: ${place.rating || 'Not available'}<br>
            //   Reviews: ${place.reviewCount || 0}<br>
            //   Type: ${place.types ? place.types[0] : 'Not available'}`,
        }); 

        // let isOpen = false;

        marker.addListener('click', function() {
            const markerWindow = document.getElementById('markerwindow');
            if (currentMarker === marker) {
                currentWindow.close();
                markerWindow.style.display = 'none';
                currentMarker = currentInfoWindow = null;
            } 
            else {
                if (currentWindow) {
                    currentWindow.close();
                    markerWindow.style.display = 'none';
                }
    
                infowindow.open(map, marker);
                markerWindow.innerHTML = infowindow.getContent();
                markerWindow.style.display = 'block';
    
                currentMarker = marker;
                currentWindow = infowindow;
    
                infowindow.addListener('closeclick', function () {
                    markerWindow.style.display = 'none';
                    currentMarker = currentInfoWindow = null;
                });
            }
        });
    } // end of if statement 

    else {
        console.error('Map is not a valid instance of google.maps.Map.');
    }
} // end of createRestMarker function 

