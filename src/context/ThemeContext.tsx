import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    isDarkMode: boolean;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>(systemColorScheme || 'light');

    useEffect(() => {
        if (systemColorScheme) {
            setThemeState(systemColorScheme);
        }
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const value = {
        theme,
        isDarkMode: theme === 'dark',
        toggleTheme,
        setTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeColors = {
    light: {
        background: '#F9FAFB',
        card: '#FFFFFF',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        divider: '#F3F4F6',
        primary: '#3B82F6',
        danger: '#EF4444',
        dangerBg: '#FEF2F2',
        dangerBorder: '#FEE2E2',
        aiBanner: '#EFF6FF',
        aiBannerText: '#1E40AF',
        aiBannerBorder: '#DBEAFE',
    },
    dark: {
        background: '#111827',
        card: '#1F2937',
        text: '#F9FAFB',
        textSecondary: '#9CA3AF',
        border: '#374151',
        divider: '#374151',
        primary: '#60A5FA',
        danger: '#F87171',
        dangerBg: '#451212',
        dangerBorder: '#7F1D1D',
        aiBanner: '#1E3A8A',
        aiBannerText: '#DBEAFE',
        aiBannerBorder: '#1E40AF',
    },
};
