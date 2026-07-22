import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    bootstrapConsent,
    getConsent,
    acceptAll as managerAcceptAll,
    rejectAll as managerRejectAll,
    savePreferences as managerSavePreferences,
    subscribe,
    hasConsent as managerHasConsent
} from './consentManager';

const ConsentContext = createContext(null);

export function ConsentProvider({ children }) {
    const [consent, setConsent] = useState(() => getConsent());
    const [preferencesOpen, setPreferencesOpen] = useState(false);

    useEffect(() => {
        bootstrapConsent();
        setConsent(getConsent());
        return subscribe((next) => setConsent(next));
    }, []);

    const openPreferences = useCallback(() => setPreferencesOpen(true), []);
    const closePreferences = useCallback(() => setPreferencesOpen(false), []);

    const acceptAll = useCallback(() => {
        const next = managerAcceptAll();
        setConsent(next);
        setPreferencesOpen(false);
        return next;
    }, []);

    const rejectAll = useCallback(() => {
        const next = managerRejectAll();
        setConsent(next);
        setPreferencesOpen(false);
        return next;
    }, []);

    const savePreferences = useCallback((prefs) => {
        const next = managerSavePreferences(prefs);
        setConsent(next);
        setPreferencesOpen(false);
        return next;
    }, []);

    const hasConsent = useCallback((category) => managerHasConsent(category), []);

    const value = useMemo(() => ({
        consent,
        hasResponded: Boolean(consent?.decided),
        preferencesOpen,
        openPreferences,
        closePreferences,
        acceptAll,
        rejectAll,
        savePreferences,
        hasConsent
    }), [
        consent,
        preferencesOpen,
        openPreferences,
        closePreferences,
        acceptAll,
        rejectAll,
        savePreferences,
        hasConsent
    ]);

    return (
        <ConsentContext.Provider value={value}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent() {
    const ctx = useContext(ConsentContext);
    if (!ctx) {
        throw new Error('useConsent must be used within ConsentProvider');
    }
    return ctx;
}
