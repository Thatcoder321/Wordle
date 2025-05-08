let currentRow = 0;
let currentCol = 0;
let secretWord = '';
let guesses = [];
const board = document.getElementById('board');
const log = document.getElementById('log');

// Create grid
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
  console.log('Secret word:', secretWord); // for testing
}
fetchWord();

function getCurrentGuess() {
  let guess = '';
  const row = board.children[currentRow];
  for (let i = 0; i < 5; i++) {
    guess += row.children[i].textContent;
  }
  return guess.toLowerCase();
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

function colorTiles(guess, feedback) {
  const row = board.children[currentRow];
  for (let i = 0; i < 5; i++) {
    row.children[i].classList.add(feedback[i]);
  }
}

function handleKey(e) {
  const row = board.children[currentRow];

  if (e.key === 'Backspace') {
    if (currentCol > 0) {
      currentCol--;
      row.children[currentCol].textContent = '';
    }
  } else if (e.key === 'Enter') {
    if (currentCol === 5) {
      const guess = getCurrentGuess();
      const feedback = getFeedback(guess);
      colorTiles(guess, feedback);
      guesses.push({ guess, feedback });
      if (guess === secretWord) {
        alert('You got it!');
      }
      currentRow++;
      currentCol = 0;
    }
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    if (currentCol < 5) {
      row.children[currentCol].textContent = e.key.toUpperCase();
      currentCol++;
    }
  }
}

document.addEventListener('keydown', handleKey);

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

    const row = board.children[currentRow];
    for (let i = 0; i < 5; i++) {
      row.children[i].textContent = guess[i].toUpperCase();
    }

    colorTiles(guess, feedback);
    guesses.push({ guess, feedback });
    log.innerHTML += `AI guessed: ${guess}<br>`;
    currentRow++;
    currentCol = 0;

    if (guess === secretWord) {
      solved = true;
      log.innerHTML += `<strong>AI solved it in ${guesses.length} tries!</strong>`;
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  if (!solved) {
    log.innerHTML += `<strong>AI failed to solve.</strong>`;
  }
}