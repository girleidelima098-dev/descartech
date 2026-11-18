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
import PartnerApp from './src/screens/partner/PartnerApp';
import { setAuthToken, setSessionUser } from './src/services/api';
import { initStore } from './src/services/store';
import { clearSession, loadSession, saveSession } from './src/services/session';
import { C } from './src/theme';
import { AppUser } from './src/types';

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStore().then(loadSession).then((s) => {
      if (s) {
        setSessionUser(s.user.email);
        setAuthToken(s.token);
        setToken(s.token);
        setUser(s.user);
      }
      setReady(true);
    });
  }, []);

  async function handleLogin(u: AppUser, t?: string) {
    setSessionUser(u.email);
    setAuthToken(t);
    setToken(t);
    setUser(u);
    await saveSession({ user: u, token: t });
  }

  async function handleUserChange(u: AppUser) {
    setSessionUser(u.email);
    setUser(u);
    await saveSession({ user: u, token });
  }

  async function handleLogout() {
    setSessionUser(undefined);
    setAuthToken(undefined);
    setToken(undefined);
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
        {user?.role === 'client' && <ClientApp user={user} onLogout={handleLogout} onUserChange={handleUserChange} />}
        {user?.role === 'coop' && <CoopApp user={user} onLogout={handleLogout} />}
        {user?.role === 'partner' && <PartnerApp user={user} onLogout={handleLogout} />}
      </View>
    </SafeAreaProvider>
  );
}
