# -*- coding: utf-8 -*-
"""
新しい「O」ロゴアイコン(O.png)から、サイトで使う各サイズのアイコン一式を生成する。

実行方法: python scripts/process_o_icon.py
"""
import os
from PIL import Image

SRC = r"D:\Program Files\aaaaaaaaaaaaaaaaaaaaa\低予算AIR\O.png"
PUBLIC_DIR = r"D:\school-portal\public"
APP_DIR = r"D:\school-portal\src\app"

im = Image.open(SRC).convert("RGBA")
bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)

# 正方形にする(短辺基準で余白を追加し、中央に配置)
w, h = im.size
side = max(w, h)
square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
square.paste(im, ((side - w) // 2, (side - h) // 2), im)
im = square


def save(size: int, path: str):
    resized = im.resize((size, size), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    resized.save(path)
    print(f"✅ {path} ({size}x{size})")


# ロゴコンポーネント用のマスター画像(白背景合成なし・透過のまま)
save(512, os.path.join(PUBLIC_DIR, "logo", "o-icon.png"))

# ブラウザタブ favicon 用
save(32, os.path.join(APP_DIR, "icon.png"))
# iOSホーム画面用(白背景に乗せた方が見栄えが良いので合成する)
ios_bg = Image.new("RGBA", (side, side), (255, 255, 255, 255))
ios_bg.paste(im, (0, 0), im)
ios_resized = ios_bg.resize((180, 180), Image.LANCZOS).convert("RGB")
ios_path = os.path.join(APP_DIR, "apple-icon.png")
ios_resized.save(ios_path)
print(f"✅ {ios_path} (180x180, white bg)")

# PWAマニフェスト用
save(192, os.path.join(PUBLIC_DIR, "icons", "icon-192.png"))
save(512, os.path.join(PUBLIC_DIR, "icons", "icon-512.png"))

# favicon.ico(複数サイズ格納)
ico_path = os.path.join(APP_DIR, "favicon.ico")
im.save(ico_path, sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print(f"✅ {ico_path} (multi-size ico)")

print("完了")
