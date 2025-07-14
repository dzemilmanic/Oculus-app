import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

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
      }, 3000);

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
        <ChevronLeft size={24} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.arrowRight} onPress={goToNext}>
        <ChevronRight size={24} color="#ffffff" />
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
                    ? '#007AFF'
                    : 'rgba(255, 255, 255, 0.5)',
                transform: [
                  { scale: currentIndex === slideIndex ? 1.2 : 1 },
                ],
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
    height: 400,
    width: screenWidth,
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
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  arrowRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});