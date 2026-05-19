import os

game_product_path = 'src/routes/Games/GameProduct.jsx'
with open(game_product_path, 'r') as f:
    content = f.read()

content = content.replace("#008ad8", "#FF0000")
content = content.replace("rgba(0,138,216,0.15)", "rgba(255,0,0,0.15)")
content = content.replace("className='wrapper product'", "className='wrapper product home-app-page'")

with open(game_product_path, 'w') as f:
    f.write(content)

index_css_path = 'src/static/css/index.css'
new_css = """

/* Game App Page Styles */
.home-app-page.product {
  min-height: 100vh;
}

.home-app-page .details-heading,
.home-app-page .game-heading {
  color: #fff;
}

.home-app-page .input-label {
  color: rgba(255, 255, 255, 0.8);
}

.home-app-page .input-box {
  background: #242730;
  border-color: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.home-app-page .input-box:focus {
  background: #1f222a;
  border-color: rgba(255, 0, 0, 0.52);
  color: #fff;
  box-shadow: 0 0 0 3px rgba(255, 0, 0, 0.1);
}

.home-app-page .input-box::placeholder {
  color: rgba(255, 255, 255, 0.58) !important;
}

.home-app-page .check-name span {
  color: #fff;
}

.home-app-page .card-label .cl-content {
  background: #242730;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.home-app-page .card-label:hover .cl-content {
  transform: translateY(-3px);
  background: rgba(255, 0, 0, 0.18);
  border-color: rgba(255, 0, 0, 0.46);
  box-shadow: 0 18px 36px rgba(255, 0, 0, 0.14);
}

.home-app-page .card-label input:checked ~ .cl-content {
  background: rgba(255, 0, 0, 0.18);
  box-shadow: inset 0 0 0 2px rgba(255, 0, 0, 0.6);
  border-color: transparent;
}

.home-app-page .card-label input:checked ~ .cl-content::after {
  background-color: #FF0000;
}

.home-app-page .cl-title h4,
.home-app-page .cl-price {
  color: #fff;
}

.home-app-page .cl-title span {
  color: rgba(255, 255, 255, 0.6);
}

.home-app-page .game-content span {
  color: rgba(255, 255, 255, 0.6);
}

.home-app-page .gp-sheet-modal .modal-content {
  background: #20232b;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.08);
}

.home-app-page .gp-sheet-head h5,
.home-app-page .gp-sheet-product-card h6,
.home-app-page .gp-sheet-price-row strong,
.home-app-page .gp-sheet-player-row strong,
.home-app-page .gp-sheet-player-title,
.home-app-page .gp-sheet-method h6,
.home-app-page .gp-sheet-method-right strong {
  color: #fff;
}

.home-app-page .gp-sheet-product-card,
.home-app-page .gp-sheet-player-card,
.home-app-page .gp-sheet-method {
  background: #242730;
  border-color: rgba(255, 255, 255, 0.08);
}

.home-app-page .gp-sheet-method.is-active {
  border-color: #FF0000;
  background: rgba(255, 0, 0, 0.1);
}

.home-app-page .gp-sheet-method-left p,
.home-app-page .gp-sheet-method-right small,
.home-app-page .gp-sheet-product-label {
  color: rgba(255, 255, 255, 0.6);
}

.home-app-page .placeholder {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.home-app-page .gp-sheet-close {
  color: rgba(255, 255, 255, 0.7);
}

.home-app-page .gp-sheet-close:hover {
  color: #fff;
}

.home-app-page .modal-content {
  background: #20232b;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.08);
}

.home-app-page .modal-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.home-app-page .modal-footer {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.home-app-page .btn-close {
  filter: invert(1) grayscale(100%) brightness(200%);
}
"""
with open(index_css_path, 'a') as f:
    f.write(new_css)
