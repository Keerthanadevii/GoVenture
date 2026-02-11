import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AuthService from '../services/AuthService';

interface User {
    id: number;
    name: string;
    email: string;
    budget?: number;
    currency_code?: string;
    pace?: string;
    interests?: string[];
    trips_generated?: number;
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    updateUserCurrency: (code: string) => Promise<void>;
    updateUserPreference: (key: string, value: any) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const userData = await AuthService.getUser();
            setUser(userData);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const updateUserCurrency = async (code: string) => {
        if (!user) return;
        try {
            const updatedUser = await AuthService.updateProfile({ currency_code: code });
            setUser(updatedUser);
        } catch (error) {
            console.error('Failed to update user currency:', error);
            throw error;
        }
    };

    const updateUserPreference = async (key: string, value: any) => {
        if (!user) return;
        try {
            const updatedUser = await AuthService.updateProfile({ [key]: value });
            setUser(updatedUser);
        } catch (error) {
            console.error(`Failed to update user preference ${key}:`, error);
            throw error;
        }
    };

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser, updateUserCurrency, updateUserPreference }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
