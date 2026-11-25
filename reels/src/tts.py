# يولّد التعليق الصوتي جملةً جملة بـ edge-tts ويحفظ توقيت كل كلمة (WordBoundary)
import asyncio, json, sys, os, subprocess
import edge_tts
LINES = [
 "تبحث عن وظيفة؟ سجّل في وظيفتي بحساب جوجل في ثوانٍ.",
 "ارفع سيرتك، ويقرأها المساعد ويعبّئ ملفك تلقائياً.",
 "تظهر لك وظائف من شركات موثّقة، مع نسبة مطابقة لكل وظيفة.",
 "وعندما تنزل وظيفة تناسبك، يصلك إشعار فوري، وتقدّم بضغطة واحدة.",
 "وظيفتي، وظيفتك القادمة بذكاء. حمّل التطبيق من الرابط في البايو.",
]
OUT = sys.argv[1]
async def one(i, text, voice):
    c = edge_tts.Communicate(text, voice, rate="-5%", boundary="WordBoundary", proxy=os.environ.get("HTTPS_PROXY"))
    words, mp3 = [], open(f"{OUT}/line{i+1}.mp3", "wb")
    async for ch in c.stream():
        if ch["type"] == "audio": mp3.write(ch["data"])
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "t": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
    mp3.close()
    dur = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"{OUT}/line{i+1}.mp3"]).decode())
    return {"text": text, "voice": voice, "dur": dur, "words": words}
async def main():
    for voice in ["ar-YE-SalehNeural", "ar-YE-MaryamNeural"]:
        try:
            res = [await one(i, t, voice) for i, t in enumerate(LINES)]
            json.dump(res, open(f"{OUT}/timing.json", "w"), ensure_ascii=False, indent=1)
            for r in res: print(voice, round(r["dur"], 2), len(r["words"]), "words")
            return
        except Exception as e:
            print("FAILED", voice, repr(e))
    sys.exit("both voices failed")
asyncio.run(main())
