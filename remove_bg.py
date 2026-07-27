import sys
from PIL import Image

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    # Sample top-left corner as background reference
    bg_r, bg_g, bg_b, _ = data[0]

    newData = []
    for item in data:
        r, g, b, a = item
        
        # Calculate brightness and difference from background
        diff_r = abs(r - bg_r)
        diff_g = abs(g - bg_g)
        diff_b = abs(b - bg_b)
        color_diff = (diff_r + diff_g + diff_b) / 3.0

        # Calculate luminance (white/off-white background detection)
        luminance = 0.299 * r + 0.587 * g + 0.114 * b

        if luminance > 240 or color_diff < 15:
            # Completely transparent background
            newData.append((r, g, b, 0))
        elif luminance > 200 or color_diff < 35:
            # Smooth anti-aliased edge transition
            alpha = int(255 * (1.0 - (luminance - 200) / 40.0))
            alpha = max(0, min(255, alpha))
            newData.append((r, g, b, alpha))
        else:
            # Dark logo content (100% opaque)
            newData.append((r, g, b, 255))

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent PNG to {output_path}")

if __name__ == "__main__":
    src = r"C:\Users\arogm\.gemini\antigravity-ide\brain\4bcbd05a-54b5-472c-b972-4486a452b0fa\media__1785173886171.jpg"
    out = r"c:\Users\arogm\OneDrive\Desktop\Nexora Labs\norbyte_logo.png"
    remove_background(src, out)
