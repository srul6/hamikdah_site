import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchBundles } from '../api/bundles';

const BundlesContext = createContext(null);

export function useBundles() {
    const ctx = useContext(BundlesContext);
    if (!ctx) {
        throw new Error('useBundles must be used within BundlesProvider');
    }
    return ctx;
}

export function BundlesProvider({ children }) {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshBundles = useCallback(async () => {
        setLoading(true);
        const list = await fetchBundles();
        setBundles(Array.isArray(list) ? list : []);
        setLoading(false);
        return Array.isArray(list) ? list : [];
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const list = await fetchBundles();
            if (!cancelled) {
                setBundles(Array.isArray(list) ? list : []);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo(
        () => ({
            bundles,
            loading,
            hasBundles: bundles.length > 0,
            refreshBundles
        }),
        [bundles, loading, refreshBundles]
    );

    return (
        <BundlesContext.Provider value={value}>
            {children}
        </BundlesContext.Provider>
    );
}
