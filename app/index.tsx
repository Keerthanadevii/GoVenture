import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // Forcing flow to Onboarding as requested by user ("order the flow")
      // const token = await AuthService.getToken();
      // if (token) {
      //   router.replace('/(tabs)');
      // } else {
      router.replace('/onboarding');
      // }
    };

    const timer = setTimeout(checkSession, 1500); // Keep splash briefly
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/splash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
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
