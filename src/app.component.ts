import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from './services/ai.service';
import { GameLogicService } from './services/game-logic.service';
import { SoundService } from './services/sound.service';

type GameMode = 'PVE' | 'PVP' | null;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  private aiService = inject(AiService);
  private gameLogic = inject(GameLogicService);
  private soundService = inject(SoundService);

  // State
  gameMode = signal<GameMode>(null); // Start at menu
  board = signal<string[]>(Array(9).fill(''));
  isPlayerTurn = signal<boolean>(true); // True = X's turn, False = O's turn
  winner = signal<string | null>(null);
  winningLine = signal<number[]>([]);
  isDraw = signal<boolean>(false);
  isThinking = signal<boolean>(false);
  isMuted = signal<boolean>(false);
  
  // Scoring
  scoreX = signal<number>(0); // Player 1
  scoreO = signal<number>(0); // AI or Player 2

  statusMessage = computed(() => {
    if (this.winner()) {
      if (this.gameMode() === 'PVE') return `Vittoria: ${this.winner() === 'X' ? 'Tu!' : 'AI'}`;
      return `Vittoria: Giocatore ${this.winner() === 'X' ? '1 (X)' : '2 (O)'}`;
    }
    if (this.isDraw()) return 'Pareggio!';
    if (this.isThinking()) return 'AI sta pensando...';
    
    // Turn indication
    const player = this.isPlayerTurn() ? 'X' : 'O';
    if (this.gameMode() === 'PVE') {
      return this.isPlayerTurn() ? 'Il tuo turno (X)' : 'Turno AI (O)';
    } else {
      return `Turno Giocatore ${player === 'X' ? '1 (X)' : '2 (O)'}`;
    }
  });

  constructor() {
    // Effect to trigger AI move ONLY in PVE mode
    effect(() => {
      if (this.gameMode() === 'PVE' && !this.isPlayerTurn() && !this.winner() && !this.isDraw()) {
        this.makeAiMove();
      }
    });
  }

  // Initialize audio on user interaction
  private ensureAudioInit() {
    this.soundService.init();
  }

  toggleSound() {
    const muted = this.soundService.toggleMute();
    this.isMuted.set(muted);
    if (!muted) {
      this.soundService.playUiInteraction();
    }
  }

  startGame(mode: GameMode) {
    this.ensureAudioInit();
    this.soundService.playUiInteraction();
    this.gameMode.set(mode);
    this.resetGame();
    // Reset scores when changing mode or starting fresh session logic could go here
    // For now we keep scores persistent for the session
  }

  returnToMenu() {
    this.soundService.playUiInteraction();
    this.gameMode.set(null);
    this.scoreX.set(0);
    this.scoreO.set(0);
    this.board.set(Array(9).fill(''));
    this.winner.set(null);
    this.winningLine.set([]);
    this.isDraw.set(false);
  }

  async handleCellClick(index: number) {
    this.ensureAudioInit();

    // Guard clauses
    if (
      this.board()[index] !== '' || 
      this.winner() || 
      this.isThinking()
    ) {
      return;
    }

    // In PVE, player can only move if it's their turn (X)
    if (this.gameMode() === 'PVE' && !this.isPlayerTurn()) {
      return;
    }

    // Determine current symbol based on turn
    const symbol = this.isPlayerTurn() ? 'X' : 'O';
    this.makeMove(index, symbol);
  }

  private async makeAiMove() {
    this.isThinking.set(true);
    
    // Slight delay for visual pop (optional, keeps it feeling natural even if fast)
    // Removed large delay as requested before, keeping just microtask or minimal
    
    const moveIndex = await this.aiService.getBestMove(this.board());
    
    this.isThinking.set(false);
    
    if (moveIndex !== -1) {
      this.makeMove(moveIndex, 'O');
    }
  }

  private makeMove(index: number, player: string) {
    const newBoard = [...this.board()];
    newBoard[index] = player;
    this.board.set(newBoard);

    // Play move sound (High pitch for X, Low/different for O)
    this.soundService.playMove(player === 'X' ? 'player' : 'ai');

    const result = this.gameLogic.checkWinner(newBoard);
    if (result) {
      this.winner.set(result.winner);
      this.winningLine.set(result.line);
      if (result.winner === 'X') {
        this.scoreX.update(s => s + 1);
        this.soundService.playWin();
      } else {
        this.scoreO.update(s => s + 1);
        // Only play 'lose' sound if PVE and AI won. In PVP, someone won!
        if (this.gameMode() === 'PVE') {
          this.soundService.playLose();
        } else {
          this.soundService.playWin();
        }
      }
    } else if (this.gameLogic.isDraw(newBoard)) {
      this.isDraw.set(true);
      this.soundService.playDraw();
    } else {
      // Switch turn
      this.isPlayerTurn.update(v => !v);
    }
  }

  resetGame() {
    this.board.set(Array(9).fill(''));
    this.winner.set(null);
    this.winningLine.set([]);
    this.isDraw.set(false);
    this.isPlayerTurn.set(true); // X always starts
    this.isThinking.set(false);
    this.soundService.playMove('player'); // Affirmation sound
  }
}