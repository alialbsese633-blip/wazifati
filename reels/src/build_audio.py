# يجهّز الصوت النهائي ويبني الجدول الزمني للمشاهد من المدد الفعلية (الحركة تتبع الصوت)
# 1) قص صمت النهاية لكل جملة + تسريع خفيف (atempo) مع الحفاظ على طبقة الصوت
# 2) قياس كل ملف بـ ffprobe، ونصف ثانية صمت بين الجمل
# 3) دمج وتطبيع -16 LUFS (loudnorm بمرورين) مع fade in/out 0.3 ثانية
import json, subprocess, sys, os
SRC = sys.argv[1]
TEMPO, LEAD, GAP, TAIL = 1.07, 0.3, 0.5, 0.75
OUT = f"{SRC}/final"; os.makedirs(OUT, exist_ok=True)
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
probe = lambda f: float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f).stdout)

lines = json.load(open(f"{SRC}/timing.json"))
t, timeline = LEAD, []
for k, ln in enumerate(lines, 1):
    end = ln["words"][-1]["t"] + ln["words"][-1]["d"] + 0.06
    f = f"{OUT}/line{k}.wav"
    run("ffmpeg", "-y", "-v", "error", "-i", f"{SRC}/line{k}.mp3", "-t", f"{end:.3f}", "-af", f"atempo={TEMPO}", "-ar", "48000", "-ac", "1", f)
    dur = probe(f)
    words = [{"w": w["w"], "t": round(t + w["t"] / TEMPO, 3), "e": round(t + (w["t"] + w["d"]) / TEMPO, 3)} for w in ln["words"]]
    timeline.append({"k": k, "text": ln["text"], "start": round(t, 3), "end": round(t + dur, 3), "dur": round(dur, 3), "words": words})
    t += dur + (GAP if k < len(lines) else 0)
total = round(t + TAIL, 3)

# دمج: صمت البداية + الجمل + فواصل
inputs, filt = [], []
for i, seg in enumerate(timeline):
    inputs += ["-i", f"{OUT}/line{seg['k']}.wav"]
    filt.append(f"[{i}]adelay={int(seg['start'] * 1000)}:all=1[a{i}]")
mix = "".join(f"[a{i}]" for i in range(len(timeline)))
filt.append(f"{mix}amix=inputs={len(timeline)}:normalize=0,apad,atrim=0:{total}[m]")
run("ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[m]", "-ar", "48000", f"{OUT}/raw.wav")

# loudnorm مرور أول للقياس ثم مرور ثانٍ خطي
ln = "loudnorm=I=-16:TP=-1.5:LRA=11"
m = run("ffmpeg", "-v", "info", "-i", f"{OUT}/raw.wav", "-af", ln + ":print_format=json", "-f", "null", "-").stderr
js = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
ln2 = f"{ln}:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
run("ffmpeg", "-y", "-v", "error", "-i", f"{OUT}/raw.wav", "-af", f"{ln2},afade=t=in:d=0.3,afade=t=out:st={total - 0.3}:d=0.3", "-ar", "48000", f"{OUT}/voice.wav")
chk = run("ffmpeg", "-v", "info", "-i", f"{OUT}/voice.wav", "-af", "ebur128", "-f", "null", "-").stderr
print("integrated:", [l for l in chk.splitlines() if " I:" in l][-1].strip())
json.dump({"total": total, "lead": LEAD, "gap": GAP, "tempo": TEMPO, "voice": "ElevenLabs Daniel (multilingual v2)", "lines": timeline},
          open(f"{SRC}/timeline.json", "w"), ensure_ascii=False, indent=1)
for s in timeline: print(s["k"], s["start"], "→", s["end"], f"({s['dur']}s)")
print("TOTAL", total, "s")
