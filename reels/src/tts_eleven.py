# التعليق الصوتي عبر ElevenLabs (بديل edge-tts لأن شبكة البيئة السحابية تحظر خادم مايكروسوفت)
# يولّد كل جملة بملف مستقل، ويحوّل توقيت الحروف (alignment) إلى توقيت كلمات لتلوين الكلمة الحالية.
# المفتاح يُحقن من وكيل الشبكة؛ خارج هذه البيئة ضع ELEVENLABS_API_KEY.
import json, os, sys, base64, subprocess, urllib.request

VOICE = "onwK4e9ZLuTAKqWW03F9"  # Daniel — اختير لأنه نطق «وظيفتي» بوضوح في اختبار التفريغ
LINES = [
    "تبحث عن وظيفة؟ سجّل في وظيفتي بحساب جوجل في ثوانٍ.",
    "ارفع سيرتك، ويقرأها المساعد ويعبّئ ملفك تلقائياً.",
    "تظهر لك وظائف من شركات موثّقة، مع نسبة مطابقة لكل وظيفة.",
    "وعندما تنزل وظيفة تناسبك، يصلك إشعار فوري، وتقدّم بضغطة واحدة.",
    "وظيفتي، وظيفتك القادمة بذكاء. حمّل التطبيق من الرابط في البايو.",
]
OUT = sys.argv[1]
SPEED = float(os.environ.get("SPEED", "1.2"))
TAKES = int(os.environ.get("TAKES", "3"))
os.makedirs(OUT, exist_ok=True)

def words_from_alignment(text, al):
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    assert "".join(chars) == text, "alignment text mismatch"
    words, i = [], 0
    for w in text.split(" "):
        j = i + len(w)
        words.append({"w": w, "t": round(st[i], 3), "d": round(en[j - 1] - st[i], 3)})
        i = j + 1
    return words

def take(k, n, text):
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "language_code": "ar",
                       "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "speed": SPEED}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                                 data=body, headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    d = json.load(urllib.request.urlopen(req))
    f = f"{OUT}/takes/line{k}_{n}.mp3"
    open(f, "wb").write(base64.b64decode(d["audio_base64"]))
    json.dump({"text": text, "words": words_from_alignment(text, d["alignment"])}, open(f[:-4] + ".json", "w"), ensure_ascii=False)
    print(f)

os.makedirs(f"{OUT}/takes", exist_ok=True)
for k, text in enumerate(LINES, 1):
    for n in range(1, TAKES + 1):
        take(k, n, text)

