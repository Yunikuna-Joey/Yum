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

    const data = JSON.stringify({
        username: username,
        password_hash: password, 
    });
    

    request.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200) {
                const response = JSON.parse(this.responseText);
                if (response.error) {
                    console.log('Error:', response.error);
                    document.getElementById('error-response').innerHTML = response.error;
                } else {
                    console.log('Redirecting to: ', response.redirect);
                    window.location.href = response.redirect;
                }
            } 
            // triggering our logic of unauthorized
            else if (this.status === 401) {
                const response = JSON.parse(this.responseText);
                console.log('Unauthorized:', response.error);
                document.getElementById('error-response').innerHTML = response.error;
            } 
            else {
                console.error('Error:', this.status, this.statusText);
            }
        }
    };
    request.send(data);
    return false;
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
    const displayName = encodeURIComponent( 
        document.getElementById('display-name').value
    )

    const email = document.getElementById('email-reg').value.trim();

    const username = encodeURIComponent(
        document.getElementById('username-reg').value.trim()
    );

    const password = encodeURIComponent( 
        document.getElementById('password-reg').value
    );

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
        displayName: displayName,
        email: email,
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
// * NEW
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// * NEW
function reset_listener() {
    const password = encodeURIComponent( 
        document.getElementById('new-pw').value
    );

    const confirmation = encodeURIComponent(
        document.getElementById('confirm-pw').value
    );

    const feedback = document.getElementById('error-response');
    const button = document.getElementById('btn');

    const isValidLength = password.length >= 8; 
    const upperCase = /[A-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!isValidLength && password.length > 0) {
        feedback.innerText = 'Password must be at least 8 characters long...';
    }
    else if (!upperCase && password.length > 0) {
        feedback.innerText = 'Password must include one uppercase letter!';
    }
    else if (!hasSymbol && password.length > 0) {
        feedback.innerText = 'Password must include one symbol!';
    }
    else if (password !== confirmation && password.length > 0) {
        feedback.innerText = 'Passwords must match!';
    }
    else {
        feedback.innerText = '';
    }

    button.disabled = !isValidLength || !upperCase || !hasSymbol || password !== confirmation;   
    
    document.getElementById('new-pw').addEventListener('keyup', reset_listener);
    document.getElementById('confirm-pw').addEventListener('keyup', reset_listener);

}

// * NEW
function reg_listener() {
        // * NEW
        const password = encodeURIComponent( 
            document.getElementById('password-reg').value
        );
    
        const confirmation = encodeURIComponent( 
            document.getElementById('confirm-password-reg').value
        );

        const email = document.getElementById('email-reg').value;
        const feedback = document.getElementById('error-response');
        const button = document.getElementById('btn');
            
        const isValidEmail = validateEmail(email);
        const isValidLength = password.length >= 8; 
        const upperCase = /[A-Z]/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
        if (!isValidLength && password.length > 0) {
            feedback.innerText = 'Password must be at least 8 characters long...';
        }
        else if (!isValidEmail && email.length > 0) {
            feedback.innerText = 'Not a valid email!';
        }
        else if (!upperCase && password.length > 0) {
            feedback.innerText = 'Password must include one uppercase letter!';
        }
        else if (!hasSymbol && password.length > 0) {
            feedback.innerText = 'Password must include one symbol!';
        }
        else if (password !== confirmation && password.length > 0) {
            feedback.innerText = 'Passwords must match!';
        }
        else {
            feedback.innerText = '';
        }
    
        button.disabled = !isValidLength || !upperCase || !hasSymbol || password !== confirmation || !isValidEmail;   
        
        document.getElementById('password-reg').addEventListener('keyup', reg_listener);
        document.getElementById('confirm-password-reg').addEventListener('keyup', reg_listener);
        document.getElementById('email-reg').addEventListener('keyup', reg_listener);
}

function searchUser() {
    const searchInput = document.getElementById('term');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.trim();
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
            searchResults.style.display = 'none';
        }
    });

    console.log('Search function called');
}

