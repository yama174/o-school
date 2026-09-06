import fitz
import sys

path = sys.argv[1]
out_prefix = sys.argv[2]
zoom = float(sys.argv[3]) if len(sys.argv) > 3 else 4.0

doc = fitz.open(path)
page = doc[0]
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat)
out_path = f"D:/school-portal/{out_prefix}_full.png"
pix.save(out_path)
print(out_path, pix.width, pix.height)
