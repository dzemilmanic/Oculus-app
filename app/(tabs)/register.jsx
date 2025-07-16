import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Link } from 'expo-router';
import { Check, X, Eye, EyeOff, UserPlus, Shield } from 'lucide-react-native';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roles: ['User'],
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeSuccessMessage, setCodeSuccessMessage] = useState('');

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasNumber: false,
  });

  useEffect(() => {
    const password = formData.password;
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  }, [formData.password]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccessMessage('');

    if (!Object.values(passwordValidation).every(Boolean)) {
      setError('Molimo vas da ispunite sve zahteve za lozinku.');
      return;
    }

    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Auth/RegisterVerif',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(data.message || 'Uspešna registracija!');
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          roles: ['User'],
        });
      } else {
        setError(data.message || 'Došlo je do greške prilikom registracije.');
      }
    } catch (err) {
      setError('Došlo je do greške prilikom registracije.');
    }
  };

  const ValidationIcon = ({ isValid }) => {
    return isValid ? (
      <Check size={16} color="#059669" />
    ) : (
      <X size={16} color="#dc2626" />
    );
  };

  const isFormValid = Object.values(passwordValidation).every(Boolean) && 
                     formData.email && 
                     formData.firstName && 
                     formData.lastName;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.registerContainer}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <UserPlus size={32} color="#3e48d6ff" />
            </View>
          </View>
          <Text style={styles.registerTitle}>Registruj se</Text>
          <Text style={styles.registerSubtitle}>Kreirajte svoj nalog za pristup aplikaciji</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vaše ime</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(value) => handleChange('firstName', value)}
              placeholder="Unesite vaše ime"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Vaše prezime</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => handleChange('lastName', value)}
              placeholder="Unesite vaše prezime"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="Unesite vaš email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Lozinka</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Unesite vašu lozinku"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={togglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
            
            {(passwordFocused || formData.password) && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsTitle}>Lozinka mora sadržati:</Text>
                <View style={styles.requirementsList}>
                  <View style={[
                    styles.requirementItem,
                    passwordValidation.minLength && styles.validRequirement
                  ]}>
                    <ValidationIcon isValid={passwordValidation.minLength} />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.minLength && styles.validText
                    ]}>
                      Najmanje 8 karaktera
                    </Text>
                  </View>
                  <View style={[
                    styles.requirementItem,
                    passwordValidation.hasUpperCase && styles.validRequirement
                  ]}>
                    <ValidationIcon isValid={passwordValidation.hasUpperCase} />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasUpperCase && styles.validText
                    ]}>
                      Jedno veliko slovo
                    </Text>
                  </View>
                  <View style={[
                    styles.requirementItem,
                    passwordValidation.hasNumber && styles.validRequirement
                  ]}>
                    <ValidationIcon isValid={passwordValidation.hasNumber} />
                    <Text style={[
                      styles.requirementText,
                      passwordValidation.hasNumber && styles.validText
                    ]}>
                      Jedan broj
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.registerButton,
              !isFormValid && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Text style={styles.registerButtonText}>Registruj se</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorMessage}>{error}</Text>}
          {successMessage && <Text style={styles.successMessage}>{successMessage}</Text>}

          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              Već imate nalog?{' '}
              <Link href="/login" style={styles.loginLinkButton}>
                Prijavite se
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    marginTop: 28
},
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  registerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
    borderTopWidth: 4,
    borderTopColor: '#667eea',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  registerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 8,
  },
  registerSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 56,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  passwordRequirements: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 2,
  },
  validRequirement: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 12,
    fontWeight: '500',
  },
  validText: {
    color: '#047857',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#003366',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    fontWeight: '500',
  },
  successMessage: {
    color: '#10b981',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    fontWeight: '500',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  loginLinkButton: {
    color: '#667eea',
    fontWeight: '700',
  },
});