import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetLinkSentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const dbgToken = params.token as string;
    const dbgEmail = params.email as string;

    return (
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={dbgToken ? "link-outline" : "mail-open-outline"} size={60} color="#3B82F6" />
                    </View>

                    <Text style={styles.title}>{dbgToken ? 'Reset Link Ready' : 'Reset Link Sent'}</Text>
                    <Text style={styles.subtitle}>
                        {dbgToken
                            ? "Your reset link is ready. Click the button below to set your new password."
                            : "We've sent a password reset link to your email. Please check your inbox (and spam folder) to proceed."}
                    </Text>

                    {/* Primary Action Button */}
                    {dbgToken ? (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push({ pathname: '/set-new-password', params: { email: dbgEmail, token: dbgToken } })}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.primaryButtonText}>Click Reset Link</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.replace('/login')}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.primaryButtonText}>Back to Log In</Text>
                        </TouchableOpacity>
                    )}

                    {/* Fallback/Dev (only show if NO token, allowing skip) */}
                    {!dbgToken && (
                        <TouchableOpacity onPress={() => router.push('/set-new-password')} style={{ marginTop: 20 }}>
                            <Text style={{ color: '#4B5563', fontSize: 12 }}>
                                (Dev: Skip to Set Password)
                            </Text>
                        </TouchableOpacity>
                    )}

                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, justifyContent: 'center' },
    content: { padding: 24, width: '100%', alignItems: 'center' },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 40,
        textAlign: 'center',
        lineHeight: 24,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
