import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

// Zoomed in far enough to see a single yard.
const YARD_ZOOM = { latitudeDelta: 0.0012, longitudeDelta: 0.0012 };

export default function App() {
  const mapRef = useRef<MapView>(null);
  const [address, setAddress] = useState('');
  const [yard, setYard] = useState<Region | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function showYard(latitude: number, longitude: number) {
    const region = { latitude, longitude, ...YARD_ZOOM };
    setYard(region);
    mapRef.current?.animateToRegion(region, 800);
  }

  async function ensurePermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission is needed to find your yard.');
    }
  }

  async function findAddress() {
    if (!address.trim()) return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      // Android needs permission before geocoding works.
      await ensurePermission();
      const [match] = await Location.geocodeAsync(address);
      if (!match) throw new Error("Couldn't find that address. Try adding the city.");
      showYard(match.latitude, match.longitude);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function useMyLocation() {
    setBusy(true);
    setError(null);
    try {
      await ensurePermission();
      const { coords } = await Location.getCurrentPositionAsync({});
      showYard(coords.latitude, coords.longitude);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>I Plant</Text>
      <Text style={styles.subtitle}>Find your yard to get started</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
          onSubmitEditing={findAddress}
          returnKeyType="search"
        />
        <Pressable style={styles.button} onPress={findAddress} disabled={busy}>
          <Text style={styles.buttonText}>Find</Text>
        </Pressable>
      </View>
      <Pressable onPress={useMyLocation} disabled={busy}>
        <Text style={styles.link}>Use my current location</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.mapWrap}>
        <MapView ref={mapRef} style={styles.map} mapType="hybrid">
          {yard && <Marker coordinate={yard} title="My yard" />}
        </MapView>
        {busy && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#2e7d32" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f8f1', paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#2e7d32', marginTop: 8 },
  subtitle: { fontSize: 15, color: '#555', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfd8c8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#2e7d32', marginTop: 10, fontSize: 15 },
  error: { color: '#b3261e', marginTop: 8 },
  mapWrap: { flex: 1, marginTop: 12, marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
