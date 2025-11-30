import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveCartToCookie, getCartFromCookie, clearCartCookie } from '../utils/cookieManager';

const CartContext = createContext();

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export function CartProvider({ children }) {
    // Initialize cart from cookies on mount
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load cart from cookies on mount
    useEffect(() => {
        const savedCart = getCartFromCookie();
        if (savedCart && savedCart.length > 0) {
            setCart(savedCart);
        }
        setIsLoading(false);
    }, []);

    // Save cart to cookies whenever it changes
    useEffect(() => {
        if (!isLoading) {
            // Save only essential data to cookie (to avoid 4KB limit)
            const lightweightCart = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                uniqueId: item.uniqueId,
                price: item.price,
                name_he: item.name_he,
                name_en: item.name_en,
                displayName: item.displayName,
                homepageimage: item.homepageimage,
                addedAt: item.addedAt
            }));

            saveCartToCookie(lightweightCart);
        }
    }, [cart, isLoading]);

    // Add item to cart
    const addToCart = (product, quantity = 1, selectedColor = null) => {
        setCart(prevCart => {
            // Create uniqueId (compatible with existing code)
            const colorId = selectedColor ? selectedColor.name || selectedColor.name_en : null;
            const uniqueId = colorId ? `${product.id}-${colorId}` : product.id;

            // Check if item already exists in cart
            const existingIndex = prevCart.findIndex(item =>
                item.uniqueId === uniqueId || (item.id === product.id && item.selectedColor === selectedColor)
            );

            if (existingIndex > -1) {
                // Update quantity of existing item
                const newCart = [...prevCart];
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    quantity: newCart[existingIndex].quantity + quantity
                };
                return newCart;
            } else {
                // Add new item with all necessary fields
                const newItem = {
                    ...product, // Include all product fields
                    quantity: quantity,
                    selectedColor: selectedColor,
                    uniqueId: uniqueId,
                    displayName: selectedColor ?
                        `${product.name_he || product.name_en} - ${selectedColor.name_he || selectedColor.name}` :
                        (product.name_he || product.name_en),
                    addedAt: new Date().toISOString()
                };
                return [...prevCart, newItem];
            }
        });
    };

    // Remove item from cart (supports both uniqueId and productId + color)
    const removeFromCart = (productIdOrUniqueId, selectedColor = null) => {
        setCart(prevCart => {
            // Try to match by uniqueId first, then by id + color
            const newCart = prevCart.filter(item => {
                if (item.uniqueId === productIdOrUniqueId) {
                    return false; // Remove this item
                }
                if (item.id === productIdOrUniqueId && item.selectedColor === selectedColor) {
                    return false; // Remove this item
                }
                return true; // Keep this item
            });
            return newCart;
        });
    };

    // Update item quantity (supports both uniqueId and productId + color)
    const updateQuantity = (productIdOrUniqueId, quantity, selectedColor = null) => {
        setCart(prevCart => {
            const newCart = prevCart.map(item => {
                // Match by uniqueId or id + color
                if (item.uniqueId === productIdOrUniqueId ||
                    (item.id === productIdOrUniqueId && item.selectedColor === selectedColor)) {
                    return { ...item, quantity: Math.max(1, quantity) };
                }
                return item;
            });
            return newCart;
        });
    };

    // Clear entire cart
    const clearCart = () => {
        setCart([]);
        clearCartCookie();
    };

    // Get cart total
    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
    };

    // Get cart item count
    const getCartItemCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    // Check if product is in cart
    const isInCart = (productId, selectedColor = null) => {
        return cart.some(item => item.id === productId && item.selectedColor === selectedColor);
    };

    // Get specific cart item
    const getCartItem = (productId, selectedColor = null) => {
        return cart.find(item => item.id === productId && item.selectedColor === selectedColor);
    };

    const value = {
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        isInCart,
        getCartItem
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export default CartContext;

