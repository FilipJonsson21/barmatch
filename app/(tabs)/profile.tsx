import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import Input from '@/components/Input';
import Button from '@/components/Button';
import LoadingScreen from '@/components/LoadingScreen';
import { Colors, FontSizes, Spacing } from '@/lib/constants';

export default function ProfileScreen() {
  const { session, user, isLoading, signOut, refreshUser } = useAuth();

  // ── Editable fields ──────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [ageText, setAgeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If user has no profile yet, we need to create one
  const needsProfile = !!session && !user;

  // Sync editable fields when user loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setAgeText(String(user.age));
    }
  }, [user]);

  // ── Save profile (update or create) ─────────────────────────────────
  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Ange ett visningsnamn.');
      return;
    }
    if (displayName.trim().length < 2) {
      setError('Visningsnamnet måste vara minst 2 tecken.');
      return;
    }

    const ageNum = parseInt(ageText, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setError('Du måste vara minst 18 år.');
      return;
    }
    if (ageNum > 99) {
      setError('Ange en giltig ålder (18–99).');
      return;
    }

    setSaving(true);

    const userId = session?.user?.id;
    if (!userId) {
      setError('Ingen session hittades. Logga in igen.');
      setSaving(false);
      return;
    }

    if (needsProfile) {
      // Create the profile row that's missing
      const { error: insertErr } = await supabase.from('users').insert({
        id: userId,
        email: session.user.email ?? '',
        display_name: displayName.trim(),
        age: ageNum,
      });

      setSaving(false);
      if (insertErr) {
        setError(`Kunde inte skapa profil: ${insertErr.message}`);
      } else {
        setSuccess('Profil skapad!');
        await refreshUser();
        setEditing(false);
      }
    } else {
      // Update existing profile
      const { error: updateErr } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim(),
          age: ageNum,
        })
        .eq('id', userId);

      setSaving(false);
      if (updateErr) {
        setError(`Kunde inte spara: ${updateErr.message}`);
      } else {
        setSuccess('Profil uppdaterad!');
        await refreshUser();
        setEditing(false);
      }
    }
  };

  // ── Avatar picker ───────────────────────────────────────────────────
  const pickAvatar = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const ext = uri.split('.').pop() ?? 'jpg';
    const fileName = `${userId}/avatar.${ext}`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

      await supabase
        .from('users')
        .update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
        .eq('id', userId);

      await refreshUser();
    } catch {
      setError('Kunde inte ladda upp profilbild.');
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Vill du logga ut?');
      if (!ok) return;
      await signOut();
    } else {
      Alert.alert('Logga ut', 'Vill du logga ut?', [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Logga ut', style: 'destructive', onPress: signOut },
      ]);
    }
  };

  // ── Loading state ───────────────────────────────────────────────────
  if (isLoading) return <LoadingScreen />;

  // ── Not logged in at all ────────────────────────────────────────────
  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Inte inloggad</Text>
          <Text style={styles.emptySubtitle}>
            Logga in eller skapa ett konto för att se din profil.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Needs profile creation ──────────────────────────────────────────
  if (needsProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>Slutför din profil</Text>
          <Text style={styles.subheading}>
            Fyll i dina uppgifter för att komma igång med BarMatch.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoValue}>{session.user.email}</Text>
            </View>

            <Input
              label="Visningsnamn"
              placeholder="T.ex. Johan"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <Input
              label="Ålder"
              placeholder="25"
              value={ageText}
              onChangeText={(t) => setAgeText(t.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Button
              title="Spara profil"
              onPress={handleSave}
              loading={saving}
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
          </View>

          <Button
            title="Logga ut"
            variant="ghost"
            onPress={handleLogout}
            textStyle={{ color: Colors.danger }}
            style={{ marginTop: Spacing.xl }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Full profile view ───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Profil</Text>

        {/* Avatar */}
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap}>
          <Avatar uri={user!.avatar_url} name={user!.display_name} size={100} />
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Info / Edit mode */}
        {editing ? (
          <View style={styles.editSection}>
            <Input
              label="Visningsnamn"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            <Input
              label="Ålder"
              value={ageText}
              onChangeText={(t) => setAgeText(t.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <View style={styles.editButtons}>
              <Button title="Spara" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
              <Button
                title="Avbryt"
                variant="outline"
                onPress={() => {
                  setEditing(false);
                  setError('');
                  setSuccess('');
                  setDisplayName(user!.display_name);
                  setAgeText(String(user!.age));
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.name}>{user!.display_name}</Text>
            <Text style={styles.meta}>
              {user!.age} år • {user!.email}
            </Text>

            {success ? (
              <View style={[styles.successBox, { marginTop: Spacing.md }]}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Button
              title="Redigera profil"
              variant="outline"
              size="sm"
              onPress={() => {
                setEditing(true);
                setError('');
                setSuccess('');
              }}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konto</Text>
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowText}>{user!.email}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowText}>{user!.age} år</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.rowText}>
              Medlem sedan{' '}
              {new Date(user!.created_at).toLocaleDateString('sv-SE')}
            </Text>
          </View>
        </View>

        {/* Logout */}
        <Button
          title="Logga ut"
          variant="ghost"
          onPress={handleLogout}
          textStyle={{ color: Colors.danger }}
          style={{ marginTop: Spacing.xl, marginBottom: Spacing.xxl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoValue: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  name: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  meta: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  editSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  editButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  section: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  rowText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,71,87,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,0.3)',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.sm,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46,213,115,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.3)',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  successText: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    flex: 1,
  },
});
