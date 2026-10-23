# Dev helper: tile a folder of screenshots into one image for quick review.
import sys, glob
from PIL import Image
files = sorted(glob.glob(sys.argv[1] + '/*.png'))
cols, w = int(sys.argv[3]) if len(sys.argv) > 3 else 3, 640
ims = [Image.open(f) for f in files]
ims = [i.resize((w, int(i.height * w / i.width))) for i in ims]
h = max(i.height for i in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 8), rows * (h + 8)), (40, 40, 40))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * (w + 8), (k // cols) * (h + 8)))
sheet.save(sys.argv[2])
