import AuthService from '@/src/services/AuthService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetNewPasswordScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // In a real app, these come from the deep link.
    // For testing, we might need to enter them manually or assume they are passed.
    const [email, setEmail] = useState((params.email as string) || '');
    const [token, setToken] = useState((params.token as string) || '');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please enter your new password.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        if (!email || !token) {
            // Fallback for testing/manual flow
            Alert.alert('Error', 'Missing reset token or email. Please ensure you used the link from your email.');
            // For dev convenience, maybe allow manual entry? I'll add inputs below if missing.
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.resetPassword({
                email,
                token,
                password,
                password_confirmation: confirmPassword
            });
            router.replace({ pathname: '/password-changed', params: { email } });
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to reset password. Link might be expired.';
            Alert.alert('Error', msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backButton}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.content}>
                            <Text style={styles.title}>Set New Password</Text>
                            <Text style={styles.subtitle}>
                                Your new password must be different from previously used passwords.
                            </Text>

                            {/* Dev/Fallback inputs for Email/Token if missing (hidden in production usually) */}
                            {(!params.email || !params.token) && (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ color: 'yellow', marginBottom: 5 }}>Dev: Enter Token Details Manually</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: '#555', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }]}
                                        placeholder="Email"
                                        placeholderTextColor="#666"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                    <TextInput
                                        style={[styles.input, { borderColor: '#555', borderWidth: 1, borderRadius: 8, padding: 10 }]}
                                        placeholder="Token"
                                        placeholderTextColor="#666"
                                        value={token}
                                        onChangeText={setToken}
                                    />
                                </View>
                            )}

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="New Password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleReset}
                                disabled={isLoading}
                                activeOpacity={0.9}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Reset Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 10 },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    content: { padding: 24, width: '100%' },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: 56,
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
