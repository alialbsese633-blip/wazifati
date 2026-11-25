# ريلز وظيفتي

## reel-01-signup.mp4
1080×1920، 30fps، ‏27.97 ثانية، H.264 (CRF 18، yuv420p) + AAC ‏192k ستيريو، الصوت مطبّع إلى ‎-16 LUFS. بدون موسيقى.

### إعادة البناء
```bash
SPEED=1.2 TAKES=3 python3 src/tts_eleven.py src/audio     # 3 نسخ لكل جملة من ElevenLabs (صوت Daniel) مع توقيت الحروف
HF_HUB_DISABLE_XET=1 python3 src/pick_takes.py src/audio   # يختار الأدق نطقاً بتفريغ Whisper المحلي، ثم الأقصر
python3 src/build_audio.py src/audio                        # قص + atempo 1.07 + فواصل 0.5ث + loudnorm + fade، ويكتب timeline.json
node src/capture.js src/audio/timeline.json src/audio/final/voice.wav reel-01-signup.mp4
```
- `src/reel.html`: المشهد كاملاً، و`render(t)` ترسم أي لحظة بشكل حتمي، وكل حركة مربوطة بوقت كلمة من `timeline.json`.
- `src/tts.py`: نسخة edge-tts بصوت ar-YE-SalehNeural. لم تُستخدم لأن شبكة البيئة السحابية تحظر خادم مايكروسوفت، ويمكن تشغيلها على جهاز عادي ثم تمرير ناتجها لـ build_audio.py.
