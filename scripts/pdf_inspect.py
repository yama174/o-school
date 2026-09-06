import fitz
import sys

path = sys.argv[1]
doc = fitz.open(path)
with open("D:/school-portal/pdf_inspect_out.txt", "w", encoding="utf-8") as f:
    f.write(f"pages: {doc.page_count}\n")
    for i, page in enumerate(doc):
        f.write(f"{i} rect={page.rect}\n")
