import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Eye, RefreshCw, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';

const ishiharaTests = [
  {
    id: 1,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/test-vida-boje.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '12',
    redGreenDeficiency: '12',
    colorBlind: '12',
    options: ['21', '12', '17', 'Ne vidim broj'],
    description: 'Kontrolna tabla - svi trebaju da vide broj 12',
    isControl: true
  },
  {
    id: 2,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/test-za-daltonizam-2.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '8',
    redGreenDeficiency: '3',
    colorBlind: 'Ništa',
    options: ['3', '6', '8', 'Ne vidim broj'],
    description: 'Test za crveno-zelenu slabost vida'
  },
  {
    id: 3,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/test-za-boje-3.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '29',
    redGreenDeficiency: '70',
    colorBlind: 'Ništa',
    options: ['70', '29', '20', 'Ne vidim broj'],
    description: 'Test za razlikovanje crvene i zelene boje'
  },
  {
    id: 4,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/testiranje-daltonizma-4.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '5',
    redGreenDeficiency: '2',
    colorBlind: 'Ništa',
    options: ['5', '2', '8', 'Ne vidim broj'],
    description: 'Test za protanopiju i deuteranopiju'
  },
  {
    id: 5,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/test-za-daltonizam-5.png',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '3',
    redGreenDeficiency: '5',
    colorBlind: 'Ništa',
    options: ['5', '8', '3', 'Ne vidim broj'],
    description: 'Test za crveno-zelenu deficijenciju'
  },
  {
    id: 6,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/testovi-za-daltonizam-6.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '15',
    redGreenDeficiency: '17',
    colorBlind: 'Ništa',
    options: ['17', '19', '15', 'Ne vidim broj'],
    description: 'Test za razlikovanje nijanse'
  },
  {
    id: 7,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/testiranje-vida-boje-7.png',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '74',
    redGreenDeficiency: '21',
    colorBlind: 'Ništa',
    options: ['74', '71', '21', 'Ne vidim broj'],
    description: 'Kompleksniji test za daltonizam'
  },
  {
    id: 8,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/test-za-boje-8.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '6',
    redGreenDeficiency: 'Ništa',
    colorBlind: 'Ništa',
    options: ['9', '6', '8', 'Ne vidim broj'],
    description: 'Test koji samo osobe sa normalnim vidom mogu da prođu'
  },
  {
    id: 9,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/test-za-prepoznavanje-boja-9.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '45',
    redGreenDeficiency: 'Ništa',
    colorBlind: 'Ništa',
    options: ['48', '43', '45', 'Ne vidim broj'],
    description: 'Test za potpunu deficijenciju boja'
  },
  {
    id: 10,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/online-testovi-za-vid-10.png',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '5',
    redGreenDeficiency: 'Ništa',
    colorBlind: 'Ništa',
    options: ['5', '8', '3', 'Ne vidim broj'],
    description: 'Test osetljivosti na boje'
  },
  {
    id: 11,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/ishihara-test-14.png.webp',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '26',
    redGreenDeficiency: '86',
    colorBlind: '68',
    options: ['26', '86', '68', 'Ne vidim broj'],
    description: 'Test osetljivosti na boje'
  },
  {
    id: 12,
    image: 'https://www.optometrija.net/wp-content/uploads/2023/10/ishihara-testovi-daltonizam-15.png',
    question: 'Koji broj vidite na ovoj slici?',
    normalVision: '42',
    redGreenDeficiency: '62',
    colorBlind: '48',
    options: ['62', '42', '48', 'Ne vidim broj'],
    description: 'Test osetljivosti na boje'
  }
];

