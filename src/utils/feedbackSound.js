const CORRECT_SOUND_VOLUME = 0.38;
const WRONG_SOUND_VOLUME = 0.35;

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High pitch (e.g. E6 - 1318.51 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1046.50, now); // C6
    osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // slide up to E6

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(CORRECT_SOUND_VOLUME, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Tone 2: Higher pitch (e.g. G6 - 1567.98 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // start at E6
    osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.20); // slide to G6

    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(CORRECT_SOUND_VOLUME, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.20);
  } catch (error) {
    console.error("Failed to play correct sound:", error);
  }
}

export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Low pitch buzzer-like tone (using triangle wave for gentler sound than sawtooth)
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.15); // slide down

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(WRONG_SOUND_VOLUME, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (error) {
    console.error("Failed to play wrong sound:", error);
  }
}

export function playFeedbackSound(isCorrect) {
  if (isCorrect) {
    playCorrectSound();
  } else {
    playWrongSound();
  }
}

