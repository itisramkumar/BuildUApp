// BuildU onboarding app - updated with improved name & phone input validation, all permissions before "Let's Get Started"

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import RaviAudio from './assets/ravi_audio.mp3';
import AnitaAudio from './assets/anita_audio.mp3';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import { Audio } from 'expo-av';
import DateTimePicker from '@react-native-community/datetimepicker';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, RefreshControl } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';






const playVoiceIntro = async (uri) => {
  try {
    const { sound } = await Audio.Sound.createAsync(uri);
    await sound.playAsync();
  } catch (error) {
    console.error('Audio playback error:', error);
  }
};

const questionnaireData = [
  {
    question: 'What are you hoping to get out of this app?',
    options: [
      { label: 'Find Romance', img: require('./assets/romance.png') },
      { label: 'Grow Business Network', img: require('./assets/business.png') },
      { label: 'Explore New Connections', img: require('./assets/explore.png') },
      { label: 'Make New Friends', img: require('./assets/friends.png') },
    ],
  },
  {
    question: 'If your team doesn’t follow your opinion, how do you react?',
    options: [
      { label: 'Stay Calm', img: require('./assets/calm.png') },
      { label: 'Try to Convince', img: require('./assets/persuade.png') },
      { label: 'Accept and Adapt', img: require('./assets/accept.png') },
      { label: 'Get Frustrated', img: require('./assets/frustrated.png') },
    ],
  },
  {
    question: 'Which room would you prefer?',
    options: [
      { label: 'Clumsy Room', img: require('./assets/clumsy.png') },
      { label: 'Organized Room', img: require('./assets/organized.png') },
      { label: 'Minimal Storage', img: require('./assets/minimal.png') },
      { label: 'No Preference', img: require('./assets/none.png') },
    ],
  },
  {
    question: 'How do you view your support system?',
    options: [
      { label: 'Strong Family Support', img: require('./assets/family.png') },
      { label: 'Good Friendships', img: require('./assets/friend.png') },
      { label: 'Mostly Alone', img: require('./assets/alone.png') },
      { label: 'Prefer Privacy', img: require('./assets/reserved.png') },
    ],
  },
  {
    question: 'How do you think before expressing emotions?',
    options: [
      { label: 'Freely Express', img: require('./assets/open.png') },
      { label: 'Feel Shy', img: require('./assets/shy.png') },
      { label: 'Consider Others’ Opinions', img: require('./assets/friends.png') },
      { label: 'Hold Back', img: require('./assets/think.png') },
    ],
  },
  {
    question: 'Are you comfortable speaking on spot in front of gathering?',
    options: [
      { label: 'Yes, Confident', img: require('./assets/confident.png') },
      { label: 'Reserved', img: require('./assets/reserved.png') },
      { label: 'No, Nervous', img: require('./assets/nervous.png') },
      { label: 'Avoid It', img: require('./assets/alone.png') },
    ],
  },
];
const statuses = ['Available', 'Busy', 'Up for Chat', 'Offline'];


  // ... rest of your state and logic



export default function App() {
 
  const dummyNearbyUsers = [
  {
    id: '1',
    firstName: 'Anita',
    intent: 'Finding a partner',
    distance: '1.2 km',
    voiceIntroUri: AnitaAudio, // or audio uri
    isOnline: true,
  },
  {
    id: '2',
    firstName: 'Ravi',
    intent: 'Catch a Friend',
    distance: '3.5 km',
    voiceIntroUri: RaviAudio, // example audio file
    isOnline: false,
  },
  // ...
];
  
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const handlePlayAudio = async (audioUri) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

       const { sound } = await Audio.Sound.createAsync(audioUri, {
      shouldPlay: true,
      volume,
    });


      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleStopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    }
  };
  const [nearbyUsers, setNearbyUsers] = useState(dummyNearbyUsers);
 
  const [refreshing, setRefreshing] = useState(false);
  const [userStatus, setUserStatus] = useState('Available');
  const [step, setStep] = useState(1);
  const [showHome, setShowHome] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);
  const [useAvatar, setUseAvatar] = useState(false);
  const [mainUsersNearby, setMainUsersNearby] = useState([]);
  const [lastNotifiedUser, setLastNotifiedUser] = useState(null);
  const actionChipsByIntent = {
  "Find a Partner": [
    { label: '💌 Send a Wave', onPress: () => {/* your action */} },
    { label: '🎤 Start Voice Chat', onPress: () => {/* your action */} },
    { label: '📷 View Full Profile', onPress: () => {/* your action */} },
  ],
  'Business Communication': [
    { label: '📩 Pitch Now', onPress: () => {/* your action */} },
    { label: '📊 View Skills', onPress: () => {/* your action */} },
    { label: '💼 Schedule Meet', onPress: () => {/* your action */} },
  ],
  'Catch a Friend': [
    { label: '👋 Say Hi', onPress: () => {/* your action */} },
   
  ],
  'Exploring Now': [
    { label: '👋 Say Hi', onPress: () => {/* your action */} },
    { label: '🎤 Voice Chat', onPress: () => {/* your action */} },
  ],
};
const onRefresh = async () => {
  setRefreshing(true);
  // fetch new data here and update nearbyUsers
  setTimeout(() => setRefreshing(false), 1000);
};





  const intentColors = {
    "Romance": "#FF69B4",
    "Catch a Friend": "#1E90FF",
    "Business Communication": "#228B22",
    "Exploring Now": "#CCCCCC"
  };
  

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    intent: '',
    phone: '',
    dob: '',
    gender: '',
    answers: Array(questionnaireData.length).fill(null),
    profilePicture: null,
  });

  // Track current questionnaire index (for step 4)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [agreedToCheckbox, setAgreedToCheckbox] = useState(false);
  



  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [step, currentQuestionIndex]);

  useEffect(() => {
    let timer;
    if (step === 7) {
      timer = setTimeout(() => {
        setShowHome(true);
      }, 10000); // 10 seconds
    }
    return () => clearTimeout(timer); // cleanup
  }, [step]);
  


  const handleInputChange = (key, value) => {
    setUserData({ ...userData, [key]: value });
  };

  const handleNameChange = (key, value) => {
    // Allow alphabets, spaces, and dots only
    const validValue = value.replace(/[^a-zA-Z. ]/g, '');
    setUserData({ ...userData, [key]: validValue });
  };

  const handleAnswerSelect = (optionIndex) => {
    let newAnswers = [...userData.answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserData({ ...userData, answers: newAnswers });

    // Move to next question or next step
    if (currentQuestionIndex < questionnaireData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Questionnaire finished, move to next step (profile pic)
      setStep(5);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setUserData(prev => ({ ...prev, profilePicture: result.assets[0].uri }));
      Alert.alert(
        "Privacy",
        "Would you prefer to use an AI avatar instead of your real photo?",
        [
          { text: "Use AI Avatar", onPress: () => setUseAvatar(true) },
          { text: "Keep My Photo", onPress: () => setUseAvatar(false) }
        ]
      );
    }
  };
  const getAvatarByGender = () => {
    if (userData.gender === 'Female') return require('./assets/female.png');
    if (userData.gender === 'Other') return require('./assets/neutral.png');
    return require('./assets/male.png');
  };

  const renderAvatarWithRing = () => {
    const ringColor = intentColors[userData.intent] || "#CCCCCC";
    const avatarSource = useAvatar ? getAvatarByGender() : { uri: userData.profilePicture };
    return (
      <View style={styles.avatarContainer}>
        <View style={[styles.ringWrapper, { borderColor: ringColor }]}>  
          <Image source={avatarSource} style={styles.avatarImage} />
        </View>
      </View>
    );
  };


  const requestAllPermissions = async () => {
    try {
      // Location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      // Camera permission
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

      // Microphone permission
      const { status: micStatus } = await Audio.requestPermissionsAsync();

      // Media Library (Photos) permission
      const { status: photoStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      // Notification permission
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();

      if (
        locationStatus !== 'granted' ||
        cameraStatus !== 'granted' ||
        micStatus !== 'granted' ||
        photoStatus !== 'granted' ||
        notificationStatus !== 'granted'
      ) {
        Alert.alert(
          'Permissions Denied',
          'Please enable all permissions to proceed with the app.'
        );
        return false;
      }

      return true;
    } catch (error) {
      Alert.alert('Error', 'Unable to request permissions.');
      return false;
    }
  };

  const onLetsGetStartedPress = async () => {
    const granted = await requestAllPermissions();
    if (granted) {
      setModalVisible(true);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    handleInputChange('dob', currentDate.toISOString().split('T')[0]);
  };

  const handleAgreeAndContinue = () => {
    setAgreedToTerms(true);
    setModalVisible(false);
    setStep(2);
  };

  const goBack = () => {
    if (showHome) {
      // If on home screen, maybe do nothing or add logic to go back to profile
      setShowHome(false);
      setStep(7);
    } else if (step === 4 && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };
  

  const renderQuestionnaire = () => {
    const question = questionnaireData[currentQuestionIndex];
    return (
      <View style={styles.screen}>
        <Text style={styles.header}>{question.question}</Text>
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = userData.answers[currentQuestionIndex] === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleAnswerSelect(index)}
                activeOpacity={0.7}
              >
                <Image source={option.img} style={styles.optionImage} />
                <Text style={isSelected ? styles.optionTextSelected : styles.optionText}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title="Back" onPress={goBack} color="#aaa" />
        </View>
      </View>
    );
  };
  const restartOnboarding = () => {
    setShowHome(false);
    setStep(1);
    // reset other states if necessary like userData, answers etc.
  };

  const renderProfileUpload = () => {
  const avatarSource = useAvatar ? getAvatarByGender() : { uri: userData.profilePicture };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ alignItems: 'center' }}>
      <Text style={styles.header}>Upload your Profile Picture</Text>

      {userData.profilePicture ? (
        <View style={styles.avatarPreviewContainer}>
          <View style={[styles.ringWrapper, { borderColor: intentColors[userData.intent] || '#ccc' }]}>
            <Image source={avatarSource} style={styles.avatarImage} />
          </View>
        </View>
      ) : (
        <View style={styles.profilePlaceholder}>
          <Text style={{ color: '#888' }}>No image selected</Text>
        </View>
      )}

      <Button title="Pick Image from Gallery" onPress={pickImage} />
      <View style={{ height: 20 }} />
      <Button
        title="Continue"
        onPress={() => {
          if (!userData.profilePicture) {
            Alert.alert('Please upload a profile picture to continue.');
            return;
          }
          setStep(6);
        }}
      />
      <View style={{ marginTop: 10 }}>
        <Button title="Back" onPress={() => setStep(4)} color="#aaa" />
      </View>
    </ScrollView>
  );
};


  const renderDashboardLoader = () => {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          {
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingBottom: 40,
          },
        ]}
      >
        {/* SUCCESS ANIMATION */}
        <LottieView
          source={require('./assets/success.json')}
          autoPlay
          loop={false}
          style={{ width: 180, height: 180 }}
        />

        {/* Updated: Render avatar with ring instead of old photo */}
        {(userData.profilePicture || useAvatar) && renderAvatarWithRing()}

        {/* TEXTS */}
        <Text style={styles.successTitle}>
          Hey {userData.firstName || 'there'}! 🎉
        </Text>

        <Text style={styles.successSubtitle}>
          Congratulations, you're all set to move ahead.
        </Text>

        <Text style={styles.successTagline}>
          The world of meaningful connections starts now. 🌟
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => setStep(7)}
        >
          <Text style={styles.ctaText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

const renderDashboardScreen = () => {
   
  const filteredUsers = dummyNearbyUsers.filter(
  (user) => user.intent === userData.intent
  );
  
    const generateAISummary = () => {
      const traits = [];
      if (userData.answers.includes(0)) traits.push("open-minded");
      if (userData.answers.includes(1)) traits.push("persuasive communicator");
      if (userData.answers.includes(2)) traits.push("organized thinker");
      if (userData.answers.includes(3)) traits.push("emotionally aware");
      if (userData.answers.includes(5)) traits.push("confident speaker");
      if (traits.length === 0) return "You're unique in your own way! 🌟";
      return `You seem to be a ${traits.join(", ")}, someone who's ready to connect meaningfully and explore new possibilities. 🚀`;
    };

   return (
      <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: 80, alignItems: 'center' }}
    >
      <Text style={styles.header}>🎯 Your BuildU Profile</Text>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {userData.profilePicture && renderAvatarWithRing()}
        <Text style={styles.successTitle}>{userData.firstName} {userData.lastName}</Text>
        <Text style={styles.successSubtitle}>📱 {userData.phone}</Text>
        <Text style={styles.successSubtitle}>🎂 {userData.dob}</Text>
        <Text style={styles.successSubtitle}>🚻 {userData.gender}</Text>
        <Text style={styles.successSubtitle}>🎯 Intent: {userData.intent}</Text>

        {/* Mood/Status Changer */}
        <View style={{ flexDirection:"column", marginTop: 10, alignItems: 'center' }}>
          <Text>Status: </Text>
          <Picker
            selectedValue={userStatus}
            onValueChange={(itemValue) => setUserStatus(itemValue)}
            style={{ height: 55, width: 169 }}
          >
            {statuses.map(status => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.aiBox}>
        <Text style={styles.header}>🧠 Personality Insight</Text>
        <Text style={styles.aiInsight}>{generateAISummary()}</Text>
      </View>

      

      {/* Nearby users carousel */}
      <View style={{ width: '100%', paddingLeft: 10, marginVertical: 10 }}>
        <Text style={[styles.header, { fontSize: 18, marginBottom: 10 }]}>
          Here are some good matches for you nearby
        </Text>
        <FlatList
        
          horizontal
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#fff',
                padding: 10,
                marginRight: 15,
                borderRadius: 12,
                width: 160,
                elevation: 3,
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              {/* Online indicator */}
              <View style={{ position: 'relative', alignItems: 'center' }}>
                <Image
                  source={require('./assets/male.png')} // replace with real avatar
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
                {item.isOnline && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 5,
                      right: 10,
                      width: 15,
                      height: 15,
                      borderRadius: 7.5,
                      backgroundColor: 'limegreen',
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                  />
                )}
              </View>

              <Text style={{ fontWeight: 'bold', marginTop: 8 }}>{item.firstName}</Text>
              <Text style={{ color: '#666' }}>{item.distance}</Text>
              <Text style={{ color: '#666', fontStyle: 'italic' }}>{item.intent}</Text>

              {/* Voice Intro Play Button */}
              {/* Voice Intro Play/Stop Button */}
<TouchableOpacity
  onPress={() =>
    isPlaying
      ? handleStopAudio()
      : handlePlayAudio(item.voiceIntroUri)
  }
  style={{
    marginTop: 8,
    backgroundColor: isPlaying ? '#FF6B6B' : '#6C63FF',
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  }}
>
  <Text style={{ color: 'white' }}>
    {isPlaying ? '⏹️ Stop' : '🎧 Play Intro'}
  </Text>
</TouchableOpacity>



              {/* Suggested Action Chips */}
              <View
  style={{
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }}
>
  <TouchableOpacity
    
    
    style={{
      backgroundColor: '#FFD700',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
    }}
  >
    <Text style={{ color: 'black', fontWeight: 'bold' }}>👋 Say Hi</Text>
  </TouchableOpacity>
</View>
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        onPress={restartOnboarding}
        style={[styles.ctaButton, { marginTop: 30, alignSelf: 'center' }]}
      >
        <Text style={styles.ctaText}>🔄 Restart Onboarding</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
    );
  };

  const renderStep = () => {
    return (
      <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
        <SafeAreaView style={styles.safeContainer}>
          {(() => {
            switch (step) {
              case 1:
                return (
                  <LinearGradient colors={['#f5e3ff', '#e6e6ff']} style={styles.screen}>
                    <LottieView
                      ref={animationRef}
                      source={require('./assets/buildu_welcome.json')}
                      autoPlay
                      loop
                      style={styles.welcomeAnimation}
                    />
                    <Text style={styles.bigTitle}>Welcome to</Text>
                    <Text style={styles.brandText}>BuildU</Text>
                    <Text style={styles.subtext}>
                      Your journey to connect, discover & grow starts here 🌍
                    </Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={onLetsGetStartedPress}>
                      <Text style={styles.ctaText}>Let's Get Started</Text>
                    </TouchableOpacity>
                    <Modal
  animationType="fade"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalBackground}>
    <View style={styles.modalContent}>
      <Text style={styles.header}>Terms & Conditions</Text>
      <ScrollView style={{ maxHeight: 300 }}>
        <Text style={styles.modalText}>
          To provide you the best personalized experience, BuildU requires the following permissions:
          {'\n'}• Microphone: To enable voice-based onboarding and interaction.
          {'\n'}• Camera: To allow profile picture uploads.
          {'\n'}• Location: To find and connect with users nearby (100 km range).
          {'\n'}• Notifications: To keep you updated with messages and events.
          {'\n'}• Storage Access: To let you upload images and save content.
          {'\n'}{'\n'}All data is encrypted and will not be shared without your consent.
        </Text>
      </ScrollView>

      {/* ✅ Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAgreedToCheckbox(!agreedToCheckbox)}
      >
        <View style={styles.checkbox}>
          {agreedToCheckbox && <View style={styles.checkboxChecked} />}
        </View>
        <Text style={styles.checkboxLabel}>I have read and accept the Terms & Conditions</Text>
      </TouchableOpacity>

      {/* Continue Button */}
      <Pressable
        style={[
          styles.agreeBtn,
          { backgroundColor: agreedToCheckbox ? '#6C63FF' : '#ccc' },
        ]}
        onPress={handleAgreeAndContinue}
        disabled={!agreedToCheckbox}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          I Agree and Continue
        </Text>
      </Pressable>

      <Pressable onPress={() => setModalVisible(false)}>
        <Text style={{ marginTop: 10, color: '#6C63FF' }}>Cancel</Text>
      </Pressable>
    </View>
  </View>
</Modal>
                  </LinearGradient>
                );
              case 2:
                const validateStep2Data = () => {
  const { firstName, lastName, phone, dob, gender } = userData;
  const phoneRegex = /^[0-9]{10}$/;

  if (!firstName.trim() || !lastName.trim()) {
    Alert.alert('Missing Name', 'Please enter both first and last name.');
    return false;
  }

  if (!phoneRegex.test(phone)) {
    Alert.alert('Invalid Phone', 'Phone number must be exactly 10 digits.');
    return false;
  }

  if (!dob) {
    Alert.alert('Missing DOB', 'Please select your Date of Birth.');
    return false;
  }

  if (!gender) {
    Alert.alert('Missing Gender', 'Please select your gender.');
    return false;
  }

  return true;
};

                return (
                  <ScrollView style={{ padding: 30 }}>
      <Text style={styles.header}>Tell us about yourself</Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
        }}
        placeholder="First Name"
        value={userData.firstName}
        onChangeText={(text) => handleNameChange('firstName', text)}
      />

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
        }}
        placeholder="Last Name"
        value={userData.lastName}
        onChangeText={(text) => handleNameChange('lastName', text)}
      />

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
        }}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        maxLength={10}
        value={userData.phone}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
          handleInputChange('phone', cleaned);
        }}
      />

      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          padding: 12,
          marginBottom: 15,
        }}
      >
        <Text>{userData.dob ? `DOB: ${userData.dob}` : 'Select Date of Birth'}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          minimumDate={new Date(1900, 0, 1)}  
          maximumDate={new Date(
      new Date().getFullYear() - 18,
      new Date().getMonth(),
      new Date().getDate()
    )}
          onChange={handleDateChange}
        />
      )}

      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Select Gender</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        {['Male', 'Female', 'Other'].map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => handleInputChange('gender', g)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 20,
              backgroundColor: userData.gender === g ? '#6C63FF' : '#eee',
            }}
          >
            <Text style={{ color: userData.gender === g ? 'white' : '#000' }}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Next"
        onPress={() => {
          if (validateStep2Data()) {
            setStep(3);
          }
        }}
      />

      <View style={{ marginTop: 10 }}>
        <Button title="Back" onPress={goBack} color="#aaa" />
      </View>
    </ScrollView>
                );
              case 3:
                return (
                  <ScrollView style={styles.screen}>
                    <Text style={styles.header}>What brings you to BuildU?</Text>
                    {['Finding a partner', 'Business Communication', 'Exploring Now', 'Catch a Friend'].map(
                      (item) => (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.intentOption,
                            userData.intent === item && styles.genderSelected,
                          ]}
                          onPress={() => handleInputChange('intent', item)}
                        >
                          <Text style={{ color: userData.intent === item ? 'white' : '#000' }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                    <Button title="Next" onPress={() => setStep(4)} />
                    <Button title="Back" onPress={goBack} color="#aaa" />
                  </ScrollView>
                );
              case 4:
                return renderQuestionnaire();
              case 5:
                return renderProfileUpload();
              case 6:
                return renderDashboardLoader();
              case 7:
              return renderDashboardScreen();
              default:
                return null;
            }
          })()}
        </SafeAreaView>
      </Animated.View>
    );
  };

  return <View style={styles.full}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  safeContainer: { flex: 1 },
  animatedContainer: { flex: 1 },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  welcomeAnimation: { width: 250, height: 250, alignSelf: 'center' },
  bigTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },aiBox: {
  backgroundColor: '#f4f1ff',
  borderRadius: 12,
  padding: 20,
  marginTop: 10,
  width: '100%',
  shadowColor: '#6C63FF',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 5,
},
   full: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 40, backgroundColor: '#fff' },
  ctaButton: { backgroundColor: '#6C63FF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, marginTop: 20, alignSelf: 'center' },
  ctaText: { color: 'white', fontSize: 18, fontWeight: '700' },
  successTitle: { fontSize: 26, fontWeight: '700', marginTop: 20, color: '#4b0082', textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: '#777', marginTop: 10, textAlign: 'center' },
  aiBox: { backgroundColor: '#f4f1ff', borderRadius: 12, padding: 20, marginTop: 10, width: '100%', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  aiInsight: { fontSize: 16, color: '#333', textAlign: 'center', fontStyle: 'italic', marginTop: 10, lineHeight: 22 },
  avatarPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  ringWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    resizeMode: 'cover',
  },
  avatarLabel: {
    color: '#6C63FF',
    fontSize: 14,
    marginTop: 6,
  },
aiInsight: {
  fontSize: 16,
  color: '#333',
  textAlign: 'center',
  fontStyle: 'italic',
  marginTop: 10,
  lineHeight: 22,
},
avatarPreviewContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
  marginTop: 10,
},
headerButtonsContainer: {
  position: 'absolute',
  top: 10,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  zIndex: 1000,  // make sure it’s above other UI
},
headerButtonLeft: {
  padding: 10,
},
headerButtonRight: {
  padding: 10,
},
headerButtonText: {
  color: '#6C63FF',
  fontWeight: 'bold',
  fontSize: 16,
},


  brandText: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 10,
    color: '#6C63FF',
  },
  subtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    color: '#555',
  },
  ctaButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 5,
    borderRadius: 30,
    marginHorizontal: 50,
    marginTop: 30,
  },
  ctaText: { color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
  successProfileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#6C63FF',
  },
  checkboxContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 15,
  marginBottom: 10,
},
checkbox: {
  width: 22,
  height: 22,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: '#6C63FF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 10,
},
checkboxChecked: {
  width: 12,
  height: 12,
  backgroundColor: '#6C63FF',
  borderRadius: 2,
},
checkboxLabel: {
  flex: 1,
  fontSize: 14,
  color: '#444',
},

  profileFrame: {
    marginTop: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderRadius: 60,
    backgroundColor: 'white',
    padding: 4,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 20,
    color: '#4b0082',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  successTagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontSize: 16,
  },
  label: {
    marginTop: 15,
    fontWeight: '600',
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#888',
  },
  genderSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  optionCardSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#4b0082',
  },
  optionImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  optionText: {
    color: '#333',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  optionsContainer: {
    marginTop: 15,
    
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
  },
  profilePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    alignSelf: 'center',
  },
  ctaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '85%',
    maxHeight: '80%',
  },
  modalText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
  },
  agreeBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  intentOption: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 15,
    borderRadius: 15,
    marginVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
});

