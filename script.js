// Default API Key
const defaultApiKey = 'AIzaSyDONDdgC9n-BbTSVnedZ-v-4othWggkAuE';
let apiKey = localStorage.getItem('userApiKey') || defaultApiKey;
let playlistId;

// Elements for Easy Reference
const elements = {
    mainVideo: document.getElementById('main-video'),
    mainVideoTitle: document.querySelector('.main-video-wrapper .title'),
    videoPlaylist: document.querySelector('.video-playlist .videos'),
    videoInfo: document.getElementById('video-info'),
    playlistTitle: document.querySelector('.video-playlist .playlist-title'),
    loginForm: document.getElementById('login-section'),
    playlistForm: document.getElementById('login-form'),
    mainContainer: document.querySelector('main.container'),
    apiKeyInput: document.getElementById('user-api-key'),
    apiKeyLabel: document.getElementById('api-key-label'),
    submitButton: document.querySelector('button[type="submit"]'),
    togglePassword: document.getElementById('toggle-password'),
    passwordField: document.getElementById('playlist-id'),
    eyeOpen: document.getElementById('eye-open'),
    eyeClosed: document.getElementById('eye-closed'),
    errorPopup: document.getElementById('incorrect-toast'),
    errorMessage: document.querySelector('.error-message'),
    seeAllBtn: document.querySelector('.see-all'),
    descriptionWrapper: document.querySelector('.description-wrapper'),
    mainVideoWrapper: document.querySelector('.main-video-wrapper'),
    openDescriptionBtn: document.querySelector('.open-description'),
    logoutButton: document.querySelector('.logout'),
    arrowIcon: document.getElementById('arrow-icon')
};

// Toggle API Key Input Visibility
document.getElementById('change-api-key-label').addEventListener('click', function () {
    var apiKeyInput = document.getElementById('user-api-key');
    var apiKeyLabel = document.getElementById('api-key-label');
    var submitButton = document.querySelector('button[type="submit"]');

    if (apiKeyInput.style.display === 'none' || apiKeyInput.style.display === '') {
        apiKeyInput.style.display = 'block';
        apiKeyLabel.style.display = 'block';

        submitButton.parentNode.insertBefore(apiKeyLabel, submitButton);
        submitButton.parentNode.insertBefore(apiKeyInput, submitButton);
    } else {
        apiKeyInput.style.display = 'none';
        apiKeyLabel.style.display = 'none';
    }
});

// Toggle Password Visibility
elements.togglePassword.addEventListener('click', function () {
    const isText = elements.passwordField.type === 'text';
    elements.passwordField.type = isText ? 'password' : 'text';
    elements.eyeOpen.style.display = isText ? 'inline' : 'none';
    elements.eyeClosed.style.display = isText ? 'none' : 'inline';
});

// Extract Playlist ID from URL
const extractPlaylistId = urlOrId => urlOrId.match(/[?&]list=([^&]+)/)?.[1] || urlOrId;

// Playlist Form Submission
elements.playlistForm.addEventListener('submit', function (event) {
    event.preventDefault();

    playlistId = extractPlaylistId(elements.passwordField.value);
    const userApiKey = elements.apiKeyInput.value.trim();

    if (userApiKey) {
        apiKey = userApiKey;
        localStorage.setItem('userApiKey', userApiKey);
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('playlistId', playlistId);

    window.location.hash = `#/${playlistId}`;
    toggleLoginDisplay(false);

    fetchPlaylistDetails();
    fetchAllVideos();
});

// Show Incorrect API or Playlist Popup
const showIncorrectPopup = message => {
    elements.errorMessage.textContent = message;
    elements.errorPopup.style.display = 'block';
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('playlistId');
    apiKey = defaultApiKey;
    localStorage.removeItem('userApiKey');
};

// Hide Incorrect Popup on Button Click
document.getElementById('okay-button').addEventListener('click', () => {
    elements.errorPopup.style.display = 'none';
});

// Toggle Login Display
const toggleLoginDisplay = showLogin => {
    elements.loginForm.style.display = showLogin ? 'block' : 'none';
    elements.mainContainer.style.display = showLogin ? 'none' : 'grid';
};

// Toggle Full Description View
const toggleFullDescription = () => {
    if (elements.descriptionWrapper.classList.contains('show')) {
        elements.descriptionWrapper.classList.remove('show');
        elements.arrowIcon.classList.remove('rotated');
        elements.seeAllBtn.style.display = 'none';
        elements.descriptionWrapper.classList.remove('expanded');
        elements.seeAllBtn.textContent = 'See all';
    } else {
        elements.descriptionWrapper.classList.add('show');
        elements.arrowIcon.classList.add('rotated');

        const descriptionContent = elements.descriptionWrapper.querySelector('.description');
        const wrapperHeight = elements.descriptionWrapper.clientHeight;
        const contentHeight = descriptionContent.scrollHeight;

        const isOverflowing = contentHeight > wrapperHeight - 40;

        if (isOverflowing) {
            elements.seeAllBtn.style.display = 'block';
            elements.descriptionWrapper.classList.add('expanded');
            elements.seeAllBtn.textContent = 'See less';
        } else {
            elements.seeAllBtn.style.display = 'none';
        }

        if (window.innerWidth > 768) {
            scrollToTopOfDescription(elements.descriptionWrapper);
        }
    }
};

// Scroll to Top of Description
const scrollToTopOfDescription = (element) => {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    });
};

