import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { saveCartToCookie, getCartFromCookie, clearCartCookie } from '../utils/cookieManager';
import { fetchProducts } from '../api/products';
import { cartPriceFieldsFromProduct, stripDiscountConfig } from '../utils/productPricing';

/** Re-price cart lines from the catalog; returns the same array when nothing changed. */
function repriceCart(cart, products) {
    const byId = new Map((products || []).map((p) => [String(p.id), p]));
    let changed = false;
    const next = cart.map((item) => {
        const product = byId.get(String(item.id));
        if (!product) return item;
        const fields = cartPriceFieldsFromProduct(product);
        if (Number(item.price) === fields.price && Number(item.regularPrice) === fields.regularPrice) {
            return item;
        }
        changed = true;
        return { ...stripDiscountConfig(item), ...fields };
    });
    return changed ? next : cart;
}

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
    const cartRef = useRef(cart);
    cartRef.current = cart;

    // Load cart from cookies on mount
    useEffect(() => {
        const savedCart = getCartFromCookie();
        if (savedCart && savedCart.length > 0) {
            setCart(savedCart);
        }
        setIsLoading(false);
    }, []);

    // Cookie prices may be stale (price or discount changed since adding) — sync with the catalog
    const refreshCartPrices = useCallback(async () => {
        const products = await fetchProducts();
        if (!products.length) return false;
        const changed = repriceCart(cartRef.current, products) !== cartRef.current;
        setCart((prev) => repriceCart(prev, products));
        return changed;
    }, []);

    useEffect(() => {
        if (!isLoading) refreshCartPrices();
    }, [isLoading, refreshCartPrices]);

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
                regularPrice: item.regularPrice,
                name_he: item.name_he,
                name_en: item.name_en,
                homepageimage: item.homepageimage,
                addedAt: item.addedAt
            }));

            saveCartToCookie(lightweightCart);
        }
    }, [cart, isLoading]);

    // Add item to cart
    const addToCart = useCallback((product, quantity = 1, selectedColor = null) => {
        setCart(prevCart => {
            // Create uniqueId (compatible with existing code)
            const colorId = selectedColor ? selectedColor.name || selectedColor.name_en : null;
            const uniqueId = colorId ? `${product.id}-${colorId}` : product.id;
            const priceFields = cartPriceFieldsFromProduct(product);

            // Check if item already exists in cart
            const existingIndex = prevCart.findIndex(item =>
                item.uniqueId === uniqueId || (item.id === product.id && item.selectedColor === selectedColor)
            );

            if (existingIndex > -1) {
                // Update quantity of existing item
                const newCart = [...prevCart];
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    ...priceFields,
                    quantity: newCart[existingIndex].quantity + quantity
                };
                return newCart;
            } else {
                // Add new item with all necessary fields
                const newItem = {
                    ...stripDiscountConfig(product),
                    ...priceFields,
                    quantity: quantity,
                    selectedColor: selectedColor,
                    uniqueId: uniqueId,
                    addedAt: new Date().toISOString()
                };
                return [...prevCart, newItem];
            }
        });
    }, []);

    // Remove item from cart (supports both uniqueId and productId + color)
    const removeFromCart = useCallback((productIdOrUniqueId, selectedColor = null) => {
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
    }, []);

    // Update item quantity (supports both uniqueId and productId + color)
    const updateQuantity = useCallback((productIdOrUniqueId, quantity, selectedColor = null) => {
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
    }, []);

    // Clear entire cart — stable identity so consumers can safely put it in effect deps
    const clearCart = useCallback(() => {
        setCart([]);
        clearCartCookie();
    }, []);

    // Get cart total
    const getCartTotal = useCallback(() => {
        return cart.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
    }, [cart]);

    // Get cart item count
    const getCartItemCount = useCallback(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    // Check if product is in cart
    const isInCart = useCallback((productId, selectedColor = null) => {
        return cart.some(item => item.id === productId && item.selectedColor === selectedColor);
    }, [cart]);

    // Get specific cart item
    const getCartItem = useCallback((productId, selectedColor = null) => {
        return cart.find(item => item.id === productId && item.selectedColor === selectedColor);
    }, [cart]);

    const value = useMemo(() => ({
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        isInCart,
        getCartItem,
        refreshCartPrices
    }), [
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        isInCart,
        getCartItem,
        refreshCartPrices
    ]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export default CartContext;