function displaySearchResults(data, searchResults) {
    searchResults.innerHTML = ''; // Clear previous results
    if (data.length > 0) {
        searchResults.style.display = 'block'; // Show the result box
        data.forEach(user => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');

            // * Proposed new change
            // const resultLink = document.createElement('a');
            // resultLink.href = `/profile/${user.username}`;
            // resultLink.textContent = user.username;
            // resultItem.appendChild(resultLink); 
            // searchResults.appendChild(resultItem);
            
            // * Old one that was displaying results
            resultItem.textContent = user.username;
            resultItem.addEventListener('click', function(event) {
                event.preventDefault(); 
                window.location.href = `/profile/${user.username}`;
            });

            searchResults.appendChild(resultItem);
        });
    } 
    else {
        searchResults.style.display = 'none'; // Hide the result box if no results
    }
}

function toggleUploadForm() {
    const uploadContainer = document.getElementById('upload-container');

    if (uploadContainer.style.display === 'none') {
        uploadContainer.style.display = 'block';
    }
    else {
        uploadContainer.style.display = 'none';
    }

    console.log('Toggle form');
}


// * WORK ON THIS
function getCSRFToken() {
    const name = 'token';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return '';
}

// * Like a review 
function likeReview(reviewId) {
    console.log('review id is', reviewId);
    var request = new XMLHttpRequest(); 
    request.open('POST', '/like/' + reviewId, true); 
    request.setRequestHeader('Content-Type', 'application/json')

    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                var response = JSON.parse(request.responseText);
                console.log(response)

                var likeCount = document.getElementById("like-count-" + reviewId);
                console.log('Element is', likeCount);
                if (likeCount) {
                    likeCount.innerHTML = response.likes;
                }
                else {
                    console.error('Like count element not found');
                }
            }
            else { 
                console.error('Error:', request.status);
            }
        }
    };

    request.send();
}

// * Repost a review
function repostReview() {
    var reviewId = document.getElementById('repostModal').getAttribute('data-review-id');
    var additionalComments = document.getElementById('additionalComments').value;
    var request = new XMLHttpRequest();
    console.log('review id is now ', reviewId);
    request.open('POST', '/repost/' + reviewId, true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                var response = JSON.parse(request.responseText);
                console.log(response);

                var original = !document.getElementById("repost-count-" + reviewId); 

                var repostCountId = original ? "repost-count-" + response.id : "repost-count-" + reviewId;
                var repostCount = document.getElementById(repostCountId); 
                
        
                if (repostCount) { 
                    repostCount.innerHTML = response.reposts;
                }
                else { 
                    console.log('Error:', request.status);
                }
                location.reload();
            } 
            
            else {
                console.error('Error: ', request.status);
            }
        }
    };

    var payload = JSON.stringify({ additional_comments: additionalComments });
    request.send(payload);

    closeModal();
}

function undoRepost(reviewId) { 
    console.log('PLEASE');
    var request = new XMLHttpRequest(); 
    console.log('HEHE ID', reviewId);
    request.open('POST', '/repost/' + reviewId, true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                var response = JSON.parse(request.responseText);
                console.log(response);

                var original = !document.getElementById("repost-count-" + reviewId); 

                var repostCountId = original ? "repost-count-" + response.id : "repost-count-" + reviewId;
                var repostCount = document.getElementById(repostCountId); 
                
        
                if (repostCount) { 
                    repostCount.innerHTML = response.reposts;
                }
                else { 
                    console.log('Error:', request.status);
                }
                location.reload();
            } 
            
            else {
                console.error('Error: ', request.status);
            }
        }
    };
    var payload = JSON.stringify({ additionalComments: ''});
    request.send(payload);
}

function openModal(reviewId) {
    var isReposter = document.getElementById('repost-count-' + reviewId).getAttribute('data-is-repost');
    console.log('This is repost', isReposter);

    if (isReposter === 'True') {
        undoRepost(reviewId);
    } 
    else {
        document.getElementById('repostModal').setAttribute('data-review-id', reviewId);
        document.getElementById('repostModal').style.display = 'block';
    }
}

function closeModal() {
    document.getElementById('repostModal').style.display = 'none';
}

