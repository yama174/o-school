# -*- coding: utf-8 -*-
"""
「O」マスコットキャラのPNG(白背景・透過なし)を、透過PNGに変換してpublic/mascotへ出力する。

背景除去は「四隅からのフラッドフィル」方式(単純な白色しきい値だと、キャラ自身の
白い毛(お腹・耳の内側等)まで透明になってしまうため、外周から連結した白領域だけを
背景として除去する)。処理後、余白をトリムしてファイルサイズ・扱いやすさを改善する。

実行方法: python scripts/process_mascot.py
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

SRC_DIR = r"D:\Program Files\aaaaaaaaaaaaaaaaaaaaa\低予算AIR\O"
OUT_DIR = r"D:\school-portal\public\mascot"

# 日本語ファイル名 -> 英語スラッグ(コードから参照しやすくするため)
NAME_MAP = {
    "通常立ち": "stand-normal",
    "正面立ち": "stand-front",
    "横向き立ち": "stand-side",
    "座ってにっこり": "sit-smile",
    "発見立ち": "stand-discover",
    "街を眺める": "look-at-town",
    "走り立ち": "run",
    "ぺたんこ": "petan",
    "にっこり (2)": "face-smile",
    "もっとにっこり": "face-smile-more",
    "満面の笑み (2)": "face-grin",
    "びっくり": "face-surprised",
    "ウインク": "face-wink",
    "ジト目": "face-side-eye",
    "慌て顔": "face-flustered",
    "横顔": "face-side",
}

os.makedirs(OUT_DIR, exist_ok=True)


def remove_white_background(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size

    # floodfillは元画像に直接「目印色」を塗るので、専用のワーク画像に対して行う
    work = im.convert("RGB")
    seed_color = (1, 2, 3)  # 元画像に存在しないユニークな色を目印にする
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if work.getpixel(seed) == (255, 255, 255):
            ImageDraw.floodfill(work, seed, seed_color, thresh=8)

    work_arr = np.array(work)  # (h, w, 3)
    out_arr = np.array(im)  # (h, w, 4)
    is_bg = np.all(work_arr == np.array(seed_color), axis=-1)
    out_arr[is_bg, 3] = 0
    return Image.fromarray(out_arr, mode="RGBA")


def trim(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()  # RGBAのalpha!=0領域を検出
    if bbox:
        # 少し余白を残す
        pad = 8
        l, t, r, b = bbox
        l = max(0, l - pad)
        t = max(0, t - pad)
        r = min(im.width, r + pad)
        b = min(im.height, b + pad)
        return im.crop((l, t, r, b))
    return im


# 表示サイズは最大でも100〜110px程度(2倍密度端末を考えても300px程度で十分)なので、
# それより大きい元画像はダウンスケールしてファイルサイズを抑える。
MAX_DIMENSION = 320


def main():
    count = 0
    for fname in os.listdir(SRC_DIR):
        if not fname.lower().endswith(".png"):
            continue
        stem = fname[:-4]
        slug = NAME_MAP.get(stem)
        if not slug:
            print(f"⚠️  未マッピング(スキップ): {fname}")
            continue
        im = Image.open(os.path.join(SRC_DIR, fname))
        im = remove_white_background(im)
        im = trim(im)

        if max(im.width, im.height) > MAX_DIMENSION:
            scale = MAX_DIMENSION / max(im.width, im.height)
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)

        out_path = os.path.join(OUT_DIR, f"{slug}.webp")
        im.save(out_path, "WEBP", quality=90, method=6)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"✅ {fname} -> mascot/{slug}.webp ({im.width}x{im.height}, {size_kb:.0f}KB)")
        count += 1
    print(f"完了: {count}件")


if __name__ == "__main__":
    main()
