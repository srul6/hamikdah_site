import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveFormDataToCookie, getFormDataFromCookie, clearFormDataCookie, updateFormField } from '../utils/cookieManager';

const FormDataContext = createContext();

export function useFormData() {
    const context = useContext(FormDataContext);
    if (!context) {
        throw new Error('useFormData must be used within a FormDataProvider');
    }
    return context;
}

export function FormDataProvider({ children }) {
    // Initialize form data from cookies
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        street: '',
        houseNumber: '',
        apartmentNumber: '',
        floor: '',
        city: '',
        country: 'IL',
        dedication: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load form data from cookies on mount
    useEffect(() => {
        const savedFormData = getFormDataFromCookie();
        if (savedFormData && Object.keys(savedFormData).length > 0) {
            setFormData(prevData => ({ ...prevData, ...savedFormData }));
        }
        setIsLoading(false);
    }, []);

    // Save form data to cookies whenever it changes
    useEffect(() => {
        if (!isLoading) {
            // Only save non-empty form data
            const hasData = Object.values(formData).some(value => value && value !== '');
            if (hasData) {
                saveFormDataToCookie(formData);
            }
        }
    }, [formData, isLoading]);

    // Update single field
    const updateField = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    // Update multiple fields at once
    const updateFields = (fields) => {
        setFormData(prev => ({
            ...prev,
            ...fields
        }));
    };

    // Clear all form data
    const clearFormData = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            street: '',
            houseNumber: '',
            apartmentNumber: '',
            floor: '',
            city: '',
            country: 'IL',
            dedication: ''
        });
        clearFormDataCookie();
    };

    // Get specific field value
    const getField = (fieldName) => {
        return formData[fieldName] || '';
    };

    // Check if form has any saved data
    const hasData = () => {
        return Object.values(formData).some(value => value && value !== '' && value !== 'IL');
    };

    // Pre-fill form with saved data
    const prefillForm = () => {
        return { ...formData };
    };

    const value = {
        formData,
        isLoading,
        updateField,
        updateFields,
        clearFormData,
        getField,
        hasData,
        prefillForm
    };

    return (
        <FormDataContext.Provider value={value}>
            {children}
        </FormDataContext.Provider>
    );
}

export default FormDataContext;