// * follow user function
function followUser() {
    const userId = document.getElementById('follow-btn').getAttribute('data');
    const followbtn = document.getElementById('follow-btn');
    const currentId = document.getElementById('username').getAttribute('data');

    // creates a new request
    const request = new XMLHttpRequest();

    const isFollowing = followbtn.classList.contains('following');
    const action = isFollowing ? 'unfollow' : 'follow';

    request.open('POST', `/${action}/${userId}`, true); 
    request.setRequestHeader('Content-Type', 'application/json'); 

    const data = JSON.stringify({
        user_id: currentId,
        friend_id: userId,
    });

    request.onload = function () { 
        if (request.status === 200) { 
            // change the text after the request is successful 
            followbtn.innerText = isFollowing ? 'Unfollow' : 'Follow';
            followbtn.classList.toggle('following', isFollowing);
            followbtn.classList.toggle('not-following', !isFollowing);

            // refresh the page after the follow or unfollow action is completed
            window.location.reload();
        }
        else { 
            console.error('Error: ', request.status);
        }
    }; 

    request.onerror = function () { 
        console.error('Network error occurred.');
    };

    request.send(data); 
}

function timeListener() {
    console.log("test");
    document.addEventListener('DOMContentLoaded', function () {
        const timeElement = document.querySelectorAll('.timestamp');
        timeElement.forEach(element => {
            const value = element.getAttribute('data-timestamp');
            const format = timestampConverter(value);
            element.textContent = format;
        });
    });
    console.log('Ran convert1');
}

function timestampConverter(timestamp) {
    const current = new Date();
    const date = new Date(timestamp);
    const timeDiff = current - date;

    if (timeDiff < 24 * 60 * 60 * 1000) {
        const minutes = Math.floor(timeDiff / (60 * 1000));
        if (minutes < 60) {
            return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        } else {
            const hours = Math.floor(minutes / 60);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
    } else if (timeDiff < 48 * 60 * 60 * 1000) {
        return 'Yesterday';
    } else {
        // Format the date without hours and minutes
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleString('en-US', options);
    }
}

function triggerBio() {
    // Add the 'to-blur' class to elements behind the modal
    const elementsToBlur = document.querySelectorAll('.to-blur');
    elementsToBlur.forEach(element => {
        element.classList.add('to-blur');
    });

    // Get the current bio text
    const currentBio = document.getElementById('bio-content').textContent.trim();

    // get the current user name 
    const displayname = document.getElementById('bio-displayname').textContent.trim();
    
    document.getElementById('new-displayname').value = displayname
    // Set the current bio text to the textarea in the form
    document.getElementById('new-bio').value = currentBio;

    // Toggle the visibility of the modal
    document.getElementById('bio-form').style.display = 'flex';
}

function saveBio() {
    // Get the new bio from the textarea
    const newBio = document.getElementById('new-bio').value;
    const newDisplayName = document.getElementById('new-displayname').value;
 
    const data = JSON.stringify({ 
        bio: newBio, 
        displayname: newDisplayName,
    });

    const request = new XMLHttpRequest();

    request.open('POST', '/update_profile', true); 
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        if (request.status === 200) {
            console.log('Success');
            window.location.reload();
        }
        else {
            console.error('Failed');
        }
    };

    request.send(data);

    // Toggle the visibility of the modal
    document.getElementById('bio-form').style.display = 'none';

    // Remove the 'to-blur' class from elements behind the modal
    const elementsToBlur = document.querySelectorAll('.to-blur');
    elementsToBlur.forEach(element => {
        element.classList.remove('to-blur');
    });
}

function cancelBio() {
    // Remove the 'to-blur' class from elements behind the modal
    const elementsToBlur = document.querySelectorAll('.to-blur');
    elementsToBlur.forEach(element => {
        element.classList.remove('to-blur');
    });

    // Toggle the visibility of the modal
    document.getElementById('bio-form').style.display = 'none';
}

function loadfeedpage() {
    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            window.location.href = `/feed?lat=${lat}&lng=${lng}`;
        }, 
        error => {
            console.error('Error getting location: ', error);
            window.location.href = '/feed';
        }
    );
}

