import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
  Share,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useGroupSession } from '@/lib/group-session-context';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Input from '@/components/Input';
import Button from '@/components/Button';
import CountdownTimer from '@/components/CountdownTimer';
import LoadingScreen from '@/components/LoadingScreen';
import {
  Colors,
  FontSizes,
  Spacing,
  MIN_GROUP_SIZE,
  MAX_GROUP_SIZE,
  BIO_MAX_LENGTH,
} from '@/lib/constants';

/** Show alert cross-platform (Alert.alert is native-only) */
function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// ── Create Group Form ──────────────────────────────────────────────────
function CreateGroupForm({ onCreate }: { onCreate: () => void }) {
  const { user } = useAuth();
  const { location, requestLocation } = useLocation();
  const { createSession } = useGroupSession();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [venueName, setVenueName] = useState('');
  const [memberCount, setMemberCount] = useState(2);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(30);
  const [ageMinText, setAgeMinText] = useState('18');
  const [ageMaxText, setAgeMaxText] = useState('30');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoUri || !user) return null;

    const ext = photoUri.split('.').pop() ?? 'jpg';
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const response = await fetch(photoUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('group-photos')
      .upload(fileName, blob, { contentType: `image/${ext}` });

    if (error) {
      console.warn('Photo upload error:', error.message);
      return null;
    }

    const { data } = supabase.storage
      .from('group-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleCreate = async () => {
    setError('');

    if (!name.trim()) {
      setError('Ge ditt gäng ett namn!');
      return;
    }
    if (!venueName.trim()) {
      setError('Ange vilken bar ni är på.');
      return;
    }

    setLoading(true);

    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await uploadPhoto();
      }

      // Try to get location (optional — don't block on failure)
      let loc = location;
      if (!loc) {
        try {
          loc = await requestLocation();
        } catch {
          // Location not available on web — continue without it
          console.log('Location not available, continuing without it');
        }
      }

      const result = await createSession({
        name: name.trim(),
        bio: bio.trim(),
        photo_url: photoUrl,
        venue_name: venueName.trim(),
        venue_lat: loc?.latitude ?? null,
        venue_lng: loc?.longitude ?? null,
        member_count: memberCount,
        age_min: ageMin,
        age_max: ageMax,
      });

      setLoading(false);

      if (result.error) {
        setError(result.error);
      } else {
        onCreate();
      }
    } catch (e: any) {
      setLoading(false);
      setError(e.message ?? 'Något gick fel. Försök igen.');
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Skapa gäng</Text>
      <Text style={styles.subheading}>
        Sätt ihop kvällens gäng och börja matcha!
      </Text>

      {/* Photo picker */}
      <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={36} color={Colors.textMuted} />
            <Text style={styles.photoText}>Lägg till gruppfoto</Text>
          </View>
        )}
      </TouchableOpacity>

      <Input
        label="Gruppnamn"
        placeholder='T.ex. "Johan & gänget"'
        value={name}
        onChangeText={setName}
      />

      <Input
        label={`Bio (${bio.length}/${BIO_MAX_LENGTH})`}
        placeholder="Kort beskrivning av ert gäng…"
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, BIO_MAX_LENGTH))}
        multiline
        maxLength={BIO_MAX_LENGTH}
      />

      <Input
        label="Bar / Ställe"
        placeholder="T.ex. Trädgården"
        value={venueName}
        onChangeText={setVenueName}
      />

      {/* Member count stepper */}
      <Text style={styles.label}>Antal i gänget</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => setMemberCount(Math.max(MIN_GROUP_SIZE, memberCount - 1))}
          style={styles.stepBtn}
        >
          <Ionicons name="remove" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{memberCount}</Text>
        <TouchableOpacity
          onPress={() => setMemberCount(Math.min(MAX_GROUP_SIZE, memberCount + 1))}
          style={styles.stepBtn}
        >
          <Ionicons name="add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Age range */}
      <Text style={styles.label}>Åldersintervall</Text>
      <View style={styles.ageRow}>
        <Input
          label="Min"
          placeholder="18"
          value={ageMinText}
          onChangeText={(t) => setAgeMinText(t.replace(/[^0-9]/g, '').slice(0, 2))}
          onBlur={() => {
            const n = parseInt(ageMinText, 10);
            if (isNaN(n) || n < 18) {
              setAgeMin(18);
              setAgeMinText('18');
            } else if (n >= ageMax) {
              const clamped = ageMax - 1;
              setAgeMin(clamped);
              setAgeMinText(String(clamped));
            } else {
              setAgeMin(n);
              setAgeMinText(String(n));
            }
          }}
          keyboardType="number-pad"
          containerStyle={styles.ageInput}
        />
        <Text style={styles.ageDash}>–</Text>
        <Input
          label="Max"
          placeholder="99"
          value={ageMaxText}
          onChangeText={(t) => setAgeMaxText(t.replace(/[^0-9]/g, '').slice(0, 2))}
          onBlur={() => {
            const n = parseInt(ageMaxText, 10);
            if (isNaN(n) || n > 99) {
              setAgeMax(99);
              setAgeMaxText('99');
            } else if (n <= ageMin) {
              const clamped = ageMin + 1;
              setAgeMax(clamped);
              setAgeMaxText(String(clamped));
            } else {
              setAgeMax(n);
              setAgeMaxText(String(n));
            }
          }}
          keyboardType="number-pad"
          containerStyle={styles.ageInput}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Button
        title="Go Live 🎉"
        onPress={handleCreate}
        loading={loading}
        size="lg"
        style={{ marginTop: Spacing.md, marginBottom: Spacing.xxl }}
      />
    </ScrollView>
  );
}

