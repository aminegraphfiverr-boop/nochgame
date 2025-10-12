let gameState = {
  active: false,
  currentQuestionIndex: 0,
  questions: [],
  players: new Map(),
  currentTimer: null,
  timeLeft: 15,
  category: 'general'
};

// DOM
const setupPanel = document.getElementById('setup');
const gameArea = document.getElementById('game-area');
const winnerScreen = document.getElementById('winner-screen');
const streamerInput = document.getElementById('streamer-name');
const categorySelect = document.getElementById('category-select');
const startBtn = document.getElementById('start-game');
const streamerDisplay = document.getElementById('streamer-name-display');
const questionText = document.getElementById('question-text');
const questionImage = document.getElementById('question-image');
const youtubeContainer = document.getElementById('youtube-container');
const userAnswer = document.getElementById('user-answer');
const submitBtn = document.getElementById('submit-answer');
const leaderboardBody = document.getElementById('leaderboard-body');
const timerProgress = document.getElementById('timer-progress');
const timerDisplay = document.getElementById('timer-display');
const restartBtn = document.getElementById('restart-game');

// Load questions
async function loadQuestions(category) {
  try {
    const res = await fetch(`questions/${category}/questions.json`);
    if (!res.ok) throw new Error('Category not found');
    gameState.questions = await res.json();
    gameState.currentQuestionIndex = 0;
  } catch (e) {
    alert(`Failed to load ${category} questions. Using sample.`);
    gameState.questions = [{
      question: "What is 2 + 2?",
      answer: "4"
    }];
  }
}

// Listen to chat
document.addEventListener('chat-message', (e) => {
  const { username, message } = e.detail;
  if (message.trim().toLowerCase() === '!play' && gameState.active) {
    if (!gameState.players.has(username)) {
      gameState.players.set(username, { correct: 0, points: 0 });
      updateLeaderboard();
    }
  }
});

// Start
startBtn.addEventListener('click', async () => {
  const streamer = streamerInput.value.trim();
  if (!streamer) return alert('Enter Kick username!');
  
  gameState.category = categorySelect.value;
  await loadQuestions(gameState.category);
  
  streamerDisplay.textContent = streamer;
  setupPanel.classList.add('hidden');
  gameArea.classList.remove('hidden');
  gameState.active = true;
  nextQuestion();
});

// Timer
function startTimer() {
  clearInterval(gameState.currentTimer);
  gameState.timeLeft = 15;
  updateTimerUI();
  gameState.currentTimer = setInterval(() => {
    gameState.timeLeft--;
    updateTimerUI();
    if (gameState.timeLeft <= 0) {
      clearInterval(gameState.currentTimer);
      nextQuestion();
    }
  }, 1000);
}

function updateTimerUI() {
  const percent = (gameState.timeLeft / 15) * 100;
  timerProgress.style.width = `${percent}%`;
  timerDisplay.textContent = `${gameState.timeLeft}s`;
}

// Question display
function displayQuestion(q) {
  questionText.textContent = q.question;
  questionImage.classList.add('hidden');
  youtubeContainer.classList.add('hidden');
  youtubeContainer.innerHTML = '';

  if (q.image) {
    questionImage.src = q.image;
    questionImage.classList.remove('hidden');
  } else if (q.video) {
    const id = extractYouTubeId(q.video);
    if (id) {
      youtubeContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=0&mute=1" frameborder="0"></iframe>`;
      youtubeContainer.classList.remove('hidden');
    }
  }
}

function extractYouTubeId(url) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Next
function nextQuestion() {
  if (gameState.currentQuestionIndex >= gameState.questions.length) {
    endGame();
    return;
  }
  const q = gameState.questions[gameState.currentQuestionIndex];
  displayQuestion(q);
  gameState.currentQuestionIndex++;
  userAnswer.value = '';
  startTimer();
}

// Answer
submitBtn.addEventListener('click', checkAnswer);
userAnswer.addEventListener('keypress', e => e.key === 'Enter' && checkAnswer());

function checkAnswer() {
  if (!gameState.active) return;
  const ans = userAnswer.value.trim().toLowerCase();
  const q = gameState.questions[gameState.currentQuestionIndex - 1];
  if (!q) return;

  if (ans === q.answer.toLowerCase()) {
    const username = "You"; // In real use, get from authenticated user or chat context
    let p = gameState.players.get(username);
    if (!p) {
      p = { correct: 0, points: 0 };
      gameState.players.set(username, p);
    }
    p.correct++;
    p.points += 10;
    updateLeaderboard();
  }
  nextQuestion();
}

// Leaderboard
function updateLeaderboard() {
  leaderboardBody.innerHTML = '';
  const sorted = Array.from(gameState.players.entries())
    .sort((a, b) => b[1].points - a[1].points);

  sorted.forEach(([user, data]) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${user}</td><td>${data.correct}</td><td>${data.points}</td>`;
    leaderboardBody.appendChild(row);
  });
}

// End
function endGame() {
  gameState.active = false;
  clearInterval(gameState.currentTimer);
  gameArea.classList.add('hidden');

  const top = Array.from(gameState.players.entries())
    .sort((a, b) => b[1].points - a[1].points)
    .map(x => x[0]);

  document.getElementById('first-place').textContent = top[0] || '—';
  document.getElementById('second-place').textContent = top[1] || '—';
  document.getElementById('third-place').textContent = top[2] || '—';

  winnerScreen.classList.remove('hidden');
}

restartBtn.addEventListener('click', () => {
  winnerScreen.classList.add('hidden');
  setupPanel.classList.remove('hidden');
  gameState.players.clear();
  leaderboardBody.innerHTML = '';
});

// Sound (optional – will work if you add MP3s)
function playSound(type) {
  // You can add real sounds later
  console.log("Sound:", type);
}
