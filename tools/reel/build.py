"""Narrated reel: scenes + a female voice + a score and sound effects made from code.

  python3 tools/reel/build.py explain-src/autoresearch/reel.json [--out x.mp4] [--voice NAME] [--work DIR]

Steps (each writes into the work dir, default tools/.reel-work/<name>/):
  1. voice    edge-tts reads every line (cached in tools/.tts-cache by voice + rate + text);
              sentence offsets come back with the audio, so subtitles start with the words
  2. plan     a shot plays scene seconds from -> to at normal speed, then holds its last frame
              until the shot's lines are spoken; while it holds the camera pushes in a little
  3. frames   tools/reel/record.mjs seeks the scene page frame by frame (capture mode) and
              writes the subtitle into the caption strip under the picture
  4. sound    music (tools/reel/sound.py) dips while the voice speaks; effects land on the
              scene's own events (tools/reel/scene_events.mjs); loudness normalised to -16 LUFS
  5. mp4      H.264 + AAC, then objective checks (durations, peaks, loudness, the music dip)

The voice needs the network (edge-tts talks to Microsoft's speech service; HTTPS_PROXY is used
when set). Everything else is local.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
import sound as S  # noqa: E402

TTS_CACHE = ROOT / 'tools/.tts-cache'
LEAD_FIRST, LEAD, GAP, TAIL, END_HOLD = 0.9, 0.2, 0.25, 0.35, 2.5
ZOOM_MAX, ZOOM_EASE = 0.05, 0.7
CUE_GAIN = {'typing': 0.45, 'click': 0.4, 'whir': 0.5, 'swish': 0.6, 'pen': 0.7, 'tick': 0.7, 'soft': 0.8,
            'keep': 1.0, 'discard': 1.0, 'crash': 0.9, 'advance': 0.8, 'rewind': 0.8, 'start': 0.9,
            'bell': 1.0, 'whoosh': 0.55, 'pop': 0.55, 'birds': 1.0, 'sunrise': 0.7, 'snip': 0.6, 'balance': 0.9}


def ffmpeg() -> str:
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, **kw)


# ---------------------------------------------------------------- 1. voice

async def _speak(text: str, voice: str, rate: str, mp3: Path) -> list[tuple[float, float, str]]:
    import edge_tts
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    c = edge_tts.Communicate(text, voice, rate=rate, proxy=proxy, boundary='SentenceBoundary')
    sents = []
    with open(mp3, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] == 'SentenceBoundary':
                sents.append((ch['offset'] / 1e7, ch['duration'] / 1e7, ch['text']))
    return sents


def speak(text: str, voice: str, rate: str) -> tuple[np.ndarray, list]:
    """mono float32 at S.SR, and sentence offsets [(start, dur, text)]"""
    TTS_CACHE.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha1(f'{voice}|{rate}|{text}'.encode()).hexdigest()[:16]
    mp3, meta = TTS_CACHE / f'{key}.mp3', TTS_CACHE / f'{key}.json'
    if not meta.exists():
        sents = asyncio.run(_speak(text, voice, rate, mp3))
        meta.write_text(json.dumps({'text': text, 'voice': voice, 'rate': rate, 'sentences': sents}, ensure_ascii=False))
    sents = json.loads(meta.read_text())['sentences']
    raw = run([ffmpeg(), '-v', 'error', '-i', str(mp3), '-f', 'f32le', '-ac', '1', '-ar', str(S.SR), '-'],
              capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64), sents


SENT_END = re.compile(r'(?<=[。！？])')


def sentences(text: str) -> list[str]:
    return [s for s in SENT_END.split(text) if s.strip()]


# ---------------------------------------------------------------- 2. plan

def node_json(args: list[str]) -> dict:
    return json.loads(run(['node', *args], capture_output=True, cwd=ROOT).stdout)


def snap(x: float, stops: list[float]) -> float:
    """caption-sampled times are up to 0.05 s late; use the scene's own stop when one is that close"""
    near = min(stops, key=lambda s: abs(s - x))
    return near if abs(near - x) <= 0.06 else x


