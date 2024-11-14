import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, Text, Image, Alert, Modal, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import moment from 'moment';
import * as Location from 'expo-location';
import { useNavigation, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import { getProfileInfo } from '../services/authServices';
import RemarksInput from '../components/RemarkInput';
import HeaderComponent from './HeaderComponent';
import { getEmpAttendance, postCheckIn } from '../services/productServices';
import Loader from '../components/old_components/Loader';  // Assuming you have a Loader component
import SuccessModal from '../components/SuccessModal';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #fff;
`;

const Label = styled.Text`
  font-size: 18px;
  margin-bottom: 10px;
`;

const AttendanceButton = styled.View`
  flex-direction: row;
  justify-content: space-evenly;
`;

const AttendanceCard = styled.View`
  border: 1px solid #007bff;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
`;

const Button = styled.TouchableOpacity`
  background-color: ${(props) =>
    props.disabled ? (props.type === 'checkin' ? '#0EAE10' : '#D12E2E') : '#ffffff'};
  padding: 10px;
  border-radius: 10px;
  align-items: center;
  flex-direction: row;
  border: 1px solid #007bff;
`;

const ButtonText = styled.Text`
  color: ${(props) => (props.disabled ? '#ffffff' : '#000000')};
  font-size: 12px;
`;

const CheckStatusButton = styled.TouchableOpacity`
  background-color: #007bff;
  padding: 10px;
  margin-top: 20px;
  border-radius: 10px;
  align-items: center;
`;

const CheckStatusText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const RemarkModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
`;

const RemarkModalContent = styled.View`
  width: 80%;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  /* align-items: center; */
`;

const RemarkModalButton = styled.TouchableOpacity`
  background-color: #007bff;
  padding: 10px;
  margin-top: 20px;
  border-radius: 10px;
  align-items: center;
`;

const EmpDataContainer = styled.View`
  flex-direction: row;
  margin-bottom: 20px;
`;

const EmpImageContainer = styled.View`
  justify-content: center;
  align-items: center;
  background-color: #a970ff;
  height: 60px;
  width: 60px;
  margin-right: 10px;
  border-radius: 30px;
`;

const Value = styled.Text`
  font-size: 16px;
  margin-bottom: 10px;
`;

const AddAttendance = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [attendance, setAttendance] = useState({});
  const [attData, setAttData] = useState([]);
  const [employeeData, setEmployeeData] = useState({
    empId: 'Employee_Id',
    designation: 'Position',
  });
  const [checkedIn, setCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRemarkModalVisible, setIsRemarkModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false); // State for SuccessModal

  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const date = moment().format('DD-MM-YYYY');
    let time = moment().format('hh:mm A');

    if (moment().isBetween(moment().startOf('day').add(12, 'hours').add(1, 'minute'), moment().startOf('day').add(13, 'hours'))) {
      time = time.replace(/^12/, '00');
    }

    setCurrentDate(date);
    setCurrentTime(time);

    getProfileInfo().then((res) => {
      setEmployeeData(res.data);
      setIsLoading(false); // Set loading false when data is fetched
    });
  }, [refreshKey]);

  useFocusEffect(
    useCallback(() => {
      const data = {
        emp_id: employeeData?.emp_data,
        month: moment().format('MM'),
        year: moment().format('YYYY'),
      };
      fetchAttendanceDetails(data);
    }, [employeeData, refreshKey])
  );

  const fetchAttendanceDetails = (data) => {
    setIsLoading(true); // Set loading true while fetching data
    getEmpAttendance(data).then((res) => {
      setAttData(res.data);
      processAttendanceData(res.data);
      setIsLoading(false); // Set loading false when data is fetched
    });
  };

  const processAttendanceData = (data) => {
    const todayAttendance = data.find((item) => item.a_date === currentDate);

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

  const handleError = (error, input) => {
    setErrors(prevState => ({...prevState, [input]: error}));
  };

  const handleCheck = async (data) => {
    setIsLoading(true); // Show loader when check-in/check-out action starts
    const { status } = await Location.requestForegroundPermissionsAsync();
  
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to check.');
      setIsLoading(false); // Hide loader if permission is denied
      return;
    }
  
    if (data === 'UPDATE' && !remark) {
      setIsLoading(false); // Hide loader if opening remark modal
      setIsRemarkModalVisible(true);
      return;
    }
  
    const location = await Location.getCurrentPositionAsync({});
    const todayAttendance = attData.find((item) => item.a_date === currentDate);
    const attendanceId = todayAttendance ? todayAttendance.id : null;
  
    const checkPayload = {
      emp_id: employeeData?.emp_data?.emp_id,
      call_mode: data,
      time: currentTime,
      geo_type: data === 'ADD' ? 'I' : 'O',
      a_date: currentDate,
      latitude_id: `${location?.coords?.latitude}`,
      longitude_id: `${location?.coords?.longitude}`,
      remarks: data === 'ADD' ? 'Check-in from Mobile' : remark,
      id: attendanceId,
    };
  
    postCheckIn(checkPayload)
      .then(() => {
        setCheckedIn(data === 'ADD');
        setStartTime(currentTime);
        setRefreshKey((prevKey) => prevKey + 1);
        setIsSuccessModalVisible(true); // Show SuccessModal on success
        if (data === 'UPDATE') setRemark('');
      })
      .catch(() => {
        Alert.alert('Check Failure', 'Failed to Check.');
      })
      .finally(() => {
        setIsLoading(false); // Hide loader after check-in/check-out completes
      });
  };
  
  const handleRemarkSubmit = () => {
    if (!remark.trim()) {
      handleError('Remark cannot be empty', 'remarks');
    } else {
      setIsRemarkModalVisible(false);
      handleCheck('UPDATE'); // Trigger check-out action
    }
  };
  

  const closeSuccessModal = () => {
    setIsSuccessModalVisible(false);
  };

  return (
    <>
      <HeaderComponent headerTitle="My Attendance" onBackPress={() => navigation.goBack()} />
      <Container>
        {isLoading ? (
          <Loader visible={isLoading} />
        ) : (
          <>
            <Label>Date: {currentDate}</Label>
            <Label>Time: {currentTime}</Label>
            <EmpDataContainer>
              <EmpImageContainer>
                <Image
                  source={{ uri: `${employeeData?.image}` }}
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                />
              </EmpImageContainer>
              <View>
                <Value>Emp-Id: {employeeData?.emp_data?.emp_id}</Value>
                <Value>Designation: {employeeData?.emp_data?.grade_name}</Value>
              </View>
            </EmpDataContainer>
            <AttendanceCard>
              <Text style={{ fontWeight: 'bold', alignItems: 'center', marginBottom: 10 }}>Attendance</Text>

              {attendance && attendance.start_time === null ? (
                <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
                  On Leave or Holiday
                </Text>
              ) : (
                <AttendanceButton>
                  <Button
                    onPress={() => handleCheck('ADD')}
                    checked={checkedIn}
                    type="checkin"
                    disabled={checkedIn || attendance.geo_status === 'O'}
                  >
                    <Entypo
                      name="location-pin"
                      size={24}
                      color={checkedIn || attendance.geo_status === 'O' ? 'white' : 'black'}
                    />
                    <ButtonText disabled={checkedIn || attendance.geo_status === 'O'}>
                      {checkedIn || attendance.geo_status === 'O'
                        ? `Checked-In at ${attendance.start_time}`
                        : 'CHECK IN'}
                    </ButtonText>
                  </Button>
                  {attendance.start_time && (
                    <Button
                      onPress={() => setIsRemarkModalVisible(true)}
                      checked={checkedIn}
                      type="checkout"
                      disabled={!checkedIn || attendance.geo_status !== 'I'}
                    >
                      <Feather
                        name="log-out"
                        size={20}
                        color={!checkedIn || attendance.geo_status !== 'I' ? 'white' : 'black'}
                      />
                      <ButtonText disabled={!checkedIn || attendance.geo_status !== 'I'}>
                        {attendance.geo_status === 'I'
                          ? 'CHECK OUT'
                          : `Checked-Out at ${attendance.end_time}`}
                      </ButtonText>
                    </Button>
                  )}
                </AttendanceButton>
              )}
            </AttendanceCard>

            <Modal transparent={true} visible={isRemarkModalVisible} animationType="slide">
              <RemarkModalContainer>
                <RemarkModalContent>
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 1,
                    }}
                    onPress={() => setIsRemarkModalVisible(false)}
                  >
                    <Entypo name="cross" size={24} color="black" />
                  </TouchableOpacity>

                  {/* <Text>Enter a remark for check-out:</Text> */}
                  <RemarksInput
                    remark={remark}
                    setRemark={setRemark}
                    error={errors.remarks}
                    placeholder="Enter a remark for check-out"
                  />

                  <RemarkModalButton onPress={handleRemarkSubmit}>
                    <CheckStatusText>Submit</CheckStatusText>
                  </RemarkModalButton>
                </RemarkModalContent>
              </RemarkModalContainer>
            </Modal>


            <SuccessModal
              visible={isSuccessModalVisible}
              onClose={closeSuccessModal}
              message="Action successfully completed."
            />

            <CheckStatusButton onPress={() => router.push({ pathname: 'AttendanceStatusDisplay', params: employeeData?.emp_data })}>
              <CheckStatusText>Check Status</CheckStatusText>
            </CheckStatusButton>
          </>
        )}
      </Container>
    </>
  );
};

export default AddAttendance;