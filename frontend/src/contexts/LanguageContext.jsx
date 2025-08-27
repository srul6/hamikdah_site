import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // Get language from localStorage or default to Hebrew
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('language');
        return savedLanguage || 'HE';
    });

    const toggleLanguage = () => {
        setLanguage(prev => {
            const newLanguage = prev === 'HE' ? 'EN' : 'HE';
            // Save to localStorage
            localStorage.setItem('language', newLanguage);
            return newLanguage;
        });
    };

    const value = {
        language,
        toggleLanguage,
        isHebrew: language === 'HE',
        isEnglish: language === 'EN'
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