def ease(x: float) -> float:
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def plan(reel: dict, voice: str, rate: str) -> dict:
    scenes = sorted({s['scene'] for s in reel['shots'] if 'scene' in s})
    info = node_json([str(HERE / 'scene_info.mjs'), *scenes])
    shots, v = [], 0.0
    for i, sh in enumerate(reel['shots']):
        lines = []
        for ln in sh['lines']:
            audio, sents = speak(ln.get('say', ln['t']), voice, rate)
            lines.append({'t': ln['t'], 'audio': audio, 'sents': sents})
        if 'scene' in sh:
            stops = info[sh['scene']]['stops']
            a, b = snap(sh['from'], stops), snap(sh['to'], stops)
            natural = b - a
        else:
            a = b = natural = 0.0
        lead = LEAD_FIRST if i == 0 else LEAD
        narr = lead + sum(len(l['audio']) / S.SR for l in lines) + GAP * (len(lines) - 1) + TAIL
        length = max(natural, narr) + (END_HOLD if 'card' in sh else 0.0)
        at = v + lead
        for l in lines:
            l['start'] = at
            at += len(l['audio']) / S.SR + GAP
        shots.append({**{k: sh[k] for k in sh if k != 'lines'}, 'from': a, 'to': b, 'natural': natural,
                      'v0': v, 'v1': v + length, 'lines': lines})
        v += length
    return {'shots': shots, 'length': v, 'info': info}


def subtitle_cues(p: dict) -> list[tuple[float, float, str]]:
    """(start, end, text): one sentence at a time, timed by the voice's own sentence offsets"""
    cues = []
    for sh in p['shots']:
        for l in sh['lines']:
            shown = sentences(l['t'])
            spoken = l['sents']
            dur = len(l['audio']) / S.SR
            if len(spoken) == len(shown):
                starts = [l['start'] + s[0] for s in spoken]
            else:  # fall back to character share
                total = sum(len(x) for x in shown)
                acc, starts = 0, []
                for x in shown:
                    starts.append(l['start'] + dur * acc / total)
                    acc += len(x)
            for j, x in enumerate(shown):
                cues.append([max(starts[j] - 0.08, sh['v0']), None, x])
            cues[-1][1] = l['start'] + dur
    for j in range(len(cues) - 1):
        nxt = cues[j + 1][0]
        end = cues[j][1] if cues[j][1] is not None else nxt
        cues[j][1] = nxt if nxt - end < 1.0 else end + 0.6  # keep a line up across short pauses
    cues[-1][1] = (cues[-1][1] or p['length']) + 0.6
    return [tuple(c) for c in cues]


def frames(p: dict, fps: int, cues: list) -> list[dict]:
    out = []
    n = int(round(p['length'] * fps))
    k = 0
    z_prev, f_prev, prev_scene = 0.0, None, None
    for sh in p['shots']:
        f0 = int(round(sh['v0'] * fps))
        f1 = int(round(sh['v1'] * fps))
        scene = sh.get('scene') or sh['card']
        focus = sh.get('focus', [600, 337])
        if scene != prev_scene:
            z_prev, f_prev = 0.0, focus
        hold_len = max(1e-6, (sh['v1'] - sh['v0']) - sh['natural'])
        for fi in range(f0, min(f1, n)):
            local = fi / fps - sh['v0']
            if local < sh['natural']:
                tt = sh['from'] + local
                z = z_prev * (1 - ease(local / ZOOM_EASE))
            else:
                tt = max(sh['from'], sh['to'] - 1e-3) if 'scene' in sh else 0.0
                z = ZOOM_MAX * ease((local - sh['natural']) / hold_len)
                if sh['natural'] < ZOOM_EASE:  # a short shot: blend out of the last shot's push-in first
                    z = max(z, z_prev * (1 - ease(local / ZOOM_EASE)))
            mix = ease(local / ZOOM_EASE)
            fx = f_prev[0] + (focus[0] - f_prev[0]) * mix
            fy = f_prev[1] + (focus[1] - f_prev[1]) * mix
            x = fi / fps
            while k < len(cues) - 1 and cues[k][1] <= x and cues[k + 1][0] <= x:
                k += 1
            sub = cues[k][2] if cues[k][0] <= x < cues[k][1] else ''
            out.append({'s': scene, 't': round(tt, 4), 'z': round(1 + z, 4), 'f': [round(fx), round(fy)], 'sub': sub})
        z_prev = (out[-1]['z'] - 1) if out else 0.0
        f_prev = focus
        prev_scene = scene
    return out


