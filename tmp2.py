import os

game_product_path = 'src/routes/Games/GameProduct.jsx'
with open(game_product_path, 'r') as f:
    content = f.read()

content = content.replace("rgba(0, 138, 216", "rgba(255, 0, 0")

with open(game_product_path, 'w') as f:
    f.write(content)

print("Replaced rgba(0, 138, 216 with rgba(255, 0, 0 in GameProduct.jsx")
