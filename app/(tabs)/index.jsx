import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Clock,
  MapPin,
  Phone,
  Heart,
  Users,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import ImageSlider from '@/components/Home/ImageSlider';
import ReviewSection from '@/components/Home/ReviewSection';

const { width: screenWidth } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  const slides = [
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika1.jpeg',
      title: 'klinika1',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika2.jpeg',
      title: 'klinika2',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika5.jpg',
      title: 'klinika5',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika6.jpg',
      title: 'klinika6',
    },
    {
      url: 'https://dzemil.blob.core.windows.net/slike/klinika7.jpg',
      title: 'klinika7',
    },
  ];

  const workingHours = [
    { day: 'Ponedeljak - Petak', hours: '08:00 - 16:30' },
    { day: 'Subota', hours: '09:00 - 12:00' },
    { day: 'Nedelja', hours: 'Zatvoreno' },
  ];

  const checkUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const roles =
          decodedPayload[
            'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
          ] || '';
        setUserRole(roles);
      }
    } catch (error) {
      setError('Error decoding token.');
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Service',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Greška prilikom fetchovanja usluga.');
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Review'
      );
      if (!response.ok) {
        throw new Error('Greška prilikom dohvatanja recenzija');
      }
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleAddReview = async (newReview) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await fetch(
        'https://klinikabackend-production.up.railway.app/api/Review',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newReview),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert(
          'Greška',
          errorData?.message || 'Došlo je do greške prilikom dodavanja recenzije.'
        );
        return;
      }

      setReviews((prevReviews) => [...prevReviews, newReview]);
      fetchReviews();
      Alert.alert('Uspeh', 'Recenzija je uspešno dodata!');
    } catch (error) {
      console.error('Greška prilikom dodavanja recenzije:', error);
      Alert.alert('Greška', 'Došlo je do greške prilikom povezivanja sa serverom.');
    }
  };

  const handleDeleteReview = (reviewId) => {
    setReviews((prevReviews) =>
      prevReviews.filter((review) => review.id !== reviewId)
    );
  };

  const openMap = () => {
    const url = 'https://maps.google.com/?q=Pešterska+17,+Tutin';
    Linking.openURL(url);
  };

  const callPhone = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      checkUserRole();
      fetchServices();
      fetchReviews();
    }
  }, [showSplash]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={{
            uri: 'https://dzemil.blob.core.windows.net/slike/oculus.png',
          }}
          style={styles.splashImage}
          resizeMode="contain"
        />
        <Text style={styles.splashText}>Oculus</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Slider Section */}
        <View style={styles.sliderContainer}>
          <ImageSlider slides={slides} />
          <View style={styles.welcomeOverlay}>
            <Text style={styles.welcomeText}>Dobrodošli u Oculus</Text>
            <TouchableOpacity
              style={styles.reserveButton}
              onPress={() => router.push('/services')}
            >
              <Text style={styles.reserveButtonText}>
                Rezerviši svoj termin na vreme!
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mission Section */}
        <View style={[styles.section, styles.missionSection]}>
          <Text style={styles.sectionTitle}>Naša Misija</Text>
          <Text style={styles.sectionText}>
            U Oculus očnoj klinici, naša misija je da pružimo vrhunsku
            oftalmološku negu koristeći najsavremeniju tehnologiju i stručnost
            našeg medicinskog tima. Posvećeni smo očuvanju i poboljšanju vida
            naših pacijenata kroz personalizovani pristup i kontinuiranu
            edukaciju.
          </Text>
          <View style={styles.missionPoints}>
            <View style={styles.missionPoint}>
              <Heart size={32} color="#007AFF" />
              <Text style={styles.missionPointTitle}>Briga o pacijentima</Text>
              <Text style={styles.missionPointText}>
                Individualni pristup svakom pacijentu
              </Text>
            </View>
            <View style={styles.missionPoint}>
              <Users size={32} color="#007AFF" />
              <Text style={styles.missionPointTitle}>Stručni tim</Text>
              <Text style={styles.missionPointText}>
                Iskusni oftalmolozi i medicinsko osoblje
              </Text>
            </View>
            <View style={styles.missionPoint}>
              <CheckCircle2 size={32} color="#007AFF" />
              <Text style={styles.missionPointTitle}>Kvalitet</Text>
              <Text style={styles.missionPointText}>
                Najviši standardi medicinske nege
              </Text>
            </View>
          </View>
        </View>

        {/* Services Section */}
        <View style={[styles.section, styles.servicesSection]}>
          <Text style={styles.sectionTitle}>Naše Usluge</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.servicesGrid}>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <CheckCircle2 size={24} color="#34C759" />
                  <Text style={styles.serviceText}>{service.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Working Hours Section */}
        <View style={[styles.section, styles.workingHoursSection]}>
          <Text style={styles.sectionTitle}>Radno Vreme</Text>
          <View style={styles.workingHoursContainer}>
            {workingHours.map((schedule, index) => (
              <View key={index} style={styles.hoursItem}>
                <Clock size={24} color="#007AFF" />
                <View style={styles.hoursTextContainer}>
                  <Text style={styles.hoursDay}>{schedule.day}</Text>
                  <Text style={styles.hoursTime}>{schedule.hours}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={[styles.section, styles.contactSection]}>
          <Text style={styles.sectionTitle}>Kontakt Informacije</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactItem} onPress={openMap}>
              <MapPin size={32} color="#007AFF" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Adresa</Text>
                <Text style={styles.contactText}>Pešterska 17, Tutin</Text>
                <Text style={styles.tapToOpenText}>Dodirni za mapu</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.contactItem}>
              <Phone size={32} color="#007AFF" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Telefon</Text>
                <TouchableOpacity onPress={() => callPhone('020123456')}>
                  <Text style={styles.phoneNumber}>020/123-456</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => callPhone('0601234567')}>
                  <Text style={styles.phoneNumber}>060/123-4567</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.contactItem}>
              <Calendar size={32} color="#007AFF" />
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Zakazivanje</Text>
                <TouchableOpacity
                  style={styles.appointmentButton}
                  onPress={() => router.push('/services')}
                >
                  <Text style={styles.appointmentButtonText}>Zakaži pregled</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <ReviewSection
          reviews={reviews}
          onAddReview={handleAddReview}
          onDeleteReview={handleDeleteReview}
          role={userRole}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
  },
  splashText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 24,
  },
  sliderContainer: {
    height: 400,
    position: 'relative',
  },
  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
    paddingHorizontal: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  reserveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  missionSection: {
    backgroundColor: '#ffffff',
  },
  servicesSection: {
    backgroundColor: '#f8f9fa',
  },
  workingHoursSection: {
    backgroundColor: '#ffffff',
  },
  contactSection: {
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  missionPoints: {
    gap: 24,
  },
  missionPoint: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  missionPointTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  missionPointText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 32,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 16,
    marginVertical: 32,
  },
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  workingHoursContainer: {
    gap: 16,
  },
  hoursItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  hoursTextContainer: {
    flex: 1,
  },
  hoursDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  hoursTime: {
    fontSize: 14,
    color: '#666666',
  },
  contactGrid: {
    gap: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  tapToOpenText: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  phoneNumber: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  appointmentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  appointmentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});