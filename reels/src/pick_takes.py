# يختار أفضل نسخة لكل جملة: الأقرب للنص عند تفريغها محلياً بـ Whisper، ثم الأقصر
import sys, json, glob, re, subprocess, shutil, difflib, numpy as np
from faster_whisper import WhisperModel
OUT = sys.argv[1]
m = WhisperModel('small', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[ً-ْـ،؟.,!?«»]', '', s).replace('أ', 'ا').replace('إ', 'ا').replace('ة', 'ه').replace('ى', 'ي').split()
res = []
for k in range(1, 6):
    best = None
    for f in sorted(glob.glob(f"{OUT}/takes/line{k}_*.mp3")):
        raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'])
        a = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        hyp = ' '.join(s.text for s in m.transcribe(a, language='ar', beam_size=5)[0])
        meta = json.load(open(f[:-4] + '.json'))
        score = difflib.SequenceMatcher(None, norm(meta['text']), norm(hyp)).ratio()
        end = meta['words'][-1]['t'] + meta['words'][-1]['d']
        print(f.split('/')[-1], round(score, 3), round(end, 2), hyp)
        if best is None or (score, -end) > (best[0], -best[1]): best = (score, end, f, meta)
    shutil.copy(best[2], f"{OUT}/line{k}.mp3")
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", best[2]]))
    res.append({**best[3], "voice": "elevenlabs:Daniel", "dur": dur, "take": best[2].split('/')[-1], "stt_score": round(best[0], 3)})
    print('->', res[-1]['take'])
json.dump(res, open(f"{OUT}/timing.json", "w"), ensure_ascii=False, indent=1)
print('speech total', round(sum(r['words'][-1]['t'] + r['words'][-1]['d'] for r in res), 2))
