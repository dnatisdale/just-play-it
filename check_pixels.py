from PIL import Image

img = Image.open(r"c:\GitHub\just-play-it\icons\play-btn.png").convert("RGBA")
w, h = img.size
pixels = img.load()
print(f"Size: {w}x{h}")
top_left = pixels[0, 0]
top_right = pixels[w-1, 0]
bottom_left = pixels[0, h-1]
bottom_right = pixels[w-1, h-1]
center_top = pixels[w//2, 10]
center_left = pixels[10, h//2]

print(f"Top Left: {top_left}")
print(f"Top Right: {top_right}")
print(f"Bottom Left: {bottom_left}")
print(f"Bottom Right: {bottom_right}")
print(f"Center Top (edge): {center_top}")
print(f"Center Left (edge): {center_left}")
