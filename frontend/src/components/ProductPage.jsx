// frontend/src/components/ProductPage.jsx
import React from 'react';

export default function ProductPage({ product, onAddToCart }) {
    if (!product) return <div>Loading...</div>;

    return (
        <div className="product-detail">
            <img src={`http://localhost:5000/images/${product.mainImage}`} alt={product.name} />
            <h2>{product.name}</h2>
            <p>${product.price.toFixed(2)}</p>
            <p>{product.description}</p>
            {product.extraImages && product.extraImages.length > 0 && (
                <div className="extra-images">
                    {product.extraImages.map((img, idx) => (
                        <img key={idx} src={`http://localhost:5000/images/${img}`} alt={`${product.name} extra ${idx + 1}`} />
                    ))}
                </div>
            )}
            <button onClick={() => onAddToCart(product)}>Add to Cart</button>
        </div>
    );
}