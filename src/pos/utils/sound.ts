const ctx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

export function beep(freq = 880, duration = 80, volume = 0.15) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch { /* ignore */ }
}

export const sounds = {
  addItem: () => beep(880, 60, 0.1),
  success: () => { beep(660, 80, 0.12); setTimeout(() => beep(880, 120, 0.12), 100); },
  error: () => beep(220, 200, 0.1),
};
