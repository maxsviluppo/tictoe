import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameLogicService {
  
  checkWinner(board: string[]): { winner: string, line: number[] } | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: [a, b, c] };
      }
    }
    return null;
  }

  isDraw(board: string[]): boolean {
    return board.every(cell => cell !== '') && this.checkWinner(board) === null;
  }
}