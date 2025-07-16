import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ImageSlider({ slides }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  // Auto-advance slides
  useEffect(() => {
    if (!isDragging) {
      const interval = setInterval(() => {
        goToNext();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentIndex, isDragging]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      setIsDragging(true);
    })
    .onEnd((event) => {
      setIsDragging(false);
      
      // Determine swipe direction based on translation
      if (event.translationX > 50) {
        goToPrevious();
      } else if (event.translationX < -50) {
        goToNext();
      }
    });

  return (
    <View style={styles.sliderContainer}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.slideContainer}>
          {slides.map((slide, slideIndex) => (
            <View
              key={slideIndex}
              style={[
                styles.slide,
                {
                  opacity: currentIndex === slideIndex ? 1 : 0,
                  zIndex: currentIndex === slideIndex ? 1 : 0,
                },
              ]}
            >
              <Image
                source={{ uri: slide.url }}
                style={styles.slideImage}
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      </GestureDetector>

      {/* Navigation Arrows */}
      <TouchableOpacity style={styles.arrowLeft} onPress={goToPrevious}>
        <View style={styles.arrowBackground}>
          <ChevronLeft size={24} color="#ffffff" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.arrowRight} onPress={goToNext}>
        <View style={styles.arrowBackground}>
          <ChevronRight size={24} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, slideIndex) => (
          <TouchableOpacity
            key={slideIndex}
            style={[
              styles.dot,
              {
                backgroundColor:
                  currentIndex === slideIndex
                    ? '#ffffff'
                    : 'rgba(255, 255, 255, 0.4)',
                transform: [
                  { scale: currentIndex === slideIndex ? 1.2 : 1 },
                ],
                width: currentIndex === slideIndex ? 28 : 10,
              },
            ]}
            onPress={() => goToSlide(slideIndex)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  slideContainer: {
    flex: 1,
    position: 'relative',
  },
  slide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  arrowLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -22 }],
    zIndex: 20,
  },
  arrowRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -22 }],
    zIndex: 20,
  },
  arrowBackground: {
    backgroundColor: '#003366',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
    paddingHorizontal: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});