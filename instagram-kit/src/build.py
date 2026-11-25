# يصغّر لقطات 2x إلى الأبعاد النهائية ويبني صفحات المعاينة (شبكة الهايلايت + شبكة الستوريات)
import sys, os, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
os.makedirs(f"{out}/stories", exist_ok=True); os.makedirs(f"{out}/account", exist_ok=True)
def save(name, dest, size):
    im = Image.open(f"{src}/{name}.png").convert("RGB").resize(size, Image.LANCZOS); im.save(dest, optimize=True); return im
stories = [save(f"story-{n:02d}", f"{out}/stories/story-{n:02d}.png", (1080, 1920)) for n in range(1, 13)]
covers = [save(os.path.basename(f)[:-4], f"{out}/account/{os.path.basename(f)}", (1080, 1920)) for f in sorted(glob.glob(f"{src}/highlight-*.png"))]
prof = save("profile", f"{out}/account/profile.png", (1080, 1080))

# معاينة الحساب: صورة الحساب + الهايلايت كدوائر كما تظهر فعلياً (قص مركزي دائري)
W = 1300; sheet = Image.new("RGB", (W, 260), "#FFFFFF"); d = ImageDraw.Draw(sheet)
def circ(im, size):
    c = im.resize((size, size), Image.LANCZOS); m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    m = m.resize((size, size), Image.LANCZOS); o = Image.new("RGB", (size, size), "#FFFFFF"); o.paste(c, (0, 0), m); return o
sheet.paste(circ(prof, 200), (W - 240, 30))
for i, cv in enumerate(covers):
    sq = cv.crop((0, 420, 1080, 1500)); sheet.paste(circ(sq, 150), (W - 260 - 40 - 150 - i * 170, 55))
sheet.save(f"{out}/preview-account.png")

# معاينة الستوريات: 6×2
TW, TH, G = 270, 480, 10; g = Image.new("RGB", (6 * TW + 5 * G, 2 * TH + G), "#FFFFFF")
for i, s in enumerate(stories):
    r, c = divmod(i, 6); g.paste(s.resize((TW, TH), Image.LANCZOS), ((5 - c) * (TW + G), r * (TH + G)))
g.save(f"{out}/preview-stories.png"); print("ok")