function updateMiles() {
    var mileage = document.getElementById('mileage').value;
    console.log('The mileage is ', mileage);

    var request = new XMLHttpRequest();
    request.open('POST', '/update_miles', true);
    request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    request.onload = function () {
        if (request.status === 200) {
            console.log('Update miles success');
            // Fetch and update data for the feed without reloading the page
            var feedRequest = new XMLHttpRequest();
            feedRequest.open('GET', '/feed_data', true);

            feedRequest.onload = function () {
                if (feedRequest.status === 200) {
                    var feedData = JSON.parse(feedRequest.responseText);
                    // Update the feed with the new data
                    updateFeed(feedData);
                } else {
                    console.error('Fetch feed data failed with status ', feedRequest.status);
                }
            };

            feedRequest.send();
        } else {
            console.error('Update miles failed with status ', request.status);
        }
    };

    request.send(JSON.stringify({ miles: mileage }));
}

function updateFeed(feedData) {
    var statusTable = document.getElementById('status-table');
    statusTable.innerHTML = ''; // Clear existing content

    // Loop through the feedData and create new rows for the table
    for (var i = 0; i < feedData.length; i++) {
        var item = feedData[i];

        var row = document.createElement('tr');
        row.className = 'status-update';

        var cell = document.createElement('td');

        // Create the content for each status update
        var statusUser = document.createElement('div');
        statusUser.className = 'status-user';

        var profilePicture = document.createElement('img');
        profilePicture.src = item.profile_picture;
        profilePicture.alt = 'status-picture';
        profilePicture.className = 'status-image';

        statusUser.appendChild(profilePicture);

        var userinfo = document.createElement('div');
        userinfo.className = 'status-userinfo';
        userinfo.innerHTML = item.author_display_name + '<br>' + item.username;

        var timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.setAttribute('data-timestamp', item.timestamp);
        timestamp.innerHTML = item.timestamp;

        statusUser.appendChild(userinfo);
        statusUser.appendChild(timestamp);

        var statusDetails = document.createElement('div');
        statusDetails.className = 'status-details';

        var leftContent = document.createElement('div');
        leftContent.className = 'left-content';

        var mapPin = document.createElement('i');
        mapPin.className = 'bx bxs-map-pin';

        leftContent.appendChild(mapPin);
        leftContent.innerHTML += item.place_title + '<br>';

        var middleBar = document.createElement('div');
        middleBar.className = 'middle-bar';

        var rightContent = document.createElement('div');
        rightContent.className = 'right-content';
        rightContent.innerHTML = 'Rating: ' + item.rating + '<br>' + item.content + '<br>';

        statusDetails.appendChild(leftContent);
        statusDetails.appendChild(middleBar);
        statusDetails.appendChild(rightContent);

        var statusIcons = document.createElement('div');
        statusIcons.className = 'status-icons';

        // ... (Add code to create like and repost icons)
        var statusIcons = document.createElement('div');
        statusIcons.className = 'status-icons';

        // Create like icon
        var likeIcon = document.createElement('i');
        likeIcon.className = 'bx bx-heart';
        likeIcon.onclick = function() {
            likeReview(item.id);
        };

        var likeCount = document.createElement('span');
        likeCount.className = 'like-count';
        likeCount.id = 'like-count-' + item.id;
        likeCount.innerHTML = ' ' + item.likes + ' ';

        // Create repost icon
        var repostIcon = document.createElement('i');
        repostIcon.className = 'bx bx-repost';
        repostIcon.onclick = function() {
            openModal(item.id);
        };

        var repostCount = document.createElement('span');
        repostCount.className = 'repost-count';
        repostCount.id = 'repost-count-' + item.id;
        repostCount.innerHTML = ' ' + item.reposts;

        statusIcons.appendChild(likeIcon);
        statusIcons.appendChild(likeCount);
        statusIcons.appendChild(repostIcon);
        statusIcons.appendChild(repostCount);

        cell.appendChild(statusUser);
        cell.appendChild(statusDetails);
        cell.appendChild(statusIcons);

        row.appendChild(cell);
        statusTable.appendChild(row);
    }
}

function tabListener() {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const followingContent = document.querySelector('.following-content');
    const followerContent = document.querySelector('.follower-content');

    function updateContent() {
        if (radioButtons[0].checked) {
            followingContent.style.display = 'flex';
            followerContent.style.display = 'none';
        } else {
            followingContent.style.display = 'none';
            followerContent.style.display = 'flex';
        }
    }

    // Initial update
    updateContent();

    // Add event listeners to radio buttons
    radioButtons.forEach(function (radioButton) {
        radioButton.addEventListener('change', updateContent);
    });
}

