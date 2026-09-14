import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const NewsletterContext = createContext(null);

const SUBSCRIBED_SESSION_KEY = 'newsletter_subscribed_session_v1';

function readSubscribedThisSession() {
    try {
        return sessionStorage.getItem(SUBSCRIBED_SESSION_KEY) === '1';
    } catch (_) {
        return false;
    }
}

export function NewsletterProvider({ children }) {
    // null | 'subscribe' | 'unsubscribe' | 'gift'
    const [modalMode, setModalMode] = useState(null);
    const [subscribedThisSession, setSubscribedThisSession] = useState(readSubscribedThisSession);

    useEffect(() => {
        setSubscribedThisSession(readSubscribedThisSession());
    }, []);

    const markSubscribedThisSession = useCallback(() => {
        try {
            sessionStorage.setItem(SUBSCRIBED_SESSION_KEY, '1');
        } catch (_) {
            // ignore
        }
        setSubscribedThisSession(true);
    }, []);

    const openNewsletterModal = useCallback(() => setModalMode('subscribe'), []);
    const openUnsubscribeModal = useCallback(() => setModalMode('unsubscribe'), []);
    const openGiftModal = useCallback(() => setModalMode('gift'), []);
    const closeNewsletterModal = useCallback(() => setModalMode(null), []);

    const value = useMemo(
        () => ({
            isModalOpen: modalMode != null,
            modalMode,
            openNewsletterModal,
            openUnsubscribeModal,
            openGiftModal,
            closeNewsletterModal,
            subscribedThisSession,
            markSubscribedThisSession
        }),
        [
            modalMode,
            openNewsletterModal,
            openUnsubscribeModal,
            openGiftModal,
            closeNewsletterModal,
            subscribedThisSession,
            markSubscribedThisSession
        ]
    );

    return (
        <NewsletterContext.Provider value={value}>
            {children}
        </NewsletterContext.Provider>
    );
}

export function useNewsletter() {
    const ctx = useContext(NewsletterContext);
    if (!ctx) {
        throw new Error('useNewsletter must be used within NewsletterProvider');
    }
    return ctx;
}

export { SUBSCRIBED_SESSION_KEY };