# ---------------------------------------------------------------- 4. sound

def events(p: dict) -> list[tuple[float, str]]:
    scenes = sorted({s['scene'] for s in p['shots'] if 'scene' in s})
    ev = node_json([str(HERE / 'scene_events.mjs'), *scenes])
    out = []
    for sh in p['shots']:
        if 'scene' not in sh:
            continue
        for te, name in ev[sh['scene']]:
            if sh['from'] <= te < sh['to'] or (te == sh['to'] == p['info'][sh['scene']]['duration']):
                out.append((sh['v0'] + (te - sh['from']), name))
    # a whoosh where one scene gives way to the next
    for a, b in zip(p['shots'], p['shots'][1:]):
        if a.get('scene') != b.get('scene'):
            out.append((b['v0'] - 0.35, 'whoosh'))
    out.sort()
    # thin out dense runs (the scissors cut 26 times in 1.5 s): at most one cue of a kind per 60 ms
    thin, last = [], {}
    for t, name in out:
        if t - last.get(name, -1) >= 0.06:
            thin.append((t, name))
            last[name] = t
    return thin


def moods(p: dict) -> list[dict]:
    return [{'start': sh['v0'], 'end': sh['v1'], 'mood': sh.get('mood', 'work')} for sh in p['shots']]


def mix(p: dict, bpm: float, work: Path) -> tuple[Path, dict]:
    n = int(p['length'] * S.SR) + S.SR
    voice = np.zeros(n)
    for sh in p['shots']:
        for l in sh['lines']:
            S.add(voice, l['audio'], l['start'])
    rng = np.random.default_rng(11)
    sfx = np.zeros((n, 2))
    evs = events(p)
    for t, name in evs:
        S.add(sfx, S.cue(name, rng), t, CUE_GAIN.get(name, 0.8))
    music = S.music(p['length'], moods(p), bpm)[:n]
    music = np.pad(music, ((0, n - len(music)), (0, 0)))
    # levels: music sits ~13 dB under the voice, dips a further ~9 dB while she speaks;
    # effects peak about 7 dB under the voice's peaks
    active = np.abs(voice) > 0.02
    v_rms = np.sqrt(np.mean(voice[active] ** 2)) if active.any() else 0.1
    m_rms = np.sqrt(np.mean(music ** 2)) or 1e-9
    music *= (v_rms * 0.22) / m_rms
    g = S.duck(voice, under=0.35)
    bus = music * g[:, None] + sfx * (np.abs(voice).max() * 0.45 / (np.abs(sfx).max() or 1))
    bus = S.reverb(bus, rt60=2.2, wet=0.22)
    out = bus + S.stereo(voice, 0.0) * np.sqrt(2)
    raw = work / 'mix-raw.wav'
    write_wav(raw, out[:int(p['length'] * S.SR)])
    # two-pass loudness normalisation to -16 LUFS, true peak -1.5 dB
    meas = run([ffmpeg(), '-hide_banner', '-i', str(raw), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json',
                '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    final = work / 'mix.wav'
    run([ffmpeg(), '-v', 'error', '-y', '-i', str(raw), '-af',
         f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
         f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true",
         '-ar', str(S.SR), str(final)])
    # what the checks need: where the voice is, and the music bed alone
    stats = {'events': len(evs), 'voice_active': active, 'music': music * g[:, None]}
    return final, stats


def write_wav(path: Path, x: np.ndarray) -> None:
    pk = np.abs(x).max() or 1
    y = (np.clip(x / max(pk, 1.0), -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(S.SR)
        w.writeframes(y.tobytes())


def srt(cues: list, path: Path) -> None:
    def ts(x):
        ms = int(round(x * 1000))
        return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
    path.write_text(''.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{t}\n\n' for i, (a, b, t) in enumerate(cues)), encoding='utf-8')


# ---------------------------------------------------------------- 5. checks

def probe(path: Path) -> dict:
    err = subprocess.run([ffmpeg(), '-hide_banner', '-i', str(path)], capture_output=True, text=True).stderr
    dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', err)
    return {'duration': int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3]) if dur else None,
            'streams': [l.strip() for l in err.splitlines() if 'Stream #' in l]}


def loudness(path: Path) -> dict:
    err = run([ffmpeg(), '-hide_banner', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
              capture_output=True, text=True).stderr
    tail = err[err.rindex('Summary:'):]
    return {'I': float(re.search(r'I:\s+(-?[\d.]+) LUFS', tail)[1]),
            'peak': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail)[1])}


def checks(out: Path, p: dict, stats: dict, fps: int) -> list[tuple[bool, str]]:
    res = []
    pr = probe(out)
    v = [s for s in pr['streams'] if 'Video:' in s]
    a = [s for s in pr['streams'] if 'Audio:' in s]
    res.append((len(v) == 1 and len(a) == 1, f'streams: {len(v)} video, {len(a)} audio'))
    res.append((abs(pr['duration'] - p['length']) < 0.1, f"duration {pr['duration']:.2f} s, plan {p['length']:.2f} s"))
    ld = loudness(out)
    res.append((-17.5 <= ld['I'] <= -14.5, f"loudness {ld['I']:.1f} LUFS (target -16)"))
    res.append((ld['peak'] <= -1.0, f"peak {ld['peak']:.1f} dBFS (≤ -1)"))
    act, mus = stats['voice_active'], stats['music']
    win = S.SR // 2
    m = len(act) // win
    a2 = act[:m * win].reshape(m, win).mean(axis=1) > 0.3
    q = mus[:m * win].reshape(m, win, 2)
    r = np.sqrt((q ** 2).mean(axis=(1, 2))) + 1e-12
    if a2.any() and (~a2).any():
        dip = 20 * np.log10(np.median(r[~a2]) / np.median(r[a2]))
        res.append((dip >= 6, f'music dips {dip:.1f} dB under the voice (≥ 6)'))
    res.append((stats['events'] > 50, f"{stats['events']} sound effects placed"))
    return res


# ---------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('reel')
    ap.add_argument('--out')
    ap.add_argument('--voice')
    ap.add_argument('--work')
    ap.add_argument('--only-audio', action='store_true', help='skip the frames (mix and check the audio only)')
    a = ap.parse_args()
    reel = json.loads(Path(a.reel).read_text(encoding='utf-8'))
    voice = a.voice or reel['voice']
    rate = reel.get('rate', '+0%')
    fps = int(reel.get('fps', 30))
    name = Path(a.reel).parent.name
    work = Path(a.work) if a.work else ROOT / 'tools/.reel-work' / name
    work.mkdir(parents=True, exist_ok=True)
    out = Path(a.out) if a.out else ROOT / reel['out']

    print(f'voice {voice} {rate}; reading {sum(len(s["lines"]) for s in reel["shots"])} lines')
    p = plan(reel, voice, rate)
    cues = subtitle_cues(p)
    srt(cues, work / 'subtitles.srt')
    fr = frames(p, fps, cues)
    print(f'plan: {len(p["shots"])} shots, {p["length"]:.1f} s, {len(fr)} frames, {len(cues)} subtitles')
    (work / 'frames.json').write_text(json.dumps({'fps': fps, 'end_card': reel.get('end_card'), 'frames': fr},
                                                 ensure_ascii=False))
    audio, stats = mix(p, reel.get('music', {}).get('bpm', 72), work)
    print(f'audio: {stats["events"]} effects -> {audio}')
    if a.only_audio:
        return 0
    run(['node', str(HERE / 'record.mjs'), str(work / 'frames.json'), str(work / 'frames')], cwd=ROOT)
    out.parent.mkdir(parents=True, exist_ok=True)
    # crf 28 + tune animation: 12 MB for 200 s (crf 21 was 25 MB; text stays sharp, checked by eye)
    run([ffmpeg(), '-v', 'error', '-y', '-framerate', str(fps), '-i', str(work / 'frames/%05d.png'), '-i', str(audio),
         '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28',
         '-preset', 'slow', '-tune', 'animation', '-c:a', 'aac', '-b:a', '128k',
         '-shortest', '-movflags', '+faststart', str(out)])
    res = checks(out, p, stats, fps)
    for ok, msg in res:
        print(('  ok    ' if ok else '  FAIL  ') + msg)
    print(f'{out} ({out.stat().st_size / 1e6:.1f} MB); subtitles {work / "subtitles.srt"}')
    return 0 if all(ok for ok, _ in res) else 1


if __name__ == '__main__':
    sys.exit(main())
