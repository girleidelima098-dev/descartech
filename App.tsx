import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, useFonts,
} from '@expo-google-fonts/inter';
import AuthScreen from './src/screens/AuthScreen';
import ClientApp from './src/screens/client/ClientApp';
import CoopApp from './src/screens/coop/CoopApp';
import PartnerDashboard from './src/screens/partner/PartnerDashboard';
import { setAuthToken } from './src/services/api';
import { clearSession, loadSession, saveSession } from './src/services/session';
import { C } from './src/theme';
import { AppUser } from './src/types';

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSession().then((s) => {
      if (s) {
        setAuthToken(s.token);
        setUser(s.user);
      }
      setReady(true);
    });
  }, []);

  async function handleLogin(u: AppUser, token?: string) {
    setAuthToken(token);
    setUser(u);
    await saveSession({ user: u, token });
  }

  async function handleLogout() {
    setAuthToken(undefined);
    setUser(null);
    await clearSession();
  }

  if (!fontsLoaded || !ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.BG }}>
        <ActivityIndicator color={C.G} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: C.BG }}>
        {!user && <AuthScreen onLogin={handleLogin} />}
        {user?.role === 'client' && <ClientApp user={user} onLogout={handleLogout} />}
        {user?.role === 'coop' && <CoopApp user={user} onLogout={handleLogout} />}
        {user?.role === 'partner' && <PartnerDashboard user={user} onLogout={handleLogout} />}
      </View>
    </SafeAreaProvider>
  );
}