function feedListener() {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const feed1 = document.querySelector('.feed1');
    const feed2 = document.querySelector('.feed2');

    function updateContent() {
        if (radioButtons[0].checked) {
            feed1.style.display = 'flex';
            feed2.style.display = 'none';
        } else {
            feed1.style.display = 'none';
            feed2.style.display = 'flex';
        }
    }

    // Initial update
    updateContent();

    // Add event listeners to radio buttons
    radioButtons.forEach(function (radioButton) {
        radioButton.addEventListener('change', updateContent);
    });
}

function scrollListener() { 
    var navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 60) {
            navbar.classList.add('fixed-navbar');
        }
        else {
            navbar.classList.remove('fixed-navbar');
        }
    });
}

function searchUsers() {
    const searchInput = document.getElementById('user-search').value.toLowerCase();
    const cards = document.querySelectorAll('.cards');

    cards.forEach(card => {
        const cardContent = card.querySelector('.card-content');
        console.log(cardContent);
        const username = cardContent.querySelector('h3').innerText.toLowerCase();
        const bio = cardContent.querySelector('p:last-child').innerText.toLowerCase();

        const isMatch = username.includes(searchInput) || bio.includes(searchInput);

        card.style.display = isMatch ? 'flex' : 'none';
        cardContent.style.display = isMatch ? 'flex' : 'none';
    });
}
 
function clearSearch() {
    const searchInput = document.getElementById('user-search');
    searchInput.value = '';
    searchUsers(); // Call the search function to show all cards
}

