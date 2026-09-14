"""Generate the compact bundled Android map symbols (no network assets)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

target = Path(__file__).resolve().parents[1] / 'public' / 'markers'
target.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 52)
for kind, color, label in [('shop', '#facc15', 'S'), ('medical', '#ec4899', '+'), ('hospital', '#a78bfa', 'H'), ('fuel', '#22c55e', 'F')]:
    icon = Image.new('RGBA', (96, 96))
    draw = ImageDraw.Draw(icon)
    draw.ellipse((4, 4, 92, 92), fill=color, outline='white', width=8)
    draw.text((48, 48), label, font=font, anchor='mm', fill='#111111')
    icon.resize((72, 72), Image.Resampling.LANCZOS).save(target / f'{kind}.png')