// Toggle Description Expansion
const toggleDescriptionExpansion = () => {
    elements.descriptionWrapper.classList.toggle('expanded');
    elements.seeAllBtn.textContent = elements.descriptionWrapper.classList.contains('expanded') ? 'See less' : 'See all';

    if (elements.descriptionWrapper.classList.contains('expanded') && window.innerWidth > 768) {
        scrollToTopOfDescription(elements.descriptionWrapper);
    }
};

// Scroll to Bottom of Element
const scrollToBottom = (element) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'end' });
};

// Logout Functionality
elements.logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('playlistId');
    localStorage.removeItem('lastWatchedVideoId');

    history.replaceState(null, null, window.location.pathname);
    playlistId = null;
    location.reload();
});

// Loading Overlay
const showLoading = () => {
    document.getElementById('loading-overlay').style.display = 'flex';
};

const hideLoading = () => {
    document.getElementById('loading-overlay').style.display = 'none';
};

// Fetch Playlist Details from API
const fetchPlaylistDetails = () => {
    showLoading();

    fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (!data.items?.length) throw new Error('Playlist not found');
            elements.playlistTitle.textContent = data.items[0].snippet.title;
        })
        .catch(error => {
            console.error('Error fetching playlist details:', error);
            showIncorrectPopup('Check Playlist ID or Change API Key.');
            toggleLoginDisplay(true);
        });
};

// Fetch All Videos from API
const fetchAllVideos = (pageToken = '') => {
    fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&pageToken=${pageToken}&playlistId=${playlistId}&key=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (!data.items?.length) throw new Error('No videos found in this playlist');

            data.items.forEach(video => appendVideo(video));

            if (data.nextPageToken) {
                fetchAllVideos(data.nextPageToken);
            } else {
                setupVideoClickEvents();
                playLastWatchedVideo();
                hideLoading();
            }
        })
        .catch(error => {
            console.error('Error fetching videos:', error);
            showIncorrectPopup('Check Playlist ID or Change API Key.');
            toggleLoginDisplay(true);
            hideLoading();
        });
};

// Play the Last Watched Video
const playLastWatchedVideo = () => {
    const lastWatchedVideoId = localStorage.getItem('lastWatchedVideoId');

    if (lastWatchedVideoId) {
        const lastWatchedVideoElement = document.querySelector(`.video[data-id="${lastWatchedVideoId}"]`);

        if (lastWatchedVideoElement) {
            document.querySelectorAll('.video').forEach(v => v.classList.remove('active'));
            lastWatchedVideoElement.classList.add('active');

            lastWatchedVideoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            loadVideo(lastWatchedVideoId, lastWatchedVideoElement.dataset.description);
        }
    } else {
        const firstVideo = document.querySelector('.video');

        if (firstVideo) {
            firstVideo.classList.add('active');
            loadVideo(firstVideo.dataset.id, firstVideo.dataset.description);
        }
    }
};

// Append Video to Playlist
const appendVideo = video => {
    const { videoId } = video.snippet.resourceId;
    const { title, description, thumbnails } = video.snippet;
    const videoElement = `
        <div class="video" data-id="${videoId}" data-description="${description}">
            <div class="row">
                <img src="${thumbnails.medium.url}" alt="Thumbnail">
                <div class="column">
                    <p>${String(elements.videoPlaylist.childElementCount + 1).padStart(2, '0')}</p>
                    <h3 class="title">${title}</h3>
                </div>
            </div>
        </div>`;
    elements.videoPlaylist.innerHTML += videoElement;
};

// Setup Video Click Events
const setupVideoClickEvents = () => {
    const videos = document.querySelectorAll('.video');

    videos.forEach(video => video.addEventListener('click', () => {
        videos.forEach(v => v.classList.remove('active'));
        video.classList.add('active');
        loadVideo(video.dataset.id, video.dataset.description);
    }));

    elements.videoInfo.textContent = `${elements.videoPlaylist.childElementCount} lessons`;
};

// Load the Video and Description
const loadVideo = (videoId, description) => {
    elements.mainVideo.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    elements.mainVideoTitle.textContent = document.querySelector(`.video[data-id="${videoId}"] .title`).textContent;

    const formattedDescription = formatDescription(description || 'Nothing here!');
    elements.descriptionWrapper.querySelector('.description').innerHTML = formattedDescription;

    localStorage.setItem('lastWatchedVideoId', videoId);

    resetDescriptionView();
    scrollToTop(elements.mainVideoWrapper);
    toggleSeeAllButton();

    if (window.innerWidth <= 768) {
        elements.descriptionWrapper.classList.remove('expanded');
        elements.seeAllBtn.textContent = 'See all';
    }
};

