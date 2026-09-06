import fitz
import sys

path = sys.argv[1]
out_path = sys.argv[2]
x0, y0, x1, y1 = map(float, sys.argv[3:7])
zoom = float(sys.argv[7]) if len(sys.argv) > 7 else 8.0

doc = fitz.open(path)
page = doc[0]
clip = fitz.Rect(x0, y0, x1, y1)
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat, clip=clip)
pix.save(out_path)
print(out_path, pix.width, pix.height)
