import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // TODO: Check if user is logged in
      const isLoggedIn = false;
      if (isLoggedIn) {
        router.replace('/(tabs)/explore');
      } else {
        router.replace('/onboarding');
      }
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/splash.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F1E8',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
