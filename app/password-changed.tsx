import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PasswordChangedScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email;

    return (
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark" size={60} color="#FFF" />
                    </View>

                    <Text style={styles.title}>Password Reset Complete</Text>
                    <Text style={styles.subtitle}>
                        You're all set! Your password has been successfully updated. Please log in to continue planning your next adventure.
                    </Text>

                    {/* Log In Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace({ pathname: '/login', params: { email } })}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.primaryButtonText}>Log In Now</Text>
                    </TouchableOpacity>
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
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
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
