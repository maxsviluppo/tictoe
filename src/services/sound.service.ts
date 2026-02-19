import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private audioCtx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted = false;
  private isInitialized = false;

  constructor() {}

  /**
   * Initializes the AudioContext. Must be called after a user gesture.
   */
  init() {
    if (this.isInitialized) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    
    this.startAmbientDrone();
    this.isInitialized = true;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // Initialize if not done yet
    if (!this.isInitialized) {
      this.init();
    }

    // Adjust ambient volume
    if (this.ambientGain && this.audioCtx) {
      const targetVol = this.isMuted ? 0 : 0.03;
      this.ambientGain.gain.setTargetAtTime(targetVol, this.audioCtx.currentTime, 0.5);
    }

    return this.isMuted;
  }

  playMove(type: 'player' | 'ai') {
    if (this.isMuted || !this.audioCtx) return;
    this.resume();

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'player') {
      // High tech ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.15);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.2);
    } else {
      // AI Bloop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  playWin() {
    if (this.isMuted || !this.audioCtx) return;
    this.resume();
    const t = this.audioCtx.currentTime;
    // C Major Arpeggio
    this.playTone(523.25, t, 0.1, 'sine'); // C5
    this.playTone(659.25, t + 0.1, 0.1, 'sine'); // E5
    this.playTone(783.99, t + 0.2, 0.3, 'sine'); // G5
    this.playTone(1046.50, t + 0.3, 0.6, 'sine'); // C6
  }

  playLose() {
    if (this.isMuted || !this.audioCtx) return;
    this.resume();
    const t = this.audioCtx.currentTime;
    // Descending minor/dissonant
    this.playTone(400, t, 0.2, 'sawtooth');
    this.playTone(380, t + 0.2, 0.4, 'sawtooth');
  }

  playDraw() {
    if (this.isMuted || !this.audioCtx) return;
    this.resume();
    const t = this.audioCtx.currentTime;
    this.playTone(400, t, 0.1, 'square');
    this.playTone(400, t + 0.15, 0.1, 'square');
  }

  playUiInteraction() {
    if (this.isMuted || !this.audioCtx) return;
    this.resume();
    const t = this.audioCtx.currentTime;
    // Short high blip
    this.playTone(1200, t, 0.05, 'sine');
  }

  private playTone(freq: number, time: number, duration: number, type: OscillatorType) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  private startAmbientDrone() {
    if (!this.audioCtx) return;

    // Create two oscillators for a detuned drone effect
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    this.ambientGain = this.audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Deep space frequencies
    osc1.frequency.value = 80;
    osc2.frequency.value = 82; // Slight detune causes beating

    this.ambientGain.gain.value = 0.03; // Very quiet background

    osc1.connect(this.ambientGain);
    osc2.connect(this.ambientGain);
    this.ambientGain.connect(this.audioCtx.destination);

    osc1.start();
    osc2.start();
  }

  private resume() {
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }
}