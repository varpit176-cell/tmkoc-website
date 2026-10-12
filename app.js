// State
let currentUser = JSON.parse(localStorage.getItem('tmkocUser')) || null;
let watchHistory = JSON.parse(localStorage.getItem('tmkocHistory')) || [];
let currentVideoIndex = 0;
let player;
let isPlayerReady = false;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const profileScreen = document.getElementById('profile-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const avatarInput = document.getElementById('avatar-input');
const avatarPreview = document.getElementById('avatar-preview');
const editUsernameInput = document.getElementById('edit-username');
const saveProfileBtn = document.getElementById('save-profile');
const navUsername = document.getElementById('nav-username');
const navAvatar = document.getElementById('nav-avatar');
const logoutBtn = document.getElementById('logout-btn');
const openProfileBtn = document.getElementById('open-profile-btn');
const playlistEl = document.getElementById('playlist');
const progressBar = document.getElementById('progress-bar');
const completedCountEl = document.getElementById('completed-count');
const currentVideoTitle = document.getElementById('current-video-title');
const nextVideoBtn = document.getElementById('next-video');
const markCompletedBtn = document.getElementById('mark-completed');
const googleLoginBtn = document.getElementById('google-login-btn');
const statEpisodes = document.getElementById('stat-episodes');
const statTime = document.getElementById('stat-time');
const statRank = document.getElementById('stat-rank');

// Initialize App
function initApp() {
  if (!currentUser) {
    showScreen('login-screen');
  } else if (!currentUser.avatar) {
    showScreen('profile-screen');
  } else {
    showScreen('dashboard-screen');
    loadDashboard();
  }
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if (screenId === 'profile-screen') {
    updatePerformanceStats();
    if (currentUser) {
      editUsernameInput.value = currentUser.username || '';
      if (currentUser.avatar) {
        avatarPreview.src = currentUser.avatar;
      }
    }
  }
}

// Performance Stats Logic
function updatePerformanceStats() {
  const epsWatched = watchHistory.length;
  // Assuming average TMKOC episode is 20 mins = 0.33 hours
  const watchTimeHours = Math.floor(epsWatched * 0.33);
  
  let rank = "Newbie";
  if (epsWatched > 10) rank = "Fan";
  if (epsWatched > 50) rank = "Super Fan";
  if (epsWatched > 90) rank = "TMKOC Legend";

  statEpisodes.textContent = epsWatched;
  statTime.textContent = `${watchTimeHours}h`;
  statRank.textContent = rank;
}

// Authentication (Mock)
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  currentUser = { username, avatar: null };
  localStorage.setItem('tmkocUser', JSON.stringify(currentUser));
  showScreen('profile-screen');
});

// Mock Google Login
googleLoginBtn.addEventListener('click', () => {
  const mockEmail = prompt("Sign in with Google\n\nEnter your Gmail address to continue:", "user@gmail.com");
  if (mockEmail) {
    const username = mockEmail.split('@')[0];
    currentUser = { 
      username, 
      avatar: 'https://lh3.googleusercontent.com/a/default-user' // Mock Google Avatar
    };
    localStorage.setItem('tmkocUser', JSON.stringify(currentUser));
    showScreen('profile-screen');
  }
});

// Profile Setup
avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.src = e.target.result;
      currentUser.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

saveProfileBtn.addEventListener('click', () => {
  if (!currentUser.avatar) {
    currentUser.avatar = 'https://via.placeholder.com/150';
  }
  const newUsername = editUsernameInput.value.trim();
  if (newUsername) {
    currentUser.username = newUsername;
  }
  localStorage.setItem('tmkocUser', JSON.stringify(currentUser));
  showScreen('dashboard-screen');
  loadDashboard();
});

openProfileBtn.addEventListener('click', () => {
  showScreen('profile-screen');
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('tmkocUser');
  currentUser = null;
  showScreen('login-screen');
});

