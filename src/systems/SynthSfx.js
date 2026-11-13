/**
 * SynthSfx.js — Efectos de sonido PROVISIONALES sintetizados con Web Audio (estilo 8 bits).
 * No usan archivos externos. Se reemplazarán por archivos libres (CC0/CC-BY) en E7.
 */

let noiseBuffer = null;

function getNoise(ctx) {
    if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
    const len = Math.floor(ctx.sampleRate * 0.6);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuffer;
}

/** Tono con barrido de frecuencia y envolvente rápida. */
function tone(ctx, out, { type = 'square', from, to, duration, volume = 0.2, delay = 0 }) {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(out);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
}

/** Ruido filtrado (golpes, explosiones). */
function noise(ctx, out, { duration, volume = 0.3, freqFrom = 3000, freqTo = 200, delay = 0 }) {
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freqFrom, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t0 + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter).connect(gain).connect(out);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
}

/** Catálogo de efectos sintetizados: nombre → función(ctx, destino). */
export const SYNTH_SFX = {
    shoot(ctx, out) {
        tone(ctx, out, { from: 1200, to: 240, duration: 0.07, volume: 0.09 });
        noise(ctx, out, { duration: 0.05, volume: 0.06, freqFrom: 6000, freqTo: 1500 });
    },
    jump(ctx, out) {
        tone(ctx, out, { from: 260, to: 720, duration: 0.14, volume: 0.1 });
    },
    hit(ctx, out) {
        noise(ctx, out, { duration: 0.09, volume: 0.22, freqFrom: 4000, freqTo: 400 });
        tone(ctx, out, { from: 220, to: 90, duration: 0.09, volume: 0.1 });
    },
    explosion(ctx, out) {
        noise(ctx, out, { duration: 0.6, volume: 0.4, freqFrom: 2200, freqTo: 60 });
        tone(ctx, out, { type: 'triangle', from: 120, to: 30, duration: 0.5, volume: 0.25 });
    },
    death(ctx, out) {
        tone(ctx, out, { from: 520, to: 260, duration: 0.15, volume: 0.12 });
        tone(ctx, out, { from: 390, to: 180, duration: 0.18, volume: 0.12, delay: 0.14 });
        tone(ctx, out, { from: 260, to: 60, duration: 0.35, volume: 0.12, delay: 0.3 });
    },
    special(ctx, out) {
        tone(ctx, out, { type: 'sawtooth', from: 220, to: 880, duration: 0.25, volume: 0.08 });
        tone(ctx, out, { from: 660, to: 1320, duration: 0.2, volume: 0.07, delay: 0.12 });
    },
    ui(ctx, out) {
        tone(ctx, out, { from: 660, to: 990, duration: 0.06, volume: 0.08 });
    },
    victory(ctx, out) {
        [523, 659, 784, 1047].forEach((f, i) =>
            tone(ctx, out, { from: f, to: f, duration: 0.16, volume: 0.1, delay: i * 0.13 })
        );
    },
};
