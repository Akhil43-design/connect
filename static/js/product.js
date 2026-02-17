// Product Detail Page JavaScript

// Load product details on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
});

// Load product details
async function loadProductDetails() {
    try {
        const response = await fetch(`/api/stores/${storeId}/products/${productId}`);
        const product = await response.json();

        const productDetail = document.getElementById('product-detail');

        const imageUrl = product.image || 'https://via.placeholder.com/400x400?text=No+Image';

        productDetail.innerHTML = `
            <div class="product-detail-grid">
                <div>
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                </div>
                <div class="product-details">
                    <h1>${product.name}</h1>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    
                    <div class="product-meta">
                        ${product.size ? `<div class="meta-item">Size: ${product.size}</div>` : ''}
                        ${product.color ? `<div class="meta-item">Color: ${product.color}</div>` : ''}
                        <div class="meta-item">Stock: ${product.stock}</div>
                    </div>
                    
                    <p>${product.description || 'No description available'}</p>
                    
                    <button onclick="addToCart()" class="btn-primary btn-block">Add to Cart</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading product:', error);
        document.getElementById('product-detail').innerHTML =
            '<div class="empty-state"><h3>Product not found</h3></div>';
    }
}

// Add to cart
async function addToCart() {
    try {
        // Get product details first
        const response = await fetch(`/api/stores/${storeId}/products/${productId}`);
        const product = await response.json();

        const cartData = {
            product_id: productId,
            store_id: storeId,
            product_name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        };

        const cartResponse = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartData)
        });

        if (cartResponse.ok) {
            alert('Product added to cart!');
        } else {
            alert('Failed to add to cart');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}