// Dashboard & Playlist
function loadDashboard() {
  navUsername.textContent = currentUser.username;
  navAvatar.src = currentUser.avatar;
  renderPlaylist();
  updateProgress();
  
  if (videoIds.length > 0) {
    // Find first unwatched video or start from 0
    let startIndex = watchHistory.length > 0 ? Math.min(watchHistory.length, videoIds.length - 1) : 0;
    
    // If all are watched, start from 0 or last watched
    if(watchHistory.length >= videoIds.length) startIndex = 0;
    
    selectVideo(startIndex);
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = '';
  videoIds.forEach((id, index) => {
    const isCompleted = watchHistory.includes(id);
    const div = document.createElement('div');
    div.className = `playlist-item ${isCompleted ? 'completed' : ''}`;
    div.id = `playlist-item-${index}`;
    div.innerHTML = `
      <div class="item-number">${index + 1}</div>
      <img class="item-thumb" src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="Thumbnail">
      <div class="item-details">
        <div class="item-title">Episode ${index + 1}</div>
        <div class="item-status"><i class="fas fa-check-circle"></i> Watched</div>
      </div>
    `;
    div.addEventListener('click', () => selectVideo(index));
    playlistEl.appendChild(div);
  });
}

function updateProgress() {
  const count = watchHistory.length;
  completedCountEl.textContent = count;
  const percentage = (count / videoIds.length) * 100;
  progressBar.style.width = `${percentage}%`;
}

function selectVideo(index) {
  currentVideoIndex = index;
  const videoId = videoIds[index];
  
  // Highlight active item
  document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
  const activeEl = document.getElementById(`playlist-item-${index}`);
  if (activeEl) {
    activeEl.classList.add('active');
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  currentVideoTitle.textContent = `Episode ${index + 1}`;
  
  if (isPlayerReady && player) {
    player.loadVideoById(videoId);
  }

  updateControls();
}

function updateControls() {
  const videoId = videoIds[currentVideoIndex];
  const isCompleted = watchHistory.includes(videoId);
  
  markCompletedBtn.disabled = false;
  if (isCompleted) {
    markCompletedBtn.innerHTML = '<i class="fas fa-undo"></i> Unmark Completed';
    markCompletedBtn.classList.remove('success');
    markCompletedBtn.classList.add('secondary');
  } else {
    markCompletedBtn.innerHTML = '<i class="fas fa-check"></i> Mark Completed';
    markCompletedBtn.classList.remove('secondary');
    markCompletedBtn.classList.add('success');
  }
  nextVideoBtn.disabled = currentVideoIndex >= videoIds.length - 1;
}

// YouTube IFrame API Callback
function onYouTubeIframeAPIReady() {
  player = new YT.Player('youtube-player', {
    height: '100%',
    width: '100%',
    videoId: videoIds[0],
    playerVars: {
      'playsinline': 1,
      'rel': 0,
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  isPlayerReady = true;
  if (currentUser && currentUser.avatar) {
    selectVideo(currentVideoIndex);
  }
}

function onPlayerStateChange(event) {
  // YT.PlayerState.ENDED = 0
  if (event.data === 0) {
    markVideoCompleted();
  }
}

function markVideoCompleted() {
  const videoId = videoIds[currentVideoIndex];
  const itemEl = document.getElementById(`playlist-item-${currentVideoIndex}`);

  if (watchHistory.includes(videoId)) {
    // UNMARK: remove from history
    watchHistory = watchHistory.filter(id => id !== videoId);
    localStorage.setItem('tmkocHistory', JSON.stringify(watchHistory));
    if (itemEl) {
      itemEl.classList.remove('completed');
    }
    updateProgress();
    updateControls();
  } else {
    // MARK: add to history
    watchHistory.push(videoId);
    localStorage.setItem('tmkocHistory', JSON.stringify(watchHistory));
    if (itemEl) {
      itemEl.classList.add('fade-out');
      setTimeout(() => {
        itemEl.classList.remove('fade-out');
        itemEl.classList.add('completed');
      }, 500);
    }
    updateProgress();
    updateControls();

    // Auto play next video after 2 seconds
    if (currentVideoIndex < videoIds.length - 1) {
      setTimeout(() => {
        selectVideo(currentVideoIndex + 1);
      }, 2000);
    }
  }
}

markCompletedBtn.addEventListener('click', markVideoCompleted);

nextVideoBtn.addEventListener('click', () => {
  if (currentVideoIndex < videoIds.length - 1) {
    selectVideo(currentVideoIndex + 1);
  }
});

// Start app
initApp();
