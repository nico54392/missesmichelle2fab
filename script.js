const win = document.getElementById("window");
const title = document.getElementById("title");
const content = document.getElementById("content");
const FAKE_DATE = new Date("2027-08-18");
const USE_FAKE_DATE = true;
let heardleState = null;
const DEBUG_SKIP_INTRO = false;

window.selectTile = selectTile;

/* =========================================================
   GAME DATA
========================================================= */

const MONTH_GAMES = {
  "Game 1": {
    type: "heardle",
    data: {
      title: "August Heardle",
      audio: "audio/aug-snippet.mp3",
      inputId: "g1-input",
      resultId: "g1-result",
      answer: "Lover's Rock",
      successText: "✔ WOWOWOW I love this song sm you really put me on MWAH.",
      failText: "✖ Not quite."
    }
  },

  "Game 2": {
    type: "fill",
    data: {
      prompt: "The night we ___ under the stars.",
      answer: "slept",
      inputId: "g2-input",
      resultId: "g2-result",
      successText: "✔ Checked"
    }
  },

  "Game 3": {
    type: "mcq",
    data: {
      question: "Which moment was real?",
      resultId: "g3-result",
      options: [
        { text: "Option 1", correct: false },
        { text: "Option 2", correct: true },
        { text: "Option 3", correct: false }
      ]
    }
  },

  "Game 4": {
    type: "puzzle",
    data: {
      size: 9,
      imagePrefix: "images/m4-",
      resultId: "puzzle-result"
    }
  },

  "Game 5": {
    type: "fill",
    data: {
      prompt: "You held my ___ when I needed it.",
      answer: "hand",
      inputId: "g5-input",
      resultId: "g5-result",
      successText: "✔ Checked"
    }
  },

  "Game 6": {
    type: "mcq",
    data: {
      question: "Pick the real memory:",
      resultId: "g6-result",
      options: [
        { text: "A", correct: false },
        { text: "B", correct: true },
        { text: "C", correct: false }
      ]
    }
  },

  "Game 7": {
    type: "heardle",
    data: {
      title: "February Heardle",
      audio: "audio/feb-snippet.mp3",
      inputId: "g7-input",
      resultId: "g7-result",
      answer: "blackbird",
      successText: "✔ Correct. I still remember you playing that for me.",
      failText: "✖ Not quite."
    }
  },

  "Game 8": {
    type: "puzzle",
    data: {
      size: 9,
      imagePrefix: "images/m8-",
      resultId: "puzzle-result"
    }
  },

  "Game 9": {
    type: "fill",
    data: {
      prompt: "We ___ forever in that moment.",
      answer: "stayed",
      inputId: "g9-input",
      resultId: "g9-result",
      successText: "✔ Checked"
    }
  },

  "Game 10": {
    type: "mcq",
    data: {
      question: "May choice:",
      resultId: "g10-result",
      options: [
        { text: "1", correct: false },
        { text: "2", correct: true },
        { text: "3", correct: false }
      ]
    }
  },

  "Game 11": {
    type: "puzzle",
    data: {
      size: 9,
      imagePrefix: "images/m11-",
      resultId: "puzzle-result"
    }
  },

  "Game 12": {
    type: "heardle",
    data: {
      title: "July Heardle",
      audio: "audio/jul-snippet.mp3",
      inputId: "g12-input",
      resultId: "g12-result",
      answer: "blackbird",
      successText: "✔ Correct. I still remember you playing that for me.",
      failText: "✖ Not quite."
    }
  }
};

/* =========================================================
   ENGINE
========================================================= */

const GameEngine = {

  heardle(mount, data) {

    mount.innerHTML = `
      <div>
  
        <h3>${data.title}</h3>
  
        <button id="${data.inputId}-play">
          ▶ Play Clip
        </button>
  
        <p>Guess the song:</p>
  
        <input
          id="${data.inputId}"
          placeholder="type your guess..."
        >
  
        <button
          onclick="submitHeardle('${data.inputId}')">
          Submit
        </button>
  
        <p id="${data.resultId}"></p>
  
      </div>
    `;
  
    heardleState = {
      audio: new Audio(data.audio),
      answer: data.answer.toLowerCase(),
      resultId: data.resultId,
      inputId: data.inputId,
      successText: data.successText,
      failText: data.failText,
      guess: 0,
      durations: [1,3,6]
    };
  
    document
      .getElementById(`${data.inputId}-play`)
      .onclick = playHeardleClip;
  
    document
      .getElementById(data.inputId)
      .addEventListener("keydown", e => {
        if(e.key === "Enter"){
          submitHeardle(data.inputId);
        }
      });
  },

  

  fill(mount, data) {
    mount.innerHTML = `
      <div>
        <p><em>${data.prompt}</em></p>

        <input id="${data.inputId}"
          onkeydown="if(event.key==='Enter') checkFill('${data.inputId}','${data.answer}','${data.resultId}','${data.successText}')"
        />

        <button onclick="checkFill('${data.inputId}','${data.answer}','${data.resultId}','${data.successText}')">
          Submit
        </button>

        <p id="${data.resultId}"></p>
      </div>
    `;
  },

  mcq(mount, data) {
    mount.innerHTML = `
      <div>
        <p>${data.question}</p>
        ${data.options.map(o => `
          <button onclick="answerMCQ('${data.resultId}', ${o.correct})">
            ${o.text}
          </button>
        `).join("")}
        <p id="${data.resultId}"></p>
      </div>
    `;
  },

  puzzle(mount, data) {
    mount.innerHTML = `
      <div>
        <div id="puzzle-board"></div>
        <p id="${data.resultId}"></p>
      </div>
    `;
    initPuzzle(data);
  }
};

/* =========================================================
   GAME ACTIONS
========================================================= */

function playHeardleClip() {

  if (!heardleState) return;

  const audio = heardleState.audio;

  const duration =
    heardleState.durations[
      Math.min(
        heardleState.guess,
        heardleState.durations.length - 1
      )
    ];

  audio.currentTime = 0;
  audio.play();

  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, duration * 1000);
}

function submitHeardle(inputId) {

  const val =
    document.getElementById(inputId)
      .value
      .trim()
      .toLowerCase();

  const result =
    document.getElementById(
      heardleState.resultId
    );

  if (val === heardleState.answer) {

    result.textContent =
      heardleState.successText ||
      "✔ Correct";

    return;
  }

  heardleState.guess++;

  if (heardleState.guess >= 3) {

    result.textContent =
      `✖ Out of guesses. Answer: ${heardleState.answer}`;

    return;
  }

  const nextClip =
    heardleState.durations[heardleState.guess];

  result.textContent =
    `✖ Incorrect. Next clip: ${nextClip}s`;
}

function answerMCQ(id, correct) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = correct ? "✔ correct" : "✖ nope";
}

function checkFill(inputId, answer, resultId, successText) {
  const val = document.getElementById(inputId)?.value?.toLowerCase();
  const el = document.getElementById(resultId);

  if (!el) return;

  el.textContent =
    val === answer.toLowerCase()
      ? successText
      : "✖ incorrect";
}

function loadGame(button, gameName) {
  const section = button.closest(".month");
  if (!section) return;

  const container = section.querySelector(".game-container");

  if (!container) {
    console.error("No game container found in month section");
    return;
  }

  const game = MONTH_GAMES[gameName];

  if (!game) {
    container.innerHTML = "<p>Game not found</p>";
    return;
  }

  container.innerHTML = "";

  if (GameEngine[game.type]) {
    GameEngine[game.type](container, game.data);
  } else {
    container.innerHTML = `<p>Unknown game type: ${game.type}</p>`;
  }

  button.style.display = "none";
}
/* =========================================================
   PUZZLE
========================================================= */

let puzzleState = { order: [], selected: null, config: null };

function initPuzzle(config) {
  puzzleState.config = config;
  puzzleState.order = Array.from({ length: config.size }, (_, i) => i + 1)
    .sort(() => Math.random() - 0.5);

  renderPuzzle();
}

function renderPuzzle() {
  const board = document.getElementById("puzzle-board");
  if (!board) return;

  board.innerHTML = "";

  puzzleState.order.forEach((piece, index) => {
    const img = document.createElement("img");
    img.src = `${puzzleState.config.imagePrefix}${piece}.jpg`;
    img.className = "puzzle-tile";
    img.onclick = () => selectTile(index);
    board.appendChild(img);
  });

  checkPuzzleSolved();
}

function selectTile(index) {
  if (puzzleState.selected === null) {
    puzzleState.selected = index;
    return;
  }

  const a = puzzleState.selected;
  const b = index;

  [puzzleState.order[a], puzzleState.order[b]] =
    [puzzleState.order[b], puzzleState.order[a]];

  puzzleState.selected = null;
  renderPuzzle();
}

function checkPuzzleSolved() {
  const solved = puzzleState.order.every((v, i) => v === i + 1);
  if (!solved) return;

  const el = document.getElementById(puzzleState.config?.resultId);
  if (el) el.textContent = "✔ Memory restored.";
}

/* =========================================================
   WINDOW SYSTEM
========================================================= */

function openApp(name) {
  win.style.display = "flex";
  title.textContent = name;

  const game = MONTH_GAMES[name];
  content.innerHTML = "";

  if (!game) {
    content.innerHTML = "<p>Game not found</p>";
    return;
  }

  GameEngine[game.type](content, game.data);
}

function closeWindow() {
  win.style.display = "none";
}

/* =========================================================
   LOCKS + PROGRESS (FIXED)
========================================================= */


/* =========================================================
   GATE + BOOT
========================================================= */

function checkGate() {
  const input = document
    .getElementById("gate-input")
    .value
    .toLowerCase()
    .trim();

  const result = document.getElementById("gate-result");

  if (input === "blackbird") {

    document.getElementById("gate").style.display = "none";

    document
      .getElementById("intro-message")
      .classList.remove("hidden");

    startBootSequence();

  } else {
    result.textContent = "✖ Incorrect";
  }
}

