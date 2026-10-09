"""Music and sound effects for the narrated reel, made from code (no samples, no licences).

Why from code: the reel is published with the repo, and a score written here can follow the
story beat by beat — a music-box lullaby with a ticking clock while the person sleeps (the
clock is the 5-minute budget), a brighter lift when they wake at 06:00, a calm bed under the
explanations, the clock again while the three runs race.

Everything is a numpy array at SR samples per second, stereo as shape (n, 2).
  music(plan)        the score, mood by mood (plan: list of {start, end, mood} in seconds)
  cue(name, rng)     one sound effect (names come from tools/reel/scene_events.mjs)
  duck(voice)        how far the music dips while someone speaks
  reverb(x)          a shared room (FFT convolution with a decaying noise tail)
"""

from __future__ import annotations

import numpy as np

SR = 44100
A4 = 440.0


def hz(midi: float) -> float:
    return A4 * 2 ** ((midi - 69) / 12)


def t_of(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def stereo(x: np.ndarray, pan: float = 0.0) -> np.ndarray:
    """pan -1 (left) .. 1 (right), equal power"""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def add(dst: np.ndarray, src: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(round(at * SR))
    if i >= len(dst) or i + len(src) <= 0:
        return
    s0 = max(0, -i)
    n = min(len(src) - s0, len(dst) - max(i, 0))
    dst[max(i, 0):max(i, 0) + n] += gain * src[s0:s0 + n]


def smooth(x: np.ndarray, win: int) -> np.ndarray:
    """moving average (a gentle low-pass), same length"""
    if win <= 1:
        return x
    c = np.cumsum(np.concatenate([np.zeros(win), x]))
    return (c[win:] - c[:-win]) / win


def highpass(x: np.ndarray, win: int = 8) -> np.ndarray:
    return x - smooth(x, win)


# ---------------------------------------------------------------- instruments

def music_box(f: float, dur: float = 2.2, vel: float = 1.0) -> np.ndarray:
    """a tine: strong fundamental, a few inharmonic partials that die fast, a tiny click"""
    t = t_of(dur)
    out = np.zeros_like(t)
    for ratio, amp, tau in ((1.0, 1.0, 0.9), (2.76, 0.32, 0.28), (5.40, 0.12, 0.12), (8.93, 0.05, 0.06)):
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    out *= np.minimum(1, t / 0.002)
    return vel * out / 1.5


def bell(f: float, dur: float = 2.5, bright: float = 1.0) -> np.ndarray:
    """FM bell: modulator at 3.5x, index decaying faster than the tone"""
    t = t_of(dur)
    idx = 2.2 * bright * np.exp(-t / 0.25)
    out = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t / (dur / 3.5))
    return out * np.minimum(1, t / 0.003)


def pad_note(f: float, dur: float, attack: float = 1.2, release: float = 1.6) -> np.ndarray:
    """soft triangle-ish pad: odd harmonics at 1/k^2, three voices detuned by a few cents"""
    t = t_of(dur + release)
    out = np.zeros_like(t)
    for cents in (-6, 0, 6):
        g = f * 2 ** (cents / 1200)
        for k in (1, 3, 5):
            out += np.sin(2 * np.pi * g * k * t + cents) / (k * k)
    env = np.minimum(1, t / attack)
    rel = np.clip((t - dur) / release, 0, 1)
    env *= 1 - rel
    return out * env / 3.6


def bass_note(f: float, dur: float) -> np.ndarray:
    t = t_of(dur)
    out = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return out * np.minimum(1, t / 0.02) * np.exp(-t / (dur * 0.9)) / 1.25


def noise_burst(dur: float, tau: float, rng, hp: int = 6) -> np.ndarray:
    t = t_of(dur)
    return highpass(rng.standard_normal(len(t)), hp) * np.exp(-t / tau)


# ---------------------------------------------------------------- sound effects

def _glide(f0: float, f1: float, dur: float, tau: float) -> np.ndarray:
    t = t_of(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / tau) * np.minimum(1, t / 0.004)


def cue(name: str, rng) -> np.ndarray:
    """one effect, stereo"""
    if name == 'typing':           # a few keys under the AI's hands
        out = np.zeros(int(0.75 * SR))
        at = 0.0
        while at < 0.62:
            k = noise_burst(0.03, 0.004, rng, 3) * rng.uniform(0.5, 1.0)
            add(out, k, at)
            at += rng.uniform(0.055, 0.11)
        return stereo(out * 0.55, 0.25)
    if name == 'whir':             # training spins up
        t = t_of(0.7)
        f = 120 + 90 * t / 0.7
        x = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in (1, 2, 3))
        x *= np.sin(np.pi * t / 0.7) ** 2
        return stereo(0.35 * x + 0.04 * smooth(rng.standard_normal(len(t)), 30), 0.0)
    if name == 'tick':
        x = 0.6 * _glide(2600, 2400, 0.05, 0.008)
        add(x, 0.2 * noise_burst(0.02, 0.002, rng), 0.0)
        return stereo(x, 0.3)
    if name == 'soft':             # a quiet note: something was written down
        return stereo(0.45 * music_box(hz(72), 1.2), -0.1)
    if name == 'keep':             # bright, rising: kept
        out = np.zeros(int(1.6 * SR))
        add(out, bell(hz(84), 1.4), 0.0, 0.55)
        add(out, bell(hz(89), 1.5), 0.09, 0.55)
        return stereo(out, 0.15)
    if name == 'discard':          # a soft drop: thrown away
        return stereo(0.7 * _glide(330, 160, 0.35, 0.12), -0.15)
    if name == 'crash':            # a short glitch: the run fell over
        t = t_of(0.45)
        f = 420 * (90 / 420) ** (t / 0.45)
        ph = 2 * np.pi * np.cumsum(f) / SR
        sq = sum(np.sin(k * ph) / k for k in (1, 3, 5, 7))
        x = np.round(sq * 4) / 4 * np.exp(-t / 0.18)
        x += 0.25 * noise_burst(0.45, 0.08, rng)
        return stereo(0.45 * x, 0.0)
    if name == 'click':            # git commit: a shutter-like double click
        out = np.zeros(int(0.12 * SR))
        add(out, noise_burst(0.02, 0.003, rng, 3), 0.0)
        add(out, noise_burst(0.02, 0.003, rng, 3), 0.035, 0.7)
        return stereo(0.8 * out, -0.2)
    if name == 'swish':            # reading the log: a page turns
        t = t_of(0.32)
        x = smooth(rng.standard_normal(len(t)), 4) * np.sin(np.pi * t / 0.32) ** 2
        return stereo(0.35 * highpass(x, 20), 0.2)
    if name == 'pen':              # one line into results.tsv
        t = t_of(0.3)
        x = noise_burst(0.3, 0.2, rng, 4) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t))
        return stereo(0.22 * x, -0.25)
    if name == 'advance':          # the branch moves forward
        return stereo(0.45 * _glide(520, 880, 0.22, 0.12), 0.2)
    if name == 'rewind':           # git reset: tape running back
        t = t_of(0.45)
        x = _glide(900, 260, 0.45, 0.3) * (0.6 + 0.4 * np.sin(2 * np.pi * 22 * t))
        return stereo(0.35 * x, -0.2)
    if name == 'start':            # beep, beep, go
        out = np.zeros(int(0.9 * SR))
        for i, (f, d) in enumerate(((880, 0.09), (880, 0.09), (1320, 0.22))):
            add(out, np.sin(2 * np.pi * f * t_of(d)) * np.minimum(1, (d - t_of(d)) / 0.02), i * 0.24)
        return stereo(0.28 * out, 0.0)
    if name == 'bell':             # 5:00 — the timer rings
        return stereo(0.6 * bell(hz(93), 3.0, 0.8), 0.0)
    if name == 'whoosh':           # a new scene / a new picture
        t = t_of(0.7)
        n = rng.standard_normal(len(t))
        lo, hi = smooth(n, 40), smooth(n, 6)
        mix = np.clip(t / 0.7, 0, 1)
        x = (lo * (1 - mix) + hi * mix) * np.sin(np.pi * t / 0.7) ** 2
        return np.stack([x * (1 - 0.5 * mix), x * (0.5 + 0.5 * mix)], axis=1) * 0.9
    if name == 'pop':              # a green dot: kept during the night
        return stereo(0.35 * _glide(rng.uniform(420, 520), 980, 0.09, 0.03), rng.uniform(-0.5, 0.5))
    if name == 'birds':            # 06:00
        out = np.zeros((int(2.8 * SR), 2))
        at = 0.1
        while at < 2.4:
            d = rng.uniform(0.07, 0.14)
            t = t_of(d)
            f = rng.uniform(3200, 4600) * (1 + 0.18 * np.sin(2 * np.pi * rng.uniform(18, 32) * t))
            ch = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2
            add(out, stereo(ch, rng.uniform(-0.8, 0.8)), at, 0.18)
            at += rng.uniform(0.09, 0.32)
        return out
    if name == 'sunrise':          # a high chord that opens up
        out = np.zeros(int(5.0 * SR))
        for m in (77, 81, 84, 88):
            add(out, pad_note(hz(m), 2.5, attack=1.6, release=2.4), 0.0, 0.3)
        return stereo(out, 0.0)
    if name == 'snip':             # scissors
        out = np.zeros(int(0.08 * SR))
        t = t_of(0.015)
        blade = np.sin(2 * np.pi * 5200 * t) * noise_burst(0.015, 0.004, rng, 2)
        add(out, blade, 0.0)
        add(out, blade, 0.028, 0.8)
        return stereo(0.5 * out, rng.uniform(-0.3, 0.3))
    if name == 'balance':          # two equal notes: a tie
        out = np.zeros(int(1.8 * SR))
        add(out, music_box(hz(81), 1.4), 0.0, 0.6)
        add(out, music_box(hz(81), 1.4), 0.32, 0.6)
        return stereo(out, 0.0)
    raise ValueError('unknown cue ' + name)


