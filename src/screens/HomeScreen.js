import React, { useContext, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StatusBar, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StyleSheet,
  SafeAreaView,
  Platform,
  RefreshControl,
  Animated,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../../context/AppContext';
import { getCompanyInfo, getEmployeeInfo, getProfileInfo } from '../services/authServices';
import { useRouter } from "expo-router";
import Loader from '../components/old_components/Loader';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import moment from 'moment';
import { useLayoutEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  MaterialIcons, 
  FontAwesome5, 
  Ionicons, 
  Feather, 
  MaterialCommunityIcons,
  AntDesign
} from '@expo/vector-icons';
import { getEmpAttendance, getEvents, postCheckIn } from '../services/productServices';
import Modal from 'react-native-modal';
import RemarksInput from '../components/RemarkInput';
import SuccessModal from '../components/SuccessModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HomePage = ({ navigation }) => {
  const router = useRouter();
  const { profile, logout, userToken,setReload,pisLoading } = useContext(AppContext);
  const [loading, setIsLoading] = useState(false);
  // const [profile, setProfile] = useState({});
  const [company, setCompany] = useState({});
  const [empId, setEmpId] = useState('');
  // const [empNId, setEmpNId] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Attendance related states
  const [employeeData, setEmployeeData] = useState({});
  const [currentDate, setCurrentDate] = useState(moment().format('DD-MM-YYYY'));
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [attendance, setAttendance] = useState({});
  const [attData, setAttData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState({});
  const [isRemarkModalVisible, setIsRemarkModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  // const [previousDayUnchecked, setPreviousDayUnchecked] = useState(false);
  
  // Active events
  const [eventData, setEventData] = useState([]);
const [filteredEvents, setFilteredEvents] = useState([]);
const [eventLoading, setEventLoading] = useState(true);
  
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(()=>{
    setReload(true)
  },[])

  useLayoutEffect(() => {
    if (navigation) {
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [navigation]);

  useEffect(() => {
    fetchEvents();
  }, [empId]);

  const setdatatime = async () => {
  const now = moment();
  let time = now.format('hh:mm A');
  
  // Check if current time is between 12:00 PM and 1:00 PM (inclusive of 12:00 PM)
  if (now.isBetween(
    moment().startOf('day').add(12, 'hours'),  // 12:00 PM
    moment().startOf('day').add(13, 'hours'),  // 1:00 PM
    null, '[]'  // '[]' includes both start and end boundaries
  )) {
    // Replace "12" with "00" but keep "PM"
    time = time.replace(/^12/, '00');
  }
  
  return time;
};



  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch profile data
       const profileData = profile;
      
      // Validate and set profile data
      if (!profileData) throw new Error("No profile data received");
      
      try {
        await AsyncStorage.setItem('profile', JSON.stringify(profileData));
        if (profileData?.emp_data?.name) {
          await AsyncStorage.setItem('profilename', profileData.emp_data.name);
        }
      } catch (storageError) {
        console.error("AsyncStorage error:", storageError);
      }

      // Set employee ID if available
      const employeeId = profileData?.emp_data?.emp_id;
      if (employeeId) {
        setEmpId(employeeId);
      }

      // Set employee data and manager status
      setEmployeeData(profileData);
      setIsManager(!!profileData.user_group?.is_manager);
      
      // Check birthday
      if (profileData?.emp_data?.dob) {
        checkIfBirthday(profileData.emp_data.dob);
      }

      // Fetch company info
      const companyRes = await getCompanyInfo();
      if (companyRes.data) {
        setCompany(companyRes.data);
      }

      // Set current date and time
      const date = moment().format('DD-MM-YYYY');
      let time = moment().format('hh:mm A');

      // Handle noon hour conversion
      if (moment().isBetween(
        moment().startOf('day').add(12, 'hours').add(1, 'minute'), 
        moment().startOf('day').add(13, 'hours')
      )) {
        time = time.replace(/^12/, '00');
      }

      setCurrentDate(date);
      setCurrentTimeStr(time);
      
      // Fetch attendance data - FIXED emp_id reference here
      if (employeeId) {
        const data = {
          emp_id: employeeId,  // Using the extracted employeeId
          month: moment().format('MM'),
          year: moment().format('YYYY'),
        };
        fetchAttendanceDetails(data);
      }

    } catch (error) {
      console.error("Error in fetchData:", error);
      // Optional: Show error to user
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };


  const fetchEvents = async () => {
    try {
      setEventLoading(true);
      
      // First fetch: Get all events without emp_id filter (company-wide and other public events)
      const paramsAllEvents = {
        date_range: 'D0', // Today's events
        event_type: '', // All types
        // No emp_id parameter
      };
      const resAllEvents = await getEvents(paramsAllEvents);
      
      // Filter events to only include specific types
      const filteredEventTypes = ['C', 'B', 'A', 'M', 'O']; // Company, Birthday, Announcement, Meeting, Other
      const filteredEvents = resAllEvents.data.filter(event => 
        filteredEventTypes.includes(event.event_type)
      );
  
      // Second fetch: Try with empId if available (personalized events)
      let personalEvents = [];
      if (empId) {
        const paramsWithEmpId = {
          date_range: 'D0',
          event_type: '',
          emp_id: empId
        };
        const resWithEmpId = await getEvents(paramsWithEmpId);
        personalEvents = resWithEmpId.data;
      }
  
      // Combine both results, removing duplicates
      const combinedEvents = [...filteredEvents, ...personalEvents].reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
  
      setEventData(combinedEvents);
      setFilteredEvents(combinedEvents);
    } catch (error) {
      console.error("Fetch Event Error:", error?.response?.data);
      // Fallback: Try to at least show company events
      try {
        const paramsCompanyEvents = {
          date_range: 'D0',
          event_type: 'C'
        };
        const resCompanyEvents = await getEvents(paramsCompanyEvents);
        setEventData(resCompanyEvents.data);
        setFilteredEvents(resCompanyEvents.data);
      } catch (fallbackError) {
        console.error("Fallback Fetch Error:", fallbackError);
        setEventData([]);
        setFilteredEvents([]);
      }
    } finally {
      setEventLoading(false);
    }
  };

  const handlePressApproveLeave = () => {  
    router.push({
      pathname: 'ApproveLeaves',
    });
  };

  const fetchAttendanceDetails = (data) => {
    setIsLoading(true);
    getEmpAttendance(data).then((res) => {
      setAttData(res.data);
      processAttendanceData(res.data);
    });
  };

  const processAttendanceData = (data) => {
    // const todayAttendance = data.find((item) => item.a_date === currentDate);
    const todayAttendance = data.find((item) => 
    item.a_date === currentDate && item.attendance_type !== "L"
  );

    if (todayAttendance) {
      setCheckedIn(todayAttendance.end_time === null);
      setStartTime(todayAttendance.start_time);
      setAttendance(todayAttendance);
    } else {
      setCheckedIn(false);
      setStartTime(null);
      setAttendance({});
    }
  };

  // Function to check if today is the employee's birthday
  const checkIfBirthday = (dobString) => {
    try {
      // Parse the DOB string in "24-Apr-2001" format
      const dobParts = dobString.split('-');
      if (dobParts.length !== 3) return;

      const today = new Date();
      
      // Convert month abbreviation to month number (0-11)
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const dobDay = parseInt(dobParts[0], 10);
      const dobMonth = months[dobParts[1]];
      
      // Check if today's date and month match the DOB
      if (today.getDate() === dobDay && today.getMonth() === dobMonth) {
        setIsBirthday(true);
        // Start animation for birthday message
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }).start();
      } else {
        setIsBirthday(false);
      }
    } catch (error) {
      console.error("Error checking birthday:", error);
      setIsBirthday(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set greeting based on time of day
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour < 12) {
        setGreeting('Good Morning');
      } else if (currentHour < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };
    
    updateGreeting();
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateGreeting();
    }, 60000);
    
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      if (!isConnected && state.isConnected) {
        fetchData();
      }
      setIsConnected(state.isConnected);
    });
    
    return () => {
      clearInterval(interval);
      netInfoUnsubscribe();
    };
  }, [isConnected,profile]);

  useFocusEffect(
  useCallback(() => {
    if (employeeData?.emp_data) {
      const data = {
        emp_id: employeeData.emp_data, // Use the correct emp_id path
        month: moment().format('MM'),
        year: moment().format('YYYY'),
      };
      
      // Fetch attendance details and process them
      getEmpAttendance(data).then((res) => {
        setAttData(res.data);
        const todayAttendance = res.data.find((item) => item.a_date === currentDate);
        
        if (todayAttendance) {
          setCheckedIn(todayAttendance.end_time === null);
          setStartTime(todayAttendance.start_time);
          setAttendance(todayAttendance);
        } else {
          setCheckedIn(false);
          setStartTime(null);
          setAttendance({});
        }
      });
    }
  }, [employeeData, currentDate])
);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshKey((prevKey) => prevKey + 1);
    fetchData();
    setRefreshing(false);
  };

  const handleError = (error, input) => {
    setErrors(prevState => ({...prevState, [input]: error}));
  };

  const handleCheck = async (data) => {
    
    const { status } = await Location.requestForegroundPermissionsAsync();
  
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to check.');
      setIsLoading(false);
      return;
    }
  
    let location = null;
  
    try {
      location = await Location.getCurrentPositionAsync({});
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch location. Please try again.');
      setIsLoading(false);
      return;
    }
  
    
  
    const todayAttendance = attData.find((item) => item.a_date === currentDate);
    const attendanceId = todayAttendance ? todayAttendance.id : null;
    const time = await setdatatime();
    console.log("Emp Id==",empId);
    const checkPayload = {
      emp_id: empId,
      call_mode: data,
      time: time,
      geo_type: data === 'ADD' ? 'I' : 'O',
      a_date: currentDate,
      latitude_id: `${location?.coords?.latitude}`,
      longitude_id: `${location?.coords?.longitude}`,
      remarks: data === 'ADD' ? 'Check-in from Mobile' : remark,
      id: attendanceId,
    };
  
    try {
    await postCheckIn(checkPayload);
    
    // Refresh attendance data immediately after successful check-in/out
    const refreshData = {
      emp_id: employeeData?.emp_data,
      month: moment().format('MM'),
      year: moment().format('YYYY'),
    };
    const res = await getEmpAttendance(refreshData);
    
    // Update all relevant states
    setAttData(res.data);
    const todayAttendance = res.data.find((item) => item.a_date === currentDate);
    
    if (todayAttendance) {
      setCheckedIn(todayAttendance.end_time === null);
      setStartTime(todayAttendance.start_time);
      setAttendance(todayAttendance);
    } else {
      setCheckedIn(false);
      setStartTime(null);
      setAttendance({});
    }
    
    setRefreshKey((prevKey) => prevKey + 1);
    setIsSuccessModalVisible(true);
    if (data === 'UPDATE') setRemark('');
  } catch (error) {
    Alert.alert('Check Failure', 'Failed to Check.');
  } finally {
    setIsLoading(false);
  }
  };


  const handleCheckIn = () => {
    setIsLoading(true);
    handleCheck('ADD');
  };

  const handleCheckOut = () => {
    setIsRemarkModalVisible(true);
  };
  
  const handleRemarkSubmit = () => {
    if (!remark.trim()) {
      handleError('Remark cannot be empty', 'remarks');
    } else {
      setIsRemarkModalVisible(false);
      setIsLoading(true);
      handleCheck('UPDATE');
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
  };

  const handleEventPress = (event) => {
    router.push({
      pathname: 'EventDetails',
      params: {
        eventDetails: JSON.stringify(event)
      },
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine button states for check-in/out
  const isCheckInDisabled = checkedIn || attendance.geo_status === 'O' || !!attendance.start_time || !!attendance.start_time || 
                          (employeeData?.is_shift_applicable) || (attendance && attendance.start_time === null);
  const isCheckOutDisabled = !checkedIn || attendance.geo_status !== 'I' || !!attendance.end_time;

  

  const menuItems = [
    {
      id: 1,
      title: 'Attendance',
      icon: <FontAwesome5 name="user-clock" size={24} color="#a970ff" />,
      onPress: () => router.push('attendance')
    },
    {
      id: 2,
      title: 'ID Card',
      icon: <MaterialIcons name="contact-page" size={24} color="#a970ff" />,
      onPress: () => router.push('IdCard')
    },
    {
      id: 3,
      title: 'Leaves',
      icon: <Ionicons name="calendar-outline" size={24} color="#a970ff" />,
      onPress: () => router.push('leave')
    },
    ...(isManager ? [{
      id: 4,
      title: 'Approve Leave',
      icon: <Ionicons name="checkmark-done-circle-outline" size={24} color="#a970ff" />,
      onPress: () => handlePressApproveLeave()
    }] : []),
    {
      id: 5,
      title: 'Claims',
      icon: <MaterialIcons name="attach-money" size={24} color="#a970ff" />,
      onPress: () => router.push('ClaimScreen')
    },
    ...(isManager ? [{
      id: 6,
      title: 'Approve Claims',
      icon: <MaterialIcons name="monetization-on" size={24} color="#a970ff" />,
      onPress: () => router.push('ApproveClaim')
    }] : []),
    {
      id: 7,
      title: 'Holiday',
      icon: <FontAwesome5 name="umbrella-beach" size={24} color="#a970ff" />,
      onPress: () => router.push('HolidayList')
    },
    {
      id: 8,
      title: 'More',
      icon: <Feather name="more-horizontal" size={24} color="#a970ff" />,
      onPress: () => router.push('MoreScreen')
    }
  ];

  const getEventIcon = (eventType) => {
    switch(eventType) {
      case 'B': return 'cake';
      case 'A': return 'work';
      case 'C': return 'business';
      case 'M': return 'favorite';
      case 'P': return 'trending-up';
      case 'O': return 'event';
      default: return 'event';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#a970ff" />
      {loading && (
  <View style={styles.loaderContainer}>
    <Loader visible={true} />
  </View>
)}
      
      {/* Curved Header */}
      <View style={styles.headerContainer}>
      <LinearGradient 
    colors={['#a970ff', '#8a5bda']} 
    start={[0, 0]} 
    end={[1, 1]}
    style={styles.headerGradient}
  >
    <View style={styles.headerTop}>
      <View style={styles.headerTopContent}>
        <View style={styles.companySection}>
          {company.image ? (
            <Image 
              source={{ uri: company.image }} 
              style={styles.companyLogo} 
              resizeMode="contain"
            />
          ) : (
            <View style={styles.companyPlaceholder}>
              <MaterialIcons name="business" size={40} color="#fff" />
            </View>
          )}
          <Text style={styles.companyName}>
            {company.name || 'ATOMWALK'}
          </Text>
        </View>
      </View>
      
     
    </View>
    
    <View style={styles.welcomeSection}>
      <Text style={styles.greeting}>{greeting},</Text>
      <Text style={styles.userName} onPress={() => router.push('profile')}>
        {profile?.emp_data?.name ? `${profile?.emp_data?.name}` : 'Employee'}
      </Text>
    </View>
  </LinearGradient>
        
        {/* Time Card */}
        <View style={styles.timeCardContainer}>
        <LinearGradient
          colors={['#ffffff', '#f8f5ff']}
          style={styles.timeCard}
        >
          <View style={styles.timeCardContent}>
            <View style={styles.timeSection}>
              <Text style={styles.dateText}>
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
              <Text style={styles.timeText}>
                {formatTime(currentTime)}
              </Text>
            </View>
            <View style={styles.attendanceButtons}>
            <TouchableOpacity 
              style={[
                styles.attendanceButton, 
                (checkedIn || isCheckInDisabled) ? styles.disabledButton : styles.checkInButton
              ]}
              onPress={handleCheckIn}
              disabled={checkedIn || isCheckInDisabled}
            >
              <MaterialCommunityIcons name="login" size={20} color={checkedIn || isCheckInDisabled ? "#888" : "#fff"} />
              <Text style={[styles.attendanceButtonText, (checkedIn || isCheckInDisabled) ? styles.disabledButtonText : {}]}>
                {employeeData?.is_shift_applicable 
                  ? "Complete yesterday's checkout first"
                  : (checkedIn || isCheckInDisabled) 
                    ? `Checked In`
                    : 'Check In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.attendanceButton, 
                !checkedIn ? styles.disabledButton : styles.checkOutButton
              ]}
              onPress={handleCheckOut}
              disabled={!checkedIn || isCheckOutDisabled}
            >
              <MaterialCommunityIcons name="logout" size={20} color={!checkedIn || isCheckOutDisabled ? "#888" : "#fff"} />
              <Text style={[styles.attendanceButtonText, (!checkedIn || isCheckOutDisabled) ? styles.disabledButtonText : {}]}>
                {(checkedIn || isCheckInDisabled) && (!checkedIn && isCheckOutDisabled) 
                    ? `Checked Out`
                    : 'Check Out'}
              </Text>
            </TouchableOpacity>
            </View>
            {checkedIn && startTime && (
              <Text style={styles.checkinTimeText}>
                Checked in at {startTime}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#a970ff"]} />
        }
      >
        {/* Birthday and Events Cards Slider */}
        {(isBirthday || filteredEvents.length > 0) && (
  <View style={styles.eventsContainer}>
    <Text style={styles.sectionTitle}>Today's Events</Text>
    {eventLoading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#a970ff" />
      </View>
    ) : (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[
          ...(isBirthday ? [{ id: 'birthday', type: 'birthday' }] : []),
          ...filteredEvents.map(event => ({ 
            ...event, 
            type: 'event',
            title: event.event_name,
            description: event.event_description,
            time: `${event.event_start_time}${event.event_end_time ? ` - ${event.event_end_time}` : ''}`,
            icon: getEventIcon(event.event_type)
          }))
        ]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => 
          item.type === 'birthday' ? (
            <Animated.View style={[styles.birthdayCard, { opacity: fadeAnim }]}>
              <LinearGradient
                colors={['#a970ff', '#8a5bda']}
                start={[0, 0]}
                end={[1, 1]}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16
                }}
              >
                <View style={styles.birthdayIconContainer}>
                  <MaterialCommunityIcons name="cake-variant" size={28} color="#fff" />
                </View>
                <View style={styles.birthdayTextContainer}>
                  <Text style={styles.birthdayText}>Happy Birthday!</Text>
                  <Text style={styles.birthdaySubtext}>
                    Wishing you a fantastic day filled with joy and celebration.
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : (
            <TouchableOpacity onPress={() => handleEventPress(item)}>
              <View style={styles.eventCard}>
                <LinearGradient
                  colors={['#a970ff', '#8a5bda']}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16
                  }}
                >
                  <View style={styles.eventIconContainer}>
                    <MaterialIcons name={item.icon} size={28} color="#fff" />
                  </View>
                  <View style={styles.eventTextContainer}>
                    <Text style={styles.eventTitle}>{item.event_text}</Text>
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {item.event_type_display}
                    </Text>
                    <Text style={styles.eventTime}>{item.emp_name}</Text>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )
        }
        contentContainerStyle={styles.cardsSlider}
      />
    )}
  </View>
)}

        {/* Quick Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Menu</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  {item.icon}
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
      </ScrollView>

      {/* Remark Modal for checkout */}
      <Modal transparent visible={isRemarkModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Check Out Remarks</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsRemarkModalVisible(false)}
              >
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <RemarksInput
              remark={remark}
              label= {false}
              setRemark={setRemark}
              error={errors.remarks}
              placeholder="Please enter you check out remark"
            />

            <TouchableOpacity 
              style={styles.modalSubmitButton}
              onPress={handleRemarkSubmit}
            >
              <Text style={styles.modalSubmitText}>Submit Check Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        
      <SuccessModal
        visible={isSuccessModalVisible}
        onClose={closeSuccessModal}
        message="Attendance recorded successfully"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f5ff',
  },
  headerContainer: {
    overflow: 'visible',
    zIndex: 10,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: Platform.OS === 'android' ? 999 : 0,
    // Remove the pointerEvents from here - handle it at the component level
},
headerGradient: {
  paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
  paddingHorizontal: 20,
  paddingBottom: 60, // Extra padding for the curved effect
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
},
headerTop: {
  paddingVertical: 10,
  // marginTop: -20, // Added negative margin to move content up
},
headerTopContent: {
  justifyContent: 'center',
  alignItems: 'center',
},
companySection: {
  alignItems: 'center',
  justifyContent: 'center',
  // marginBottom: 20,
},
companyLogo: {
  width: width * 0.25,
  height: width * 0.25,
  borderRadius: width * 0.125,
  backgroundColor: '#fff',
  marginBottom: 12,
},
companyPlaceholder: {
  width: width * 0.25,
  height: width * 0.25,
  borderRadius: width * 0.125,
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
},
companyName: {
  color: '#fff',
  fontSize: width * 0.06,
  fontWeight: 'bold',
  textAlign: 'center',
},
  profileButton: {
    width: width * 0.11,
    height: width * 0.11,
    borderRadius: width * 0.055,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.055,
  },

  welcomeSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  userName: {
    color: '#fff',
    fontSize: width * 0.065,
    fontWeight: 'bold',
    marginTop: 3,
  },
  timeCardContainer: {
    paddingHorizontal: 20,
    marginTop: -40, // Pull up to overlap with the header
  },
  timeCard: {
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#a970ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  timeCardContent: {
    padding: 16,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: width * 0.036,
    color: '#555',
    fontWeight: '500',
  },
  timeText: {
    fontSize: width * 0.04,
    color: '#333',
    fontWeight: 'bold',
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  checkInButton: {
    backgroundColor: '#a970ff',
  },
  checkOutButton: {
    backgroundColor: '#a970ff',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    elevation: 0,
  },
  attendanceButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: width * 0.035,
  },
  disabledButtonText: {
    color: '#888',
  },
  checkinTimeText: {
    textAlign: 'center',
    color: '#a970ff',
    fontSize: width * 0.035,
    fontWeight: '500',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  cardsSlider: {
    paddingRight: 20,
  },
  birthdayCard: {
    width: width * 0.75,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#a970ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  birthdayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  
  birthdayIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  birthdayTextContainer: {
    flex: 1,
  },
  birthdayText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  birthdaySubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: width * 0.035,
  },
  eventCard: {
    width: width * 0.75,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#a970ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  eventGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // height: '100%'  // Add this property here
  },
  eventIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventTitle: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  eventDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: width * 0.035,
  },
  eventTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: width * 0.035,
  },

  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 5,
  },
  loadingContainer: {
    height: 120, // Match your card height
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: width * 0.44,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#a970ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(169, 112, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemText: {
    fontSize: width * 0.036,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffebee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  offlineText: {
    color: '#f44336',
    marginLeft: 8,
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Remove solid background
    overflow: 'hidden', // Important for gradient edges
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10, // Android
    zIndex: 1, // Ensure content stays above gradient
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalSubmitButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalSubmitText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});

export default HomePage;