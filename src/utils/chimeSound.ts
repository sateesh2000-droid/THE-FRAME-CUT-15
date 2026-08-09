/**
 * Synthesizes a subtle, premium audio chime for deadline alerts using Web Audio API.
 * Uses a gentle, harmonic tri-tone frequency cascade (A5 -> C#6 -> E6) with exponential decay envelope.
 */
export function playDeadlineAlertChime(volume: number = 0.25): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // Warm harmonic notes for a subtle, high-end luxury chime (A5, C#6, E6)
    const frequencies = [880.00, 1108.73, 1318.51]; // A5, C#6, E6
    const noteDelays = [0, 0.08, 0.16]; // Subtle arpeggiation

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft sine wave for clean bell sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + noteDelays[index]);

      // Subtle frequency decay for realistic acoustic bell envelope
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, now + noteDelays[index] + 0.6);

      const noteVolume = Math.max(0.01, volume * (index === 2 ? 0.8 : 0.6));
      
      // Gain envelope: fast attack, smooth exponential release
      gain.gain.setValueAtTime(0, now + noteDelays[index]);
      gain.gain.linearRampToValueAtTime(noteVolume, now + noteDelays[index] + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + noteDelays[index] + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + noteDelays[index]);
      osc.stop(now + noteDelays[index] + 0.7);
    });

    // Clean up audio context after playback finishes
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 1000);
  } catch (err) {
    console.warn("Audio chime playback prevented or not supported:", err);
  }
}
