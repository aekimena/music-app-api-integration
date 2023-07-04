import { clintId, clientSecret } from "./secret.js";

const AUTH_HEADER = btoa(`${clintId}:${clientSecret}`);

const TOKEN_URL = "https://accounts.spotify.com/api/token";

const SEARCH_URL = "https:/api.spotify.com/v1/search";

let SEARCH_QUERY;

const LIMIT = 10;
let searchDisplay = document.querySelector('.search-sugs');
let searchDisplayContainer = document.querySelector('.search-sugs-cont');
let inputValve = document.getElementById('search-form');
let activeValueReturned = 'track';
let searchArrayValue = 'tracks';

function search() {
    document.getElementById('search-form').addEventListener('focus', () => {
        document.addEventListener('keyup', checkKeyPressed);
    })
}

function checkType() {
    const activeType = document.querySelectorAll('.dropdown-menu li');
    activeType.forEach(listItem => {
        listItem.addEventListener('click', () => {
            listItem.classList.add('active')
            let sibllings = Array.from(listItem.parentNode.children);
            let filteredSiblings = sibllings.filter((element) => {
                return element !== listItem;
            })
            filteredSiblings.forEach(unwantedList => {
                unwantedList.classList.remove('active');
                console.log(unwantedList)
            })
            if (listItem.classList.contains('active') && listItem.innerHTML == 'Song') {
                activeValueReturned = 'track';
                searchArrayValue = 'tracks';
            } else if (listItem.classList.contains('active') && listItem.innerHTML == 'Album') {
                activeValueReturned = 'album';
                searchArrayValue = 'albums';
            } else if (listItem.classList.contains('active') && listItem.innerHTML == 'Artist') {
                activeValueReturned = 'artist';
                searchArrayValue = 'artists';
            }
            if (inputValve.value.length !== 0) {
                re_Search();
            }
        })
    })
}

checkType();

function re_Search() {
    async function authenticate() {
        const response = await fetch(TOKEN_URL, {
            method: "POST",
            headers: {
                Authorization: `Basic ${AUTH_HEADER}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        });

        const responseJson = await response.json();
        const accessToken = responseJson.access_token;
        return accessToken;
    };

    async function searchActive(query, accessToken) {
        const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}&type=${activeValueReturned}&limit=${LIMIT}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const responseJson = await response.json();
        return responseJson[searchArrayValue].items;
    };

    authenticate()
        .then((token) => {
            return searchActive(SEARCH_QUERY, token);
        })
        .then((results) => {
            try {
                updateSearch(results);
            } catch (error) {
                null
            }
            document.querySelectorAll('.suggestion-items').forEach(list => {
                list.addEventListener('click', () => {
                    console.log(results[Array.from(list.parentNode.children).indexOf(list)])
                    let displayClickDetails = results[Array.from(list.parentNode.children).indexOf(list)];
                    showClickDetails(displayClickDetails);
                    inputValve.value = "";
                    searchDisplayContainer.style.visibility = "hidden";
                    document.querySelector('.search-details').style.display = 'block';
                    document.getElementById('search-details').scrollIntoView({ behavior: 'smooth', block: 'end' });
                })
            })
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function checkKeyPressed(event) {
    if (event.keyCode) {
        SEARCH_QUERY = inputValve.value;
        re_Search();

    }
    if (inputValve.value.length == 0) {
        searchDisplayContainer.style.visibility = "hidden";
    }
}
search();

function updateSearch(result) {
    searchDisplayContainer.style.visibility = "visible";
    while (searchDisplay.firstChild) {
        searchDisplay.removeChild(searchDisplay.firstChild);
    }
    result.forEach(item => {
        let searchList = document.createElement('li');
        searchList.classList.add('suggestion-items');
        if (searchArrayValue == 'tracks') {
            searchList.innerHTML = `<img src="${item.album.images[0].url}" alt=""/> <p class="text-dark">${item.name} by ${item.artists[0].name}</p>`;
        } else if (searchArrayValue == 'albums') {
            searchList.innerHTML = `<img src="${item.images[0].url}" alt=""/> <p class="text-dark">${item.name} by ${item.artists[0].name}</p>`;
        } else if (searchArrayValue == 'artists') {
            searchList.innerHTML = `<img src="${item.images[0].url}" alt=""/> <p class="text-dark">${item.name}</p>`;
        }
        searchDisplay.appendChild(searchList);
    });
};

function showClickDetails(clickedIndex) {
    let genreArray = [];
    if (activeValueReturned == 'track') {
        document.querySelector('.search-details-image').innerHTML = `<img src="${clickedIndex.album.images[0].url}" class="img-fluid" alt="" />`
        document.querySelector('.search-details-info').innerHTML = `<p class="h2">Track:</p>
        <p class="h1">${clickedIndex.name}</p>
        <p class="h5">By ${clickedIndex.artists[0].name}</p>
        <a href="${clickedIndex.external_urls.spotify}" target="blank"> <button class="btn btn-dark mt-2 mb-2">Listen on Spotify</button></a>`
        console.log(clickedIndex);
    }
    else if (activeValueReturned == 'album') {
        document.querySelector('.search-details-image').innerHTML = `<img src="${clickedIndex.images[0].url}" class="img-fluid" alt="" />`
        document.querySelector('.search-details-info').innerHTML = `<p class="h2">Album:</p>
        <p class="h1">${clickedIndex.name}</p>
        <p class="h5">By ${clickedIndex.artists[0].name}</p>
        <a href="${clickedIndex.external_urls.spotify}" target="blank"> <button class="btn btn-dark mt-2 mb-2">Listen on Spotify</button></a>`
    }

    else if (activeValueReturned == 'artist') {
        for (let i of clickedIndex.genres) {
            genreArray.push(i)
        }
        let genreString = genreArray.join(', ');
        document.querySelector('.search-details-image').innerHTML = `<img src="${clickedIndex.images[0].url}" class="img-fluid" alt="" />`
        document.querySelector('.search-details-info').innerHTML = `<p class="h2">Artist:</p>
        <p class="h1">${clickedIndex.name}</p>
        <p class="h2">Genres:</p>
        <p class="h3">${genreString}</p>
        <a href="${clickedIndex.external_urls.spotify}" target="blank"> <button class="btn btn-dark mt-2 mb-2">Listen on Spotify</button></a>`
    }
}
