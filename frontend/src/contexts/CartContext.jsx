import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef
} from 'react';
import { saveCartToCookie, getCartFromCookie, clearCartCookie } from '../utils/cookieManager';
import { fetchProducts } from '../api/products';
import { cartPriceFieldsFromProduct, stripDiscountConfig } from '../utils/productPricing';
import { useBundles } from './BundlesContext';
import {
    isBundleCartItem,
    hydrateBundleCartItem,
    slimBundleForCookie,
    selectionMapToList,
    buildBundleUniqueId,
    getCartColorId
} from '../utils/bundleCart';

/** Re-price product cart lines from the catalog; returns the same array when nothing changed. */
function repriceProductCart(cart, products) {
    const byId = new Map((products || []).map((p) => [String(p.id), p]));
    let changed = false;
    const next = cart.map((item) => {
        if (isBundleCartItem(item)) return item;
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

function rehydrateBundles(cart, bundles, bundlesLoading) {
    let changed = false;
    const next = cart.map((item) => {
        if (!isBundleCartItem(item)) return item;
        const hydrated = hydrateBundleCartItem(item, bundles, { bundlesLoading });
        if (
            hydrated.price !== item.price ||
            hydrated.regularPrice !== item.regularPrice ||
            hydrated.available !== item.available ||
            hydrated.maxQuantity !== item.maxQuantity ||
            hydrated.name_he !== item.name_he ||
            hydrated._pendingHydration !== item._pendingHydration ||
            hydrated._missing !== item._missing
        ) {
            changed = true;
        }
        return hydrated;
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
    const { bundles, loading: bundlesLoading } = useBundles();
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const cartRef = useRef(cart);
    cartRef.current = cart;
    const bundlesRef = useRef(bundles);
    bundlesRef.current = bundles;
    const bundlesLoadingRef = useRef(bundlesLoading);
    bundlesLoadingRef.current = bundlesLoading;

    // Load cart from cookies on mount (bundle rows skeleton until BundlesContext hydrates)
    useEffect(() => {
        const savedCart = getCartFromCookie();
        if (savedCart && savedCart.length > 0) {
            setCart(
                savedCart.map((item) =>
                    isBundleCartItem(item)
                        ? hydrateBundleCartItem(item, [], { bundlesLoading: true })
                        : item
                )
            );
        }
        setIsLoading(false);
    }, []);

    // Cookie prices may be stale — sync products with catalog; bundles with BundlesContext
    const refreshCartPrices = useCallback(async () => {
        const products = await fetchProducts();
        let didChange = false;
        setCart((prev) => {
            let next = prev;
            if (products.length) {
                const repriced = repriceProductCart(next, products);
                if (repriced !== next) {
                    didChange = true;
                    next = repriced;
                }
            }
            const hydrated = rehydrateBundles(
                next,
                bundlesRef.current,
                bundlesLoadingRef.current
            );
            if (hydrated !== next) {
                didChange = true;
                next = hydrated;
            }
            return next;
        });
        return didChange;
    }, []);

    useEffect(() => {
        if (!isLoading) refreshCartPrices();
    }, [isLoading, refreshCartPrices]);

    // Re-hydrate bundle lines whenever the bundles catalog finishes loading / updates
    useEffect(() => {
        if (isLoading) return;
        setCart((prev) => rehydrateBundles(prev, bundles, bundlesLoading));
    }, [bundles, bundlesLoading, isLoading]);

    // Save cart to cookies whenever it changes
    useEffect(() => {
        if (!isLoading) {
            const lightweightCart = cart.map((item) => {
                if (isBundleCartItem(item)) {
                    return slimBundleForCookie(item);
                }
                return {
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
                };
            });

            saveCartToCookie(lightweightCart);
        }
    }, [cart, isLoading]);

    const addToCart = useCallback((product, quantity = 1, selectedColor = null) => {
        setCart((prevCart) => {
            const colorId = getCartColorId(selectedColor);
            const uniqueId = colorId ? `${product.id}-${colorId}` : product.id;
            const priceFields = cartPriceFieldsFromProduct(product);

            const existingIndex = prevCart.findIndex(
                (item) =>
                    !isBundleCartItem(item) &&
                    (item.uniqueId === uniqueId ||
                        (item.id === product.id && item.selectedColor === selectedColor))
            );

            if (existingIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    ...priceFields,
                    quantity: newCart[existingIndex].quantity + quantity
                };
                return newCart;
            }

            const newItem = {
                ...stripDiscountConfig(product),
                ...priceFields,
                quantity,
                selectedColor,
                uniqueId,
                addedAt: new Date().toISOString()
            };
            return [...prevCart, newItem];
        });
    }, []);

    /**
     * Add a bundle. selection = { [productId]: colorObject | null } (BundlePage shape).
     */
    const addBundleToCart = useCallback((bundle, selectionMap = {}, quantity = 1) => {
        if (!bundle || bundle.available === false) return;

        const selectionList = selectionMapToList(bundle, selectionMap);
        const uniqueId = buildBundleUniqueId(bundle.id, selectionList);
        const qty = Math.max(1, Number(quantity) || 1);

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex(
                (item) => isBundleCartItem(item) && item.uniqueId === uniqueId
            );

            const slim = {
                type: 'bundle',
                bundleId: bundle.id,
                uniqueId,
                quantity: qty,
                selection: selectionList,
                addedAt: new Date().toISOString()
            };
            const hydrated = hydrateBundleCartItem(slim, bundlesRef.current, {
                bundlesLoading: bundlesLoadingRef.current
            });

            if (existingIndex > -1) {
                const newCart = [...prevCart];
                const prevQty = newCart[existingIndex].quantity || 0;
                newCart[existingIndex] = {
                    ...hydrated,
                    quantity: prevQty + qty,
                    addedAt: newCart[existingIndex].addedAt
                };
                return newCart;
            }

            return [...prevCart, hydrated];
        });
    }, []);

    const removeFromCart = useCallback((productIdOrUniqueId, selectedColor = null) => {
        setCart((prevCart) =>
            prevCart.filter((item) => {
                if (item.uniqueId === productIdOrUniqueId) return false;
                if (
                    !isBundleCartItem(item) &&
                    item.id === productIdOrUniqueId &&
                    item.selectedColor === selectedColor
                ) {
                    return false;
                }
                return true;
            })
        );
    }, []);

    const updateQuantity = useCallback((productIdOrUniqueId, quantity, selectedColor = null) => {
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (
                    item.uniqueId === productIdOrUniqueId ||
                    (!isBundleCartItem(item) &&
                        item.id === productIdOrUniqueId &&
                        item.selectedColor === selectedColor)
                ) {
                    return { ...item, quantity: Math.max(1, quantity) };
                }
                return item;
            })
        );
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
        clearCartCookie();
    }, []);

    const getCartTotal = useCallback(() => {
        return cart.reduce(
            (total, item) => total + Number(item.price || 0) * item.quantity,
            0
        );
    }, [cart]);

    const getCartItemCount = useCallback(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    const isInCart = useCallback((productId, selectedColor = null) => {
        return cart.some(
            (item) =>
                !isBundleCartItem(item) &&
                item.id === productId &&
                item.selectedColor === selectedColor
        );
    }, [cart]);

    const getCartItem = useCallback((productId, selectedColor = null) => {
        return cart.find(
            (item) =>
                !isBundleCartItem(item) &&
                item.id === productId &&
                item.selectedColor === selectedColor
        );
    }, [cart]);

    const value = useMemo(
        () => ({
            cart,
            isLoading,
            addToCart,
            addBundleToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartItemCount,
            isInCart,
            getCartItem,
            refreshCartPrices
        }),
        [
            cart,
            isLoading,
            addToCart,
            addBundleToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartItemCount,
            isInCart,
            getCartItem,
            refreshCartPrices
        ]
    );

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export default CartContext;