// ── Active Session View ────────────────────────────────────────────────
function ActiveSessionView({ onEnd }: { onEnd: () => void }) {
  const { session, endSession } = useGroupSession();

  if (!session) return null;

  const handleEnd = async () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Vill du verkligen avsluta kvällens session?');
      if (!ok) return;
    } else {
      // On native, use Alert with callbacks
      return new Promise<void>((resolve) => {
        Alert.alert('Avsluta session', 'Vill du verkligen avsluta kvällens session?', [
          { text: 'Avbryt', style: 'cancel', onPress: () => resolve() },
          {
            text: 'Avsluta',
            style: 'destructive',
            onPress: async () => {
              await endSession();
              onEnd();
              resolve();
            },
          },
        ]);
      });
    }
    await endSession();
    onEnd();
  };

  const handleShare = async () => {
    await Share.share({
      message: `Gå med i mitt gäng "${session.name}" på BarMatch! Session-ID: ${session.id}`,
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.heading}>Kvällens gäng</Text>

      {/* Session card */}
      <View style={styles.sessionCard}>
        {session.photo_url ? (
          <Image source={{ uri: session.photo_url }} style={styles.sessionPhoto} />
        ) : (
          <View style={[styles.sessionPhoto, styles.photoPlaceholder]}>
            <Ionicons name="people" size={48} color={Colors.textMuted} />
          </View>
        )}

        <Text style={styles.sessionName}>{session.name}</Text>
        {session.bio ? (
          <Text style={styles.sessionBio}>{session.bio}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="people" size={16} color={Colors.primaryLight} />
            <Text style={styles.metaText}>{session.member_count} pers</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={16} color={Colors.primaryLight} />
            <Text style={styles.metaText}>{session.venue_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color={Colors.primaryLight} />
            <Text style={styles.metaText}>
              {session.age_min}–{session.age_max} år
            </Text>
          </View>
        </View>

        <CountdownTimer expiresAt={session.expires_at} />
      </View>

      {/* Actions */}
      <Button
        title="Bjud in vänner"
        onPress={handleShare}
        variant="outline"
        style={{ marginTop: Spacing.md }}
      />
      <Button
        title="Avsluta session"
        onPress={handleEnd}
        variant="ghost"
        textStyle={{ color: Colors.danger }}
        style={{ marginTop: Spacing.sm }}
      />
    </ScrollView>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────
export default function GroupScreen() {
  const { session, isLoading, refreshSession } = useGroupSession();

  if (isLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      {session ? (
        <ActiveSessionView onEnd={refreshSession} />
      ) : (
        <CreateGroupForm onCreate={refreshSession} />
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  subheading: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  photoPicker: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  photoText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ageInput: {
    flex: 1,
    marginBottom: 0,
  },
  ageDash: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xl,
    marginHorizontal: Spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,71,87,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  // Active session styles
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  sessionPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  sessionName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sessionBio: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
});