# ---------------------------------------------------------------- the score

# F major, one chord a bar: Fmaj7 - Dm7 - Bbmaj7 - Csus2 (I vi IV V), MIDI notes
CHORDS = [
    (53, [65, 69, 72, 76]),   # F   : F A C E
    (50, [62, 65, 69, 72]),   # Dm7 : D F A C
    (46, [62, 65, 69, 70]),   # Bb  : D F A Bb (Bbmaj7 without the root up top)
    (48, [60, 62, 67, 72]),   # Csus2
]
SCALE = [65, 67, 69, 72, 74, 77, 79, 81, 84]  # F major pentatonic, the music box's notes

# per mood: pad level, pad octave shift, music-box notes per bar (pattern in eighths), clock, hats, bass
MOODS = {
    'night':   dict(pad=0.55, up=0, box=[0, 3, 4, 6], clock=True, hats=False, bass=0.0, box_oct=12),
    'morning': dict(pad=0.7, up=12, box=[0, 2, 3, 4, 6, 7], clock=False, hats=False, bass=0.3, box_oct=12),
    'work':    dict(pad=0.6, up=0, box=[0, 4], clock=False, hats=True, bass=0.45, box_oct=12),
    'race':    dict(pad=0.6, up=0, box=[0, 2, 4, 6], clock=True, hats=True, bass=0.5, box_oct=12),
    'end':     dict(pad=0.75, up=12, box=[0, 2, 4, 5, 6], clock=False, hats=False, bass=0.4, box_oct=12),
}


def music(length: float, moods: list[dict], bpm: float, seed: int = 7) -> np.ndarray:
    """the whole score; moods: [{start, end, mood}] covering the video"""
    rng = np.random.default_rng(seed)
    beat = 60 / bpm
    bar = 4 * beat
    n = int(length * SR) + SR
    pad = np.zeros(n)
    box = np.zeros((n, 2))
    perc = np.zeros((n, 2))
    bass = np.zeros(n)

    def mood_at(x: float) -> str:
        for m in moods:
            if m['start'] <= x < m['end']:
                return m['mood']
        return moods[-1]['mood']

    bars = int(np.ceil(length / bar))
    last_note = SCALE[2]
    for b in range(bars):
        t0 = b * bar
        mood = mood_at(t0 + 0.01)
        M = MOODS[mood]
        root, notes = CHORDS[b % len(CHORDS)]
        final = b == bars - 1
        for m in notes:
            add(pad, pad_note(hz(m + M['up'] - 12 * (mood == 'night')), bar * (1.6 if final else 1.0)), t0, M['pad'] * 0.11)
        if M['bass']:
            add(bass, bass_note(hz(root - 12), bar * 0.95), t0, M['bass'] * 0.30)
        # music box: walk the pentatonic near the last note, prefer chord tones on the downbeat
        for e in M['box']:
            if rng.random() < 0.18 and e != 0:
                continue
            cands = [s for s in SCALE if abs(s - last_note) <= 5] or SCALE
            if e == 0:
                tones = [s for s in cands if (s - root) % 12 in [(x - root) % 12 for x in notes]]
                cands = tones or cands
            note = int(rng.choice(cands))
            last_note = note
            vel = 0.9 if e == 0 else rng.uniform(0.45, 0.75)
            add(box, stereo(music_box(hz(note + M['box_oct'] - 12), 2.0, vel), rng.uniform(-0.35, 0.35)),
                t0 + e * beat / 2, 0.10)
        for q in range(4):
            tq = t0 + q * beat
            if M['clock']:
                tick = cue('tick', rng) * (1.0 if q % 2 == 0 else 0.7)
                if q % 2:
                    tick = stereo(0.5 * _glide(2000, 1900, 0.05, 0.008), -0.3)
                add(perc, tick, tq, 0.10)
            if M['hats']:
                add(perc, stereo(noise_burst(0.06, 0.012, rng, 3), 0.35), tq + beat / 2, 0.035)
        if final:
            # a closing figure on the tonic: C - A - F, then the high F rings
            for i, m in enumerate((84, 81, 77, 89)):
                add(box, stereo(music_box(hz(m), 3.0, 0.8), 0.1 * (i - 1.5)), t0 + bar * 0.5 + i * beat / 2, 0.12)

    out = stereo(pad, 0.0) + stereo(bass, 0.0) + box + perc
    # fade in / out
    fade = np.ones(n)
    k = int(1.2 * SR)
    fade[:k] = np.linspace(0, 1, k)
    e = int(length * SR)
    k2 = int(2.5 * SR)
    fade[e - k2:e] = np.linspace(1, 0, k2) ** 1.5
    fade[e:] = 0
    return out * fade[:, None]


