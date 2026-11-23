import sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def make(size, maskable=False, path=None):
    scale = 4
    S = size*scale
    img = Image.new("RGBA", (S, S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    teal = (15,118,110,255)
    if maskable:
        d.rectangle([0,0,S,S], fill=teal); inset = 0.18
    else:
        d.rounded_rectangle([0,0,S-1,S-1], radius=int(S*0.22), fill=teal); inset = 0.0
    # road curve
    w = int(S*0.045)
    pts = []
    import math
    x0, x1 = S*(0.2+inset*0.5), S*(0.8-inset*0.5)
    for i in range(41):
        t = i/40; x = x0+(x1-x0)*t
        y = S*(0.78-inset*0.18) - math.sin(t*math.pi)*S*(0.14-inset*0.05)
        pts.append((x,y))
    d.line(pts, fill=(153,246,228,255), width=w, joint="curve")
    f = ImageFont.truetype(FONT, int(S*(0.38-inset*0.36)))
    d.text((S/2, S*(0.38+inset*0.04)), "₹", font=f, fill="white", anchor="mm")
    img = img.resize((size,size), Image.LANCZOS)
    if path: img.save(path)
make(192, path=f"{out}/pwa-192x192.png")
make(512, path=f"{out}/pwa-512x512.png")
make(512, maskable=True, path=f"{out}/pwa-maskable-512x512.png")
# apple touch icon: opaque, square (iOS rounds it)
make(180, maskable=True, path=f"{out}/apple-touch-icon.png")