function submitforgot() { 
    // grab the value from front end 
    const value = document.getElementById('email').value;
    console.log(value)

    if (!validateEmail(value)) { 
        document.getElementById('error-response').innerHTML = 'Not a valid email';
        return;
    }
    
    // back the data into dict form
    const data = JSON.stringify({
        'email': value,
    });

    // create a new request
    const request = new XMLHttpRequest();

    request.open('POST', '/submitforgot', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () { 
        if (request.status === 200) {
            const response = JSON.parse(request.responseText);
            if (response.status === 'success') {
                console.log('Success');
                document.getElementById('error-response').innerHTML = response.message;
            }
            else if (response.status === 'error') {
                console.error('Error occurred: ', response.message);
                document.getElementById('error-response').innerHTML = response.message;
            }
        }
        else {
            console.error('Error occurred');
        }
    };

    request.send(data);
}

function resetpw() {
    const value1 = document.getElementById('new-pw').value; 
    const value2 = document.getElementById('confirm-pw').value; 
    const token = document.getElementById('token').value;

    // console.log('this is javascript', token);

    const data = JSON.stringify({
        'pw': value1, 
        'cpw': value2,
        'token': token,
    });

    // console.log('This is value1', value1)
    // console.log('This is value2', value2)

    const request = new XMLHttpRequest();

    request.open('POST', '/reset_password/' + token, true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        if (request.status === 200) {
            const response = JSON.parse(request.responseText);
            if (response.status === 'success') {
                console.log('Success');
                document.getElementById('error-response').innerHTML = response.message;
                // window.location.reload();
            }
            else if (response.status === 'error') {
                console.error('Error occurred: ', response.message);
                document.getElementById('error-response').innerHTML = response.message;
            }
        }
        else {
            console.error('Error occurred');
            document.getElementById('error-response').innerHTML = 'Password reset failed';
        }
    };
    request.send(data);
}


// logout function to handle the anchor tag 
function logout(event) {
    // default behavior of anchor is GET requests and we are trying to create a POST request
    event.preventDefault(); 

    // Create form element 
    const form = document.createElement('form');
    form.method = 'post'; 
    form.action = '/logout'; 

    // * CSRF token (Cross Site Request Forgery) prevents malicious events [IMPLEMENT LATER]
    // const token = document.createElement('input');
    // token.type = 'hidden';
    // token.name = 'token';
    // token.value = getCSRFToken();

    // Create a submit button 
    const submitButton = document.createElement('input');
    submitButton.type = 'submit';

    // add the submit button into the form 
    // form.appendChild(token);
    form.appendChild(submitButton);

    // add the form into the body of main html document
    document.body.appendChild(form); 

    form.submit();
}

// *Google Maps Functions located here 
let map; 
let googPlaceService;


// *************** DISPLAY INITIAL MAP *************** Commented out our const map id variable and added to the function to accept the variable instead 
function initMap() {
    // initial coordinates 
    const initial_coords = { lat: 43.400344826187, lng: -80.3250596245924};

    // create the initial map 
    map = new google.maps.Map(document.getElementById('map'), {
        center: initial_coords,
        zoom: 12,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "poi.park",
              elementType: "geometry",
              stylers: [{ color: "#263c3f" }],
            },
            {
              featureType: "poi.park",
              elementType: "labels.text.fill",
              stylers: [{ color: "#6b9a76" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#212a37" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9ca5b3" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#746855" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry.stroke",
              stylers: [{ color: "#1f2835" }],
            },
            {
              featureType: "road.highway",
              elementType: "labels.text.fill",
              stylers: [{ color: "#f3d19c" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#2f3948" }],
            },
            {
              featureType: "transit.station",
              elementType: "labels.text.fill",
              stylers: [{ color: "#d59563" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#515c6d" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#17263c" }],
            },
          ],
    });

    // this just ecentuates the center for now 
    const marker = new google.maps.Marker({
        position: initial_coords, 
        map: map, 
        title: 'Canadia Land restaurant',
        icon: {
            url: 'static/uploads/marker.svg',
            scaledSize: new google.maps.Size(30, 30),
        },
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
            // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>') 
            // console.log('Lat: ', user_coordinates.user_lat); 
            // console.log('Long: ', user_coordinates.user_long);

  

            // Modifies the center of user location 
            map.setCenter({lat: user_coordinates.user_lat, lng: user_coordinates.user_long});

            // Modifies the marker
            marker.setPosition({lat: user_coordinates.user_lat, lng: user_coordinates.user_long});
            marker.setTitle('Current Location')
            marker.setIcon({
                url: 'static/uploads/marker.svg',
                scaledSize: new google.maps.Size(30, 30),
            })

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

} // end of display map function  


// * Helper function to look for nearby POI based off user location
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
    searchUser();
} // end of search function 


// * Displays the results of the businesses
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

// * Adds the business into the server database
function addMarkerModel(markerData) {
    const request = new XMLHttpRequest();
    
    request.open('POST', '/add_marker', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        // Successful request
        if (request.status === 200) {
            const data = JSON.parse(request.responseText); 
            // * [DEBUGGING]
            // console.log("this is the data being printed: ", data);
            
            // ** DEBUGGING for submission review
            // const markerId = data.marker_id; 
            // console.log("Javascript states this is the marker id in my Flask DB: ", markerId)

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
        place_id: markerData.place_id,
        address: markerData.vicinity,
    };

    request.send(JSON.stringify(requestData));
}

// * Ongoing list to add in restaurants with custom typings for user to see 
const customTypeMappings = {
    "Leatherby's Family Creamery" : "Ice Cream Shop", 
}; 

let currentWindow = null; 
let currentMarker = null; 

// * Create markers on businesses
function createRestMarker(locationData) {
    if (map instanceof google.maps.Map) {
        let customType = customTypeMappings[locationData.name];

        if (!customType && locationData.types && locationData.types.length > 0) {
            customType = locationData.types[0];
        }

        customType = customType || 'Restaurant';

        const marker = new google.maps.Marker({
            map: map, 
            position: locationData.geometry.location, 
            title: locationData.name, 
            animation: google.maps.Animation.DROP, 
            icon: {
                url: 'static/uploads/marker.svg',
                scaledSize: new google.maps.Size(30, 30),
            }
        }); 

        addMarkerModel(locationData);  
        // locationData.marker_id is undefined
        // console.log("This is locationData", locationData);

        // 'place' information window 
        const infowindow = new google.maps.InfoWindow({
            // content: `<strong>${place.name}</strong><br>Global Rating: ${place.rating || 'Not available'}`,
            content: `
                <strong>${locationData.name}</strong><br>
                Rating: ${locationData.rating || 'Not available'}<br>
                Reviews: ${locationData.reviewCount || 0}<br>
                Type: ${customType}

                <form id=review-form>
                    <label for="review-content"> Leave a Review:</label>
                    <textarea id="review-content" name="review-content" rows="4" cols="50"></textarea><br>

                    <label for="review-rating"> Rating: </label>
                    <input type="number" id="review-rating" name="review-rating" min="1" max="5" required><br>

                    <button type="button" id="submit-review-btn">Submit Review</button>
                </form>
            `,

            // * this will list the other types associated with a marker 
            // * [work with this to achieve targeted behavior]
            // content: `<strong>${locationData.name}</strong><br>
            //   Rating: ${locationData.rating || 'Not available'}<br>
            //   Reviews: ${locationData.reviewCount || 0}<br>
            //   Type: ${locationData.types ? locationData.types[0] : 'Not available'}`,
        }); 

        // let isOpen = false;

        marker.addListener('click', function() {
            const markerWindow = document.getElementById('markerwindow');
            if (currentMarker === marker) {
                currentWindow.close();
                markerWindow.style.display = 'none';
                currentMarker = currentInfoWindow = null;
                // currentMarker = currentWindow = null;
            } 
            else {
                if (currentWindow) {
                    currentWindow.close();
                    markerWindow.style.display = 'none';
                }
                const markerId = locationData.place_id;
                const reviewCheckData = JSON.stringify({ place_id: markerId});
                const reviewCheckRequest = new XMLHttpRequest(); 
                reviewCheckRequest.open('POST', '/check_review_status', true);
                reviewCheckRequest.setRequestHeader('Content-Type', 'application/json');

                reviewCheckRequest.onload = function () {
                    if (reviewCheckRequest.status === 200) {
                        const reviewStatus = JSON.parse(reviewCheckRequest.responseText);

                        if (reviewStatus.status === 'reviewed') {
                            const prevRating = document.createElement('div');
                            prevRating.innerHTML = `Your rating: ${reviewStatus.rating}`;
                            markerWindow.appendChild(prevRating);

                            const reviewForm = document.getElementById('review-form');
                            reviewForm.style.display = 'none';
                        } 
                        else {
                            infowindow.open(map, marker);
                            infowindow.addListener('domready', function () {
                                const button = document.getElementById('submit-review-btn');
                                button.addEventListener('click', function () {
                                    submitReview(locationData.place_id);
                                });
                            });
                        }
                    }
                    else {
                        console.error('Error checking review status: ', reviewCheckRequest.status);
                    }
                };

                reviewCheckRequest.send(reviewCheckData);
    
                infowindow.open(map, marker);

                infowindow.addListener('domready', function () {
                    const id = locationData.place_id;
                    // console.log('This id is', id);
                    // ** PREV 
                    const button = document.getElementById('submit-review-btn');
                    button.addEventListener('click', function () {
                        submitReview(locationData.place_id);
                    });
                });
                
                // we need to have following reviews located in here 
                markerContent = `                
                    <strong>${locationData.name}</strong><br>
                    Rating: ${locationData.rating || 'Not available'}<br>
                    Reviews: ${locationData.reviewCount || 0}<br>
                    Type: ${customType}<br>
                `
                markerWindow.innerHTML = markerContent;
                markerWindow.style.display = 'block';
    
                currentMarker = marker;
                currentWindow = infowindow;
    
                infowindow.addListener('closeclick', function () {
                    markerWindow.style.display = 'none';
                    currentMarker = currentInfoWindow = null;
                    // currentMarker = currentWindow = null;
                });

                                
                // try to fetch reviews 
                const followingReviewRequest = new XMLHttpRequest(); 
                followingReviewRequest.open('POST', '/get_following_reviews', true);
                followingReviewRequest.setRequestHeader('Content-Type', 'application/json');
                followingReviewRequest.onload = function () {
                    if (followingReviewRequest.status === 200) {
                        const followingReviews = JSON.parse(followingReviewRequest.responseText);
                        markerContent += '<strong>Following Reviews: </strong> <br>';
                        for (const review of followingReviews) {
                            const timeDifference = Date.now() - new Date(review.timestamp);

                            let timestamp;

                            // Check if more than 48 hours old
                            if (timeDifference > 48 * 60 * 60 * 1000) {
                                const date = new Date(review.timestamp);
                                timestamp = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                            }
                            // Check if more than 24 hours old
                            else if (timeDifference > 24 * 60 * 60 * 1000) {
                                timestamp = 'Yesterday';
                            }
                            // Less than 24 hours old, display hours and minutes
                            else {
                                const hours = Math.floor(timeDifference / (60 * 60 * 1000));
                                const minutes = Math.floor((timeDifference % (60 * 60 * 1000)) / (60 * 1000));
                                timestamp = `${hours}h ${minutes}m ago`;
                            }
                            markerContent += `
                            <br>
                                <div id="status-container" style="margin-bottom: 0; border: 1px solid #181f23; border-radius: 5px;">
                                    <table id="status-table" style="width: 100%;"> 
                                        <tr class="status-update">
                                            <div style="margin-top: 5px; margin-left: 5px; display: flex; align-items: center;">
                                                <img src="${review.author_picture}" alt="Profile Picture" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 10px;">
                                                <a href="/profile/${review.author_username}" style="color: black;"> ${review.author_display_name} </a>
                                                <div style="padding: 10px; margin-left: auto;"> ${timestamp} </div> 
                                            </div>
                                            <td style="padding: 5px;">
                                                ${review.content} - ${review.rating}

                                                <div class="status-icons" style="margin-top: 10px; font-size: 22px;">
                                                    <i class='bx bx-heart' onclick="likeReview('${review.id}')"></i>
                                    
                                                    <span id="like-count-${review.id}" class="like-count" style="display: inline-block;
                                                        position: relative;
                                                        margin-top: 5px; 
                                                        margin-left: 5px;
                                                        top: -3.5px;
                                                        right: 2px;
                                                        font-family: 'Open Sans', sans-serif;
                                                        font-size: 18px;">

                                                    ${review.likes}
                                                    </span>
                                                </div> 
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                            `;
                        }
                        markerWindow.innerHTML = markerContent;
                        markerWindow.style.display = 'block';
                    }
                    else {
                        console.error('Error fetching following reviews: ', followingReviewRequest.status);
                    }
                };
                followingReviewRequest.send(reviewCheckData);
            }
        });
    } // end of if statement 

    else {
        console.error('Map is not a valid instance of google.maps.Map.');
    }
} // end of createRestMarker function 

// * Submit review function
let isSubmitting = false;  

function submitReview(markerId) {

    const content = document.getElementById('review-content').value; 
    const rating = document.getElementById('review-rating'); 
    const ratingValue = parseInt(rating.value, 10); 

    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'err-msg';
        errorMessage.textContent = 'Please enter a valid rating (1 - 5)';
        errorMessage.style.color = 'red';

        const reviewForm = document.getElementById('review-form');
        reviewForm.appendChild(errorMessage);
        return;
    }

    if (isSubmitting) {
        console.log('Currently submitting. Wait.');
        return;
    }

    isSubmitting = true;

    // * DEBUGGING in console
    // console.log('Review is ', content);
    // console.log('Rating is ', rating);
    // console.log('The marker id is: ', markerId)

    // * NEW 
    // check if the review has already been submitted 
    const markerWindow = document.getElementById('markerwindow');
    const existingRating = markerWindow.querySelector('.user-rating');
    if (existingRating) {
        console.log('Review already submitted');
        return;
    }

    
    const data = JSON.stringify({
        place_id: markerId, 
        content: content, 
        rating: ratingValue, 
    }); 

    const request = new XMLHttpRequest(); 
    request.open('POST', '/submit_review', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                isSubmitting = false;
                const response = JSON.parse(request.responseText);
                console.log('Review submitted successfully: ', response);
                
                // * OLD
                const button = document.getElementById('submit-review-btn');
                button.removeEventListener('click', submitReview);

                // replaces the review form content with this
                const markerWindow = document.getElementById('markerwindow');
                const currentRating = document.createElement('div');
                currentRating.innerHTML = `Your Rating: ${ratingValue}`;
                markerWindow.appendChild(currentRating);

                // hides the review form after submitting review
                const reviewForm = document.getElementById('review-form');
                reviewForm.style.display = 'none';
            }
            else {
                console.error('Error submitting review: ', request.status);
            }
        }
    }; 

    request.send(data);
}