// frontend/src/components/Cart.jsx
import React from 'react';

export default function Cart({ cart, onRemove, onChangeQty }) {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <div className="cart">
            <h2>Your Cart</h2>
            {cart.length === 0 ? <p>Cart is empty.</p> : (
                <ul>
                    {cart.map(item => (
                        <li key={item._id}>
                            <span>{item.name}</span>
                            <span>${item.price.toFixed(2)}</span>
                            <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={e => onChangeQty(item._id, Number(e.target.value))}
                            />
                            <button onClick={() => onRemove(item._id)}>Remove</button>
                        </li>
                    ))}
                </ul>
            )}
            <h3>Total: ${total.toFixed(2)}</h3>
        </div>
    );
}