cat > app.js << 'EOF'
// ---------------------------------------------------------
// Piedra, Papel o Tijera — implementación orientada a objetos
// ---------------------------------------------------------

class Rules {
  constructor() {
    this.beats = {
      piedra: "tijera",
      papel: "piedra",
      tijera: "papel",
    };

    this.icons = {
      piedra: `
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Piedra">
          <defs>
            <linearGradient id="rockGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#a3a7ab"/>
              <stop offset="100%" stop-color="#5c6165"/>
            </linearGradient>
          </defs>
          <path d="M60 16c19 0 36 9 44 24 7 13 6 28-2 40-9 14-27 23-45 22-17-1-33-9-41-23-8-14-7-30 2-43 9-13 24-20 42-20z" fill="url(#rockGrad)"/>
          <path d="M34 54c6-9 17-14 27-13 10 1 19 6 24 13" stroke="#454a4d" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.55"/>
          <path d="M42 74c7 4 16 5 24 2" stroke="#454a4d" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.45"/>
          <ellipse cx="46" cy="38" rx="12" ry="7" fill="#c7cace" opacity="0.5"/>
        </svg>
      `,
      papel: `
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Papel">
          <defs>
            <linearGradient id="paperGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fdfaf1"/>
              <stop offset="100%" stop-color="#ece4cf"/>
            </linearGradient>
          </defs>
          <path d="M28 14h48l16 16v76a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" fill="url(#paperGrad)" stroke="#26241f" stroke-width="2"/>
          <path d="M76 14v16h16" fill="none" stroke="#26241f" stroke-width="2" stroke-linejoin="round"/>
          <line x1="34" y1="52" x2="80" y2="52" stroke="#c9bfa2" stroke-width="3" stroke-linecap="round"/>
          <line x1="34" y1="64" x2="80" y2="64" stroke="#c9bfa2" stroke-width="3" stroke-linecap="round"/>
          <line x1="34" y1="76" x2="64" y2="76" stroke="#c9bfa2" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `,
      tijera: `
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tijera">
          <path d="M38 78 L96 28" stroke="#9aa0a6" stroke-width="7" stroke-linecap="round"/>
          <path d="M38 42 L96 92" stroke="#c3c8cd" stroke-width="7" stroke-linecap="round"/>
          <circle cx="30" cy="86" r="11" fill="none" stroke="#b5502b" stroke-width="6"/>
          <circle cx="30" cy="34" r="11" fill="none" stroke="#3f5d42" stroke-width="6"/>
        </svg>
      `,
    };
  }

  getIcon(choice) {
    return this.icons[choice];
  }

  decideWinner(humanChoice, computerChoice) {
    if (humanChoice === computerChoice) return "tie";
    if (this.beats[humanChoice] === computerChoice) return "human";
    return "computer";
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.score = 0;
    this.currentChoice = null;
  }

  setChoice(choice) {
    this.currentChoice = choice;
  }

  addPoint() {
    this.score += 1;
  }

  resetScore() {
    this.score = 0;
  }
}

class HumanPlayer extends Player {
  constructor() {
    super("Tú");
  }
}

class ComputerPlayer extends Player {
  constructor(options) {
    super("Máquina");
    this.options = options;
  }

  chooseRandom() {
    const index = Math.floor(Math.random() * this.options.length);
    this.setChoice(this.options[index]);
    return this.currentChoice;
  }
}

class Game {
  constructor() {
    this.choicesAvailable = ["piedra", "papel", "tijera"];
    this.rules = new Rules();
    this.human = new HumanPlayer();
    this.computer = new ComputerPlayer(this.choicesAvailable);
    this.round = 0;
    this.history = [];
  }

  playRound(humanChoice) {
    this.round += 1;
    this.human.setChoice(humanChoice);
    const computerChoice = this.computer.chooseRandom();

    const winner = this.rules.decideWinner(humanChoice, computerChoice);

    if (winner === "human") this.human.addPoint();
    if (winner === "computer") this.computer.addPoint();

    const result = {
      round: this.round,
      humanChoice,
      computerChoice,
      winner,
      humanScore: this.human.score,
      computerScore: this.computer.score,
    };

    this.history.push(result);
    return result;
  }

  reset() {
    this.round = 0;
    this.history = [];
    this.human.resetScore();
    this.computer.resetScore();
  }

  toJSON() {
    return {
      round: this.round,
      history: this.history,
      humanScore: this.human.score,
      computerScore: this.computer.score,
    };
  }

  loadFromData(data) {
    this.round = data.round || 0;
    this.history = Array.isArray(data.history) ? data.history : [];
    this.human.score = data.humanScore || 0;
    this.computer.score = data.computerScore || 0;
  }
}

class StorageService {
  constructor(key) {
    this.key = key;
  }

  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

class SoundManager {
  constructor() {
    this.muted = localStorage.getItem("rps-muted") === "true";
    this.audioCtx = null;
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("rps-muted", String(this.muted));
    return this.muted;
  }

  playWin() {
    this.playTones([523.25, 659.25, 783.99], 0.12, "sine");
  }

  playLose() {
    this.playTones([293.66, 220.0], 0.2, "sawtooth");
  }

  playTie() {
    this.playTones([392.0], 0.18, "triangle");
  }

  playTones(frequencies, stepDuration, waveType) {
    if (this.muted) return;

    const ctx = this.ensureContext();

    frequencies.forEach((freq, i) => {
      const start = ctx.currentTime + i * stepDuration;
      const end = start + stepDuration;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveType;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });
  }
}

class GameUI {
  constructor(game, soundManager) {
    this.game = game;
    this.sound = soundManager;

    this.humanScoreEl = document.getElementById("humanScore");
    this.computerScoreEl = document.getElementById("computerScore");
    this.humanHandIcon = document.getElementById("humanHandIcon");
    this.computerHandIcon = document.getElementById("computerHandIcon");
    this.resultText = document.getElementById("resultText");
    this.logList = document.getElementById("logList");
    this.resetBtn = document.getElementById("resetBtn");
    this.choiceButtons = document.querySelectorAll(".choice-btn");

    this.paintChoiceIcons();
    this.bindEvents();
  }

  paintChoiceIcons() {
    this.choiceButtons.forEach((button) => {
      const iconSlot = button.querySelector(".choice-icon");
      const choice = button.dataset.choice;
      iconSlot.innerHTML = this.game.rules.getIcon(choice);
    });
  }

  bindEvents() {
    this.choiceButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.choice;
        this.handleRound(choice);
      });
    });

    this.resetBtn.addEventListener("click", () => {
      this.game.reset();
      this.renderReset();
    });
  }

  handleRound(humanChoice) {
    const result = this.game.playRound(humanChoice);
    this.renderRound(result);
  }

  renderRound(result) {
    const { humanChoice, computerChoice, winner, humanScore, computerScore } = result;

    this.humanScoreEl.textContent = humanScore;
    this.computerScoreEl.textContent = computerScore;

    this.setHandIcon(this.humanHandIcon, humanChoice);
    this.setHandIcon(this.computerHandIcon, computerChoice);

    this.highlightResult(winner);
    this.prependLogEntry(result);

    if (winner === "human") this.sound.playWin();
    else if (winner === "computer") this.sound.playLose();
    else this.sound.playTie();
  }

  setHandIcon(element, choice) {
    element.dataset.empty = "false";
    element.innerHTML = this.game.rules.getIcon(choice);
    element.classList.remove("stamped");
    void element.offsetWidth;
    element.classList.add("stamped");
  }

  clearHandIcon(element) {
    element.dataset.empty = "true";
    element.classList.remove("win", "lose", "stamped");
    element.innerHTML = `<span class="hand-placeholder">?</span>`;
  }

  highlightResult(winner) {
    this.humanHandIcon.classList.remove("win", "lose");
    this.computerHandIcon.classList.remove("win", "lose");

    if (winner === "human") {
      this.humanHandIcon.classList.add("win");
      this.computerHandIcon.classList.add("lose");
    } else if (winner === "computer") {
      this.computerHandIcon.classList.add("win");
      this.humanHandIcon.classList.add("lose");
    }

    this.resultText.textContent = this.buildResultMessage(winner);
    this.resultText.className = "";
    this.resultText.classList.add(
      winner === "human" ? "win-text" : winner === "computer" ? "lose-text" : "tie-text"
    );
  }

  buildResultMessage(winner) {
    if (winner === "human") return "¡Ganaste esta ronda!";
    if (winner === "computer") return "La máquina se lleva la ronda.";
    return "Empate. Misma jugada.";
  }

  prependLogEntry(result) {
    const emptyEntry = this.logList.querySelector(".log-empty");
    if (emptyEntry) emptyEntry.remove();

    const li = document.createElement("li");

    const outcomeLabel =
      result.winner === "human" ? "Ganaste" : result.winner === "computer" ? "Perdiste" : "Empate";
    const outcomeClass =
      result.winner === "human" ? "win-text" : result.winner === "computer" ? "lose-text" : "tie-text";

    li.innerHTML = `
      <span class="log-round">Ronda ${result.round}</span>
      <span>${this.capitalize(result.humanChoice)} vs ${this.capitalize(result.computerChoice)}</span>
      <span class="log-outcome ${outcomeClass}">${outcomeLabel}</span>
    `;

    this.logList.prepend(li);
  }

  capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  renderReset() {
    this.humanScoreEl.textContent = "0";
    this.computerScoreEl.textContent = "0";

    this.clearHandIcon(this.humanHandIcon);
    this.clearHandIcon(this.computerHandIcon);

    this.resultText.textContent = "Elige una jugada para empezar";
    this.resultText.className = "";

    this.logList.innerHTML = `<li class="log-empty">Todavía no hay rondas jugadas.</li>`;
  }

  renderFromHistory() {
    this.humanScoreEl.textContent = this.game.human.score;
    this.computerScoreEl.textContent = this.game.computer.score;

    this.logList.innerHTML = `<li class="log-empty">Todavía no hay rondas jugadas.</li>`;
    this.game.history.forEach((entry) => this.prependLogEntry(entry));

    const last = this.game.history[this.game.history.length - 1];

    if (last) {
      this.setHandIcon(this.humanHandIcon, last.humanChoice);
      this.setHandIcon(this.computerHandIcon, last.computerChoice);
      this.highlightResult(last.winner);
    } else {
      this.clearHandIcon(this.humanHandIcon);
      this.clearHandIcon(this.computerHandIcon);
      this.resultText.textContent = "Elige una jugada para empezar";
      this.resultText.className = "";
    }
  }
}

class App {
  constructor() {
    this.storage = new StorageService("rps-save-v1");
    this.sound = new SoundManager();
    this.game = new Game();
    this.ui = new GameUI(this.game, this.sound);

    this.startScreen = document.getElementById("startScreen");
    this.gameScreen = document.getElementById("gameScreen");
    this.startNote = document.getElementById("startNote");

    this.newGameBtn = document.getElementById("newGameBtn");
    this.loadGameBtn = document.getElementById("loadGameBtn");
    this.exitGameBtn = document.getElementById("exitGameBtn");
    this.exitRoundBtn = document.getElementById("exitRoundBtn");
    this.muteBtn = document.getElementById("muteBtn");
    this.muteIcon = document.getElementById("muteIcon");

    this.bindEvents();
    this.syncMuteButton();
  }

  bindEvents() {
    this.newGameBtn.addEventListener("click", () => this.startNewGame());
    this.loadGameBtn.addEventListener("click", () => this.loadSavedGame());
    this.exitGameBtn.addEventListener("click", () => this.exitApp());
    this.exitRoundBtn.addEventListener("click", () => this.exitToStart());
    this.muteBtn.addEventListener("click", () => this.toggleMute());
  }

  startNewGame() {
    this.game.reset();
    this.ui.renderReset();
    this.startNote.textContent = "";
    this.showScreen("game");
  }

  loadSavedGame() {
    const data = this.storage.load();

    if (!data) {
      this.startNote.textContent = "No hay ninguna partida guardada todavía.";
      return;
    }

    this.game.loadFromData(data);
    this.ui.renderFromHistory();
    this.startNote.textContent = "";
    this.showScreen("game");
  }

  exitToStart() {
    this.storage.save(this.game.toJSON());
    this.showScreen("start");
    this.startNote.textContent = 'Partida guardada. Puedes continuarla con "Cargar partida".';
  }

  exitApp() {
    this.startNote.textContent = "Gracias por jugar. Ya puedes cerrar esta pestaña.";
    window.close();
  }

  toggleMute() {
    const muted = this.sound.toggleMute();
    this.syncMuteButton(muted);
  }

  syncMuteButton(muted = this.sound.muted) {
    this.muteBtn.setAttribute("aria-pressed", String(muted));
    this.muteBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar sonido");
    this.muteIcon.textContent = muted ? "🔇" : "🔊";
  }

  showScreen(name) {
    const showGame = name === "game";
    this.gameScreen.hidden = !showGame;
    this.startScreen.hidden = showGame;
  }
}

// ---------------------------------------------------------
// Arranque de la aplicación
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  new App();
});
EOF