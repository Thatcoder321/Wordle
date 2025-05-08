let currentRow = 0;
const board = document.getElementById('board');
const guessInput = document.getElementById('guessInput');
const log = document.getElementById('log');
let secretWord = '';
let guesses = [];

// Create empty board
for (let i = 0; i < 6; i++) {
  const row = document.createElement('div');
  row.className = 'row';
  for (let j = 0; j < 5; j++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    row.appendChild(tile);
  }
  board.appendChild(row);
}

async function fetchWord() {
  const res = await fetch('/api/word');
  const data = await res.json();
  secretWord = data.word.toLowerCase();
  console.log("Secret word:", secretWord); // dev only
}

function colorTiles(guess, feedback) {
  const row = board.children[currentRow];
  for (let i = 0; i < 5; i++) {
    const tile = row.children[i];
    tile.textContent = guess[i];
    tile.classList.add(feedback[i]);
  }
}

function getFeedback(guess) {
  const feedback = Array(5).fill('gray');
  const letterCount = {};

  for (let i = 0; i < 5; i++) {
    if (secretWord[i] === guess[i]) {
      feedback[i] = 'green';
    } else {
      letterCount[secretWord[i]] = (letterCount[secretWord[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'green') continue;
    if (letterCount[guess[i]]) {
      feedback[i] = 'yellow';
      letterCount[guess[i]]--;
    }
  }

  return feedback;
}

window.submitGuess = function () {
  const guess = guessInput.value.toLowerCase();
  if (guess.length !== 5 || currentRow >= 6) return;
  const feedback = getFeedback(guess);
  colorTiles(guess, feedback);
  guesses.push({ guess, feedback });
  currentRow++;
  guessInput.value = '';
  if (guess === secretWord) {
    alert('You got it!');
  }
}

window.aiSolve = async function () {
  log.textContent = '';
  let solved = false;

  while (!solved && guesses.length < 6) {
    const res = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guesses })
    });

    const data = await res.json();
    const guess = data.guess.toLowerCase();
    const feedback = getFeedback(guess);
    colorTiles(guess, feedback);
    guesses.push({ guess, feedback });
    log.innerHTML += `AI guessed: ${guess}<br>`;
    currentRow++;
    if (guess === secretWord) {
      solved = true;
      log.innerHTML += `<strong>AI solved it in ${guesses.length} tries!</strong>`;
    }
    await new Promise(r => setTimeout(r, 1000)); // pause for effect
  }

  if (!solved) {
    log.innerHTML += `<strong>AI failed to solve.</strong>`;
  }
}

fetchWord();