function startBootSequence() {

  const container = document.getElementById("boot-lines");
  const intro = document.getElementById("intro-message");
  const main = document.getElementById("main-content");

  const lines = [
    "SYSTEM INITIALIZING...",
    "CUTIE DETECTED.",
    "LOADING PROTOCOL...",
    "WELCOME.",
    "",
    "RETRIEVING MESSAGE...",
    "",
    "Michelle. As you know, for the next 11 months, we will be living 3,700 miles apart.",
    "",
    "",
    "*insert sad gif here*",
    "",
    "Yeah, I know.",
    "But hope remains.",
    "",
    "I have created this website for you as a way to demonstrate my love to you as expressively as our physical distance will allow.",
    "",
    "",
    "For each of the 11 months that we're apart, you'll be met with:",
    "",
    "- A message",
    "- A memory",
    "- A game",
    "",
    "Months unlock automatically as time passes.",
    "",
    "Good luck."
  ];

  intro.classList.remove("hidden");
  container.innerHTML = "";

  let i = 0;

  function addLine() {

    if (i >= lines.length) {

      const button = document.createElement("button");

      button.textContent = "Open Archive";

      button.style.marginTop = "30px";

      button.onclick = () => {
        intro.classList.add("hidden");
        main.classList.remove("hidden");
      };

      container.appendChild(button);

      return;
    }

    if (lines[i] === "*insert sad gif here*") {

      const gifRow = document.createElement("div");

      gifRow.style.display = "flex";
      gifRow.style.flexWrap = "wrap";
      gifRow.style.justifyContent = "center";
      gifRow.style.gap = "10px";
      gifRow.style.margin = "20px 0";

      for (let n = 1; n <= 5; n++) {

        const gif = document.createElement("img");

        gif.src = `images/sad${n}.gif`;

        gif.style.width = "160px";
        gif.style.imageRendering = "pixelated";

        gifRow.appendChild(gif);
      }

      container.appendChild(gifRow);

      i++;

      setTimeout(addLine, 800);

      return;
    }

    const line = document.createElement("div");

    line.className = "boot-line";
    line.textContent = lines[i];

    container.appendChild(line);

    i++;

    setTimeout(addLine, 600);
  }

  addLine();
}

/* =========================================================
   INIT
========================================================= */

/* =========================================================
   SYSTEM INIT (FIXED FOR YOUR HTML)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // ---------- INTRO SKIP ----------
  if (DEBUG_SKIP_INTRO) {
    document.getElementById("gate")?.remove();
    document.getElementById("intro-message")?.remove();
    document.getElementById("main-content")?.classList.remove("hidden");
  }

  // ---------- SYSTEM DATE ----------
  const dateEl = document.getElementById("system-date");

  if (dateEl) {
    const displayDate =
      USE_FAKE_DATE ? FAKE_DATE : new Date();
  
    dateEl.textContent =
      displayDate.toDateString();
  }

  // ---------- CORE SYSTEM ----------
  initLocks();
  applyLockOverlays();
  updateProgressBar();

  // optional live refresh (keeps UI stable if DOM changes later)
  setTimeout(() => {
    updateProgressBar();
  }, 300);
});


/* =========================================================
   LOCK SYSTEM (FIXED)
========================================================= */

function initLocks() {
  const today = USE_FAKE_DATE ? FAKE_DATE : new Date();

  document.querySelectorAll(".month").forEach(month => {
    const unlockStr = month.dataset.unlock;
    if (!unlockStr) return;

    const unlockDate = new Date(unlockStr);

    const locked = today < unlockDate;

    month.classList.toggle("locked", locked);
  });
}


/* =========================================================
   APPLY LOCK OVERLAYS (YOUR HTML NEEDS THIS)
========================================================= */

function applyLockOverlays() {
  const today = USE_FAKE_DATE ? FAKE_DATE : new Date();

  document.querySelectorAll(".month").forEach(month => {
    const unlockStr = month.dataset.unlock;
    const overlay = month.querySelector(".lock-overlay");
    const dateSpan = month.querySelector(".lock-overlay .date");

    if (!unlockStr || !overlay) return;

    const unlockDate = new Date(unlockStr);

    const locked = today < unlockDate;

    // show/hide overlay properly
    overlay.style.display = locked ? "flex" : "none";

    // fill date text
    if (dateSpan) {
      dateSpan.textContent = unlockDate.toDateString();
    }
  });
}


/* =========================================================
   PROGRESS BAR (FIXED + SAFE)
========================================================= */

function updateProgressBar() {
  const months = document.querySelectorAll(".month");
  const total = months.length;

  let unlocked = 0;

  months.forEach(m => {
    if (!m.classList.contains("locked")) unlocked++;
  });

  const percent = total ? (unlocked / total) * 100 : 0;

  const fill = document.getElementById("progress-fill");
  const text = document.getElementById("progress-text");

  if (fill) {
    fill.style.width = `${percent}%`;
  }

  if (text) {
    text.textContent = `${unlocked} / ${total} Months Complete`;
  }
}


/* =========================================================
   OPTIONAL: MANUAL REFRESH (DEBUG TOOL)
========================================================= */

window.refreshSystem = function () {
  initLocks();
  applyLockOverlays();
  updateProgressBar();
};
