# يصغّر لقطات 2x إلى 1080×1350 ويجمع preview.png (شبكة 3×4 مثل صفحة إنستجرام)
import sys, os
from PIL import Image

src2x, out = sys.argv[1], sys.argv[2]
tiles = []
for n in range(1, 13):
    im = Image.open(os.path.join(src2x, f"post-{n:02d}.png")).convert("RGB")
    im = im.resize((1080, 1350), Image.LANCZOS)
    im.save(os.path.join(out, f"post-{n:02d}.png"), optimize=True)
    tiles.append(im)

TW, TH, GAP = 540, 675, 8
grid = Image.new("RGB", (3 * TW + 2 * GAP, 4 * TH + 3 * GAP), "#FFFFFF")
# إنستجرام يعرض الأحدث أولاً: المنشور 12 أعلى اليسار... نعرض بترتيب النشر من الأقدم (01) أسفل اليمين
order = list(range(12))[::-1]
for k, idx in enumerate(order):
    r, c = divmod(k, 3)
    grid.paste(tiles[idx].resize((TW, TH), Image.LANCZOS), (c * (TW + GAP), r * (TH + GAP)))
grid.save(os.path.join(out, "preview.png"), optimize=True)
print("ok")