def reverb(x: np.ndarray, rt60: float = 2.2, wet: float = 0.22, seed: int = 3) -> np.ndarray:
    """FFT convolution with a decaying stereo noise tail"""
    rng = np.random.default_rng(seed)
    n_ir = int(rt60 * SR)
    t = np.arange(n_ir) / SR
    env = np.exp(-6.91 * t / rt60)
    pre = int(0.02 * SR)
    out = np.empty_like(x)
    size = 1 << int(np.ceil(np.log2(len(x) + n_ir + pre)))
    for ch in range(2):
        ir = np.zeros(n_ir + pre)
        ir[pre:] = smooth(rng.standard_normal(n_ir), 3) * env
        ir /= np.sqrt(np.sum(ir ** 2))
        y = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir, size), size)[:len(x)]
        out[:, ch] = x[:, ch] + wet * y
    return out


def duck(voice: np.ndarray, under: float = 0.32, attack: float = 0.08, release: float = 0.45) -> np.ndarray:
    """music gain per sample: 1 with no voice, `under` while the voice speaks"""
    rate = 100  # control rate, Hz
    hop = SR // rate
    m = len(voice) // hop + 1
    v = np.pad(np.abs(voice), (0, m * hop - len(voice)))
    lvl = v.reshape(m, hop).max(axis=1)
    on = lvl > 0.02 * (lvl.max() or 1)
    g = np.ones(m)
    cur = 1.0
    a, r = 1 / (attack * rate), 1 / (release * rate)
    # look ahead a little so the dip starts just before the first word
    ahead = int(0.12 * rate)
    on = np.concatenate([on[ahead:], np.zeros(ahead, bool)]) | on
    for i in range(m):
        tgt = under if on[i] else 1.0
        cur = max(tgt, cur - a) if tgt < cur else min(tgt, cur + r)
        g[i] = cur
    return np.interp(np.arange(len(voice)), np.arange(m) * hop, g)
