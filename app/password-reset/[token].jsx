import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';

export default function PasswordResetForm() {
  const { token } = useLocalSearchParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setError('Token za resetovanje lozinke nije pronađen.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://klinikabackend-production.up.railway.app/api/Auth/ValidateResetToken?token=${encodeURIComponent(token)}`
        );
        
        if (response.ok) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setError('Link za resetovanje lozinke nije validan ili je istekao.');
        }
      } catch (err) {
        setIsTokenValid(false);
        setError('Link za resetovanje lozinke nije validan ili je istekao.');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const getPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /(?=.*[A-Z])/.test(password),
      number: /(?=.*\d)/.test(password),
    };
    return requirements;
  };

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera.');
      return;
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setError('Lozinka mora sadržati najmanje jedno veliko slovo.');
      return;
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      setError('Lozinka mora sadržati najmanje jedan broj.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Lozinke se ne podudaraju.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/ResetPassword',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      );

      if (response.ok) {
        setSuccessMessage(
          'Vaša lozinka je uspešno promenjena! Preusmerićemo vas na početnu stranicu.'
        );
        
        Alert.alert(
          'Uspešno!',
          'Vaša lozinka je uspešno promenjena!',
          [
            {
              text: 'OK',
              onPress: () => {
                setTimeout(() => {
                  router.replace('/');
                }, 1000);
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Došlo je do greške. Pokušajte ponovo kasnije.');
      }
    } catch (err) {
      setError('Došlo je do greške. Pokušajte ponovo kasnije.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Validiranje tokena...</Text>
      </View>
    );
  }

  if (!isTokenValid) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Nevažeći link</Text>
            <Text style={styles.errorMessage}>
              Link za resetovanje lozinke nije validan ili je istekao.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push('/password-reset')}
            >
              <Text style={styles.buttonText}>Zatražite novi link</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.backButtonText}>Nazad na početnu</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Postavi novu lozinku</Text>
          <Text style={styles.description}>
            Unesite vašu novu lozinku. Lozinka mora sadržati najmanje 8 karaktera,
            jedno veliko slovo i jedan broj.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nova lozinka</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Unesite novu lozinku"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Potvrdite lozinku</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Potvrdite novu lozinku"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Lozinka mora sadržati:</Text>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, passwordStrength.length && styles.requirementValid]}>
                {passwordStrength.length ? '✓' : '○'} Najmanje 8 karaktera
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, passwordStrength.uppercase && styles.requirementValid]}>
                {passwordStrength.uppercase ? '✓' : '○'} Najmanje jedno veliko slovo
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={[styles.requirementText, passwordStrength.number && styles.requirementValid]}>
                {passwordStrength.number ? '✓' : '○'} Najmanje jedan broj
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sačuvaj novu lozinku</Text>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
          {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#959da5',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#003366',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#4b5563',
    lineHeight: 20,
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
    color: '#4b5563',
    fontSize: 14,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  passwordRequirements: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  requirementItem: {
    marginVertical: 2,
  },
  requirementText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  requirementValid: {
    color: '#10b981',
  },
  button: {
    backgroundColor: '#003366',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  successMessage: {
    color: '#10b981',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#003366',
    fontSize: 14,
    fontWeight: '500',
  },
});