export default function VisionTestScreen() {
  const [currentTest, setCurrentTest] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const startTest = () => {
    setTestStarted(true);
    setCurrentTest(0);
    setAnswers([]);
    setShowResults(false);
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentTest < ishiharaTests.length - 1) {
      setCurrentTest(currentTest + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setCurrentTest(0);
    setAnswers([]);
    setShowResults(false);
  };

  const analyzeResults = () => {
    let normalVisionCount = 0;
    let redGreenDeficiencyCount = 0;
    let colorBlindCount = 0;
    let controlTestPassed = false;

    answers.forEach((answer, index) => {
      const test = ishiharaTests[index];
      const userAnswer = answer === 'Ne vidim broj' ? 'Ništa' : answer;
      
      // Proveri kontrolni test
      if (test.isControl && userAnswer === test.normalVision) {
        controlTestPassed = true;
      }
      
      if (userAnswer === test.normalVision) {
        normalVisionCount++;
      } else if (userAnswer === test.redGreenDeficiency || 
                 (test.redGreenDeficiency2 && userAnswer === test.redGreenDeficiency2)) {
        redGreenDeficiencyCount++;
      } else if (userAnswer === test.colorBlind || 
                 userAnswer === 'Ništa' || 
                 answer === 'Ne vidim broj') {
        colorBlindCount++;
      }
    });

    return {
      normalVisionCount,
      redGreenDeficiencyCount,
      colorBlindCount,
      controlTestPassed,
      totalTests: ishiharaTests.length
    };
  };

  const getDiagnosis = () => {
    const results = analyzeResults();
    
    // Ako nije prošao kontrolni test, test možda nije valjan
    if (!results.controlTestPassed) {
      return {
        type: 'invalid',
        title: 'Test možda nije valjan',
        description: 'Niste uspešno prošli kontrolni test. Molimo ponovite test u boljim uslovima osvetljenja ili kontaktirajte oftalmologa.',
        severity: 'warning',
        recommendation: 'Ponovite test ili se obratite stručnjaku'
      };
    }

    const normalPercentage = (results.normalVisionCount / results.totalTests) * 100;
    const deficiencyPercentage = (results.redGreenDeficiencyCount / results.totalTests) * 100;
    const blindPercentage = (results.colorBlindCount / results.totalTests) * 100;

    if (normalPercentage >= 80) {
      return {
        type: 'normal',
        title: 'Normalan vid za boje',
        description: 'Vaš vid za boje je u potpunosti normalan. Uspešno razlikujete sve boje bez poteškoća.',
        severity: 'success',
        recommendation: 'Redovni kontrolni pregledi kod oftalmologa'
      };
    } else if (deficiencyPercentage >= 30 || (deficiencyPercentage + blindPercentage) >= 50) {
      return {
        type: 'deficiency',
        title: 'Crveno-zelena slabost vida',
        description: 'Rezultati ukazuju na poteškoće u razlikovanju crvene i zelene boje (protanopija ili deuteranopija). Ovo je najčešći tip daltonizma.',
        severity: 'warning',
        recommendation: 'Preporučujemo konsultaciju sa oftalmologom za detaljnu dijagnozu'
      };
    } else if (blindPercentage >= 40) {
      return {
        type: 'colorblind',
        title: 'Značajna deficijencija boja',
        description: 'Rezultati ukazuju na značajne poteškoće u prepoznavanju boja. Možda imate potpunu deficijenciju određenih boja.',
        severity: 'error',
        recommendation: 'Obavezno se obratite oftalmologu za detaljnu dijagnozu i savet'
      };
    } else {
      return {
        type: 'mild',
        title: 'Blaga slabost vida za boje',
        description: 'Rezultati ukazuju na blage poteškoće u razlikovanju određenih boja. Ovo može biti privremeno ili blaga forma daltonizma.',
        severity: 'warning',
        recommendation: 'Preporučujemo kontrolni pregled kod oftalmologa'
      };
    }
  };

  if (!testStarted) {
    return (
      <>
        <StatusBar style="dark" />
        <ScrollView style={styles.container}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Ishihara test daltonizma</Text>
            <Eye size={80} color="#007AFF" />
            <Text style={styles.welcomeDescription}>
              Profesionalni test za proveru sposobnosti razlikovanja boja. 
              Test koristi originalne Ishihara table koje se koriste u medicinskoj praksi.
            </Text>
            
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Važna uputstva:</Text>
              <Text style={styles.instructionText}>
                • Koristite test u dobrom prirodnom osvetljenju
              </Text>
              <Text style={styles.instructionText}>
                • Držite uređaj na normalnoj udaljenosti (30-40cm)
              </Text>
              <Text style={styles.instructionText}>
                • Gledajte svaku sliku maksimalno 3 sekunde
              </Text>
              <Text style={styles.instructionText}>
                • Odgovorite instinktivno, ne analizirajte previše
              </Text>
              <Text style={styles.instructionText}>
                • Test nije zamena za profesionalnu dijagnozu
              </Text>
            </View>

            <View style={styles.warningCard}>
              <AlertTriangle size={24} color="#F59E0B" />
              <Text style={styles.warningText}>
                Ovaj test je samo orijentacioni. Za preciznu dijagnozu obavezno se obratite oftalmologu.
              </Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startTest}>
              <Text style={styles.startButtonText}>Počni test</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  if (showResults) {
    const diagnosis = getDiagnosis();
    const results = analyzeResults();
    
    return (
      <>
        <StatusBar style="dark" />
        <ScrollView style={styles.container}>
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              {diagnosis.severity === 'success' && <CheckCircle size={80} color="#22C55E" />}
              {diagnosis.severity === 'warning' && <AlertTriangle size={80} color="#F59E0B" />}
              {diagnosis.severity === 'error' && <XCircle size={80} color="#EF4444" />}
              <Text style={styles.resultsTitle}>Rezultati testa</Text>
            </View>

            <View style={[styles.diagnosisCard, 
              diagnosis.severity === 'success' && styles.successCard,
              diagnosis.severity === 'warning' && styles.warningCard,
              diagnosis.severity === 'error' && styles.errorCard
            ]}>
              <Text style={styles.diagnosisTitle}>{diagnosis.title}</Text>
              <Text style={styles.diagnosisDescription}>{diagnosis.description}</Text>
              <Text style={styles.recommendationText}>{diagnosis.recommendation}</Text>
            </View>

            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsTitle}>Statistika odgovora:</Text>
              <View style={styles.statisticsRow}>
                <Text style={styles.statisticsLabel}>Normalan vid:</Text>
                <Text style={styles.statisticsValue}>{results.normalVisionCount}/{results.totalTests}</Text>
              </View>
              <View style={styles.statisticsRow}>
                <Text style={styles.statisticsLabel}>Crveno-zelena slabost:</Text>
                <Text style={styles.statisticsValue}>{results.redGreenDeficiencyCount}/{results.totalTests}</Text>
              </View>
              <View style={styles.statisticsRow}>
                <Text style={styles.statisticsLabel}>Deficijencija boja:</Text>
                <Text style={styles.statisticsValue}>{results.colorBlindCount}/{results.totalTests}</Text>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Detaljni rezultati:</Text>
              {ishiharaTests.map((test, index) => {
                const userAnswer = answers[index] === 'Ne vidim broj' ? 'Ništa' : answers[index];
                const isCorrectNormal = userAnswer === test.normalVision;
                const isCorrectDeficiency = userAnswer === test.redGreenDeficiency || 
                                          (test.redGreenDeficiency2 && userAnswer === test.redGreenDeficiency2);
                const isCorrectBlind = userAnswer === test.colorBlind || 
                                     userAnswer === 'Ništa' || 
                                     answers[index] === 'Ne vidim broj';
                
                return (
                  <View key={test.id} style={styles.resultItem}>
                    <Text style={styles.resultQuestion}>
                      Test {index + 1}: {test.description}
                    </Text>
                    <Text style={styles.resultAnswer}>
                      Vaš odgovor: {answers[index]}
                    </Text>
                    <Text style={styles.resultExpected}>
                      Normalan vid: {test.normalVision} | 
                      Crveno-zelena slabost: {test.redGreenDeficiency}{test.redGreenDeficiency2 ? ` ili ${test.redGreenDeficiency2}` : ''} | 
                      Daltonizam: {test.colorBlind}
                    </Text>
                    <View style={styles.resultStatusContainer}>
                      {isCorrectNormal && <CheckCircle size={16} color="#22C55E" />}
                      {isCorrectDeficiency && <AlertTriangle size={16} color="#F59E0B" />}
                      {isCorrectBlind && <XCircle size={16} color="#EF4444" />}
                      {!isCorrectNormal && !isCorrectDeficiency && !isCorrectBlind && <XCircle size={16} color="#6B7280" />}
                    </View>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.retryButton} onPress={resetTest}>
              <RefreshCw size={20} color="#ffffff" />
              <Text style={styles.retryButtonText}>Ponovi test</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  const currentTestData = ishiharaTests[currentTest];

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView style={styles.container}>
        <View style={styles.testSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentTest + 1) / ishiharaTests.length) * 100}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.testCounter}>
            {currentTest + 1} od {ishiharaTests.length}
          </Text>

          <View style={styles.testCard}>
            <Image 
              source={{ uri: currentTestData.image }} 
              style={styles.testImage}
              resizeMode="contain"
            />
            
            <Text style={styles.testQuestion}>
              {currentTestData.question}
            </Text>

            <Text style={styles.testDescription}>
              {currentTestData.description}
            </Text>

            <View style={styles.optionsContainer}>
              {currentTestData.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionButton}
                  onPress={() => handleAnswer(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  instructionsCard: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 12,
  },
  startButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#003366',
    borderRadius: 2,
  },
  testCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  testCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  testImage: {
    width: 250,
    height: 250,
    borderRadius: 125,
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
  },
  testQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  testDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  resultsSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 16,
  },
  diagnosisCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  diagnosisTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  diagnosisDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statisticsCard: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  statisticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statisticsLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statisticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  resultItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  resultAnswer: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  resultExpected: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  resultStatusContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  retryButton: {
    backgroundColor: '#003366',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});