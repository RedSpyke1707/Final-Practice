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
      piedra: "✊",
      papel: "✋",
      tijera: "✌️",
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
}

class GameUI {
  constructor(game) {
    this.game = game;

    this.humanScoreEl = document.getElementById("humanScore");
    this.computerScoreEl = document.getElementById("computerScore");
    this.humanHandIcon = document.getElementById("humanHandIcon");
    this.computerHandIcon = document.getElementById("computerHandIcon");
    this.resultText = document.getElementById("resultText");
    this.logList = document.getElementById("logList");
    this.resetBtn = document.getElementById("resetBtn");
    this.choiceButtons = document.querySelectorAll(".choice-btn");

    this.bindEvents();
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

    this.prependLogEntry(result);
  }

  setHandIcon(element, choice) {
    element.dataset.empty = "false";
    element.innerHTML = `<span>${this.game.rules.getIcon(choice)}</span>`;
    element.classList.remove("stamped");
    void element.offsetWidth;
    element.classList.add("stamped");
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

    [this.humanHandIcon, this.computerHandIcon].forEach((el) => {
      el.dataset.empty = "true";
      el.classList.remove("win", "lose", "stamped");
      el.innerHTML = `<span class="hand-placeholder">?</span>`;
    });

    this.resultText.textContent = "Elige una jugada para empezar";
    this.resultText.className = "";

    this.logList.innerHTML = `<li class="log-empty">Todavía no hay rondas jugadas.</li>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  new GameUI(game);
});
