import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai: GoogleGenAI | null = null;
  private modelId = 'gemini-2.5-flash';

  constructor() {
    try {
      // Initialize only if key exists
      const apiKey = process.env['API_KEY'];
      if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey });
      } else {
        console.warn('API_KEY not found. AI will fallback to random moves.');
      }
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI', e);
    }
  }

  async getBestMove(board: string[]): Promise<number> {
    // Check if AI is available
    if (!this.ai) {
      return this.getRandomMove(board);
    }

    try {
      // 0 = empty, 1 = X (Player), 2 = O (AI)
      const boardState = board.map((cell, index) => ({ index, value: cell || 'EMPTY' }));
      const availableMoves = board.map((c, i) => c === '' ? i : -1).filter(i => i !== -1);

      if (availableMoves.length === 0) return -1;

      const prompt = `
        You are an expert Tic Tac Toe player playing as 'O'. 
        The opponent is 'X'.
        The current board state is: ${JSON.stringify(boardState)}.
        'EMPTY' means the cell is available.
        Your goal is to win if possible, or block 'X' from winning.
        Return ONLY a JSON object with the property 'move' containing the index (0-8) of your chosen move.
        Do not explain.
      `;

      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              move: { type: Type.INTEGER }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('No response from AI');

      const json = JSON.parse(text);
      const move = json.move;

      if (typeof move === 'number' && availableMoves.includes(move)) {
        return move;
      } else {
        console.warn('AI returned invalid move, falling back to random');
        return this.getRandomMove(board);
      }

    } catch (error) {
      console.error('AI Error:', error);
      return this.getRandomMove(board);
    }
  }

  private getRandomMove(board: string[]): number {
    const availableMoves = board
      .map((cell, index) => (cell === '' ? index : null))
      .filter((index) => index !== null) as number[];

    if (availableMoves.length === 0) return -1;
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  }
}