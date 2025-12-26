import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 24,
        justifyContent: 'center',
    },

    title: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 15,
        color: '#94A3B8',
        marginBottom: 36,
    },

    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        marginBottom: 18,
    },

    button: {
        backgroundColor: '#1E7CF2',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },

    footerText: {
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 28,
    },

    link: {
        color: '#1E7CF2',
        fontWeight: '600',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },

    backText: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '600',
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },

    backIcon: {
        paddingRight: 12,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