// On DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const storedApiKey = localStorage.getItem('userApiKey');
    const storedPlaylistId = localStorage.getItem('playlistId');
    const hash = window.location.hash;

    const playlistIdFromHash = hash ? extractPlaylistId(hash.replace('#/', '').replace('#', '')) : null;
    apiKey = storedApiKey || defaultApiKey;

    if (playlistIdFromHash) {
        const sanitizedId = playlistIdFromHash.trim();

        if (storedPlaylistId && storedPlaylistId !== sanitizedId) {
            console.log('Playlist ID changed, clearing lastWatchedVideoId');
            localStorage.removeItem('lastWatchedVideoId');
        }

        localStorage.setItem('playlistId', sanitizedId);
        localStorage.setItem('isLoggedIn', 'true');
        playlistId = sanitizedId;

        window.location.hash = `#/${sanitizedId}`;
        console.log('URL-based login detected, loading playlist:', playlistId);
    } else {
        playlistId = storedPlaylistId;
    }

    if (isLoggedIn === 'true' && playlistId) {
        console.log('User is logged in or playlistId exists, loading playlist:', playlistId);
        toggleLoginDisplay(false);
        fetchPlaylistDetails();
        fetchAllVideos();
    } else {
        console.log('User is not logged in or playlistId is missing, showing login page');
        toggleLoginDisplay(true);
    }

    elements.seeAllBtn.addEventListener('click', toggleDescriptionExpansion);
    elements.openDescriptionBtn.addEventListener('click', toggleFullDescription);
});

// Search Functionality
document.addEventListener('DOMContentLoaded', function () {
    const searchBar = document.getElementById('search-bar');
    const clearSearch = document.getElementById('clear-search');
    const videoContainer = document.querySelector('.videos');

    searchBar.addEventListener('input', function () {
        const searchText = searchBar.value.toLowerCase();
        const videoElements = videoContainer.querySelectorAll('.video');

        clearSearch.style.display = searchText ? 'inline' : 'none';

        videoElements.forEach(video => {
            const videoTitle = video.querySelector('.title').textContent.toLowerCase();
            if (videoTitle.includes(searchText)) {
                video.style.display = 'flex';
            } else {
                video.style.display = 'none';
            }
        });

        videoContainer.scrollTop = 0;
    });

    clearSearch.addEventListener('click', function () {
        searchBar.value = '';
        clearSearch.style.display = 'none';

        const videoElements = videoContainer.querySelectorAll('.video');
        videoElements.forEach(video => {
            video.style.display = 'flex';
        });

        const activeVideo = videoContainer.querySelector('.video.active');
        if (activeVideo) {
            videoContainer.scrollTop = activeVideo.offsetTop - videoContainer.offsetTop;
        }
    });
});

// Format Description Text
const formatDescription = (text) => {
    let formattedText = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    formattedText = formattedText.replace(
        /(\d{1,2}:\d{2}(?::\d{2})?)/g, // Matches MM:SS or HH:MM:SS format
        `<a href="javascript:void(0);" class="timestamp" data-time="$1">$1</a>`
    );

    formattedText = formattedText.replace(
        /\*(.*?)\*/g, '<strong>$1</strong>'
    );

    return formattedText.replace(/\n/g, '<br>');
};

// Timestamps
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('timestamp')) {
        const time = event.target.dataset.time;
        seekToTime(time);
    }
});

// Seek to Specific Time
const seekToTime = (time) => {
    const parts = time.split(':').map(Number);
    const seconds = parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2] // HH:MM:SS
        : parts[0] * 60 + parts[1]; // MM:SS

    elements.mainVideo.src = `${elements.mainVideo.src.split('?')[0]}?start=${seconds}&autoplay=1`;
};

// Reset Description View
const resetDescriptionView = () => {
    if (window.innerWidth > 768) {
        elements.descriptionWrapper.classList.remove('expanded');
        elements.seeAllBtn.textContent = 'See all';
        elements.descriptionWrapper.classList.remove('show');
        elements.arrowIcon.classList.remove('rotated');
    }
};

// Toggle 'See all' and 'See less'
const toggleSeeAllButton = () => {
    const descriptionContent = elements.descriptionWrapper.querySelector('.description');
    const wrapperHeight = elements.descriptionWrapper.clientHeight;
    const contentHeight = descriptionContent.scrollHeight;

    const isOverflowing = contentHeight > wrapperHeight - 40;

    elements.seeAllBtn.style.display = isOverflowing ? 'block' : 'none';
};

// Scroll to Top of Element
const scrollToTop = element => element.scrollIntoView({ behavior: 'smooth' });