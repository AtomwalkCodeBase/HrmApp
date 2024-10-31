import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, Text, Image, Alert } from 'react-native';
import styled from 'styled-components/native';
import moment from 'moment';
import * as Location from 'expo-location';
import { useNavigation, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import { getProfileInfo } from '../services/authServices';
import RemarksTextArea from '../components/RemarkInput';
import HeaderComponent from './HeaderComponent';
import { getEmpAttendance, postCheckIn } from '../services/productServices';

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

const AttendanceCard = styled.View`
  border: 1px solid #007bff;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
`;

const CheckStatusText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const RemarkInput = styled.TextInput`
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 10px;
  border-radius: 10px;
  font-size: 16px;
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
  const [hasPermission, setHasPermission] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

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
    getEmpAttendance(data).then((res) => {
      setAttData(res.data);
      processAttendanceData(res.data);
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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to check.');
      return;
    }

    if (data === 'UPDATE' && !remark) {
      if (!remark) {
        handleError('Please fill the remark field', 'remarks');
        return;
      }
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
      .then((res) => {
        Alert.alert('Action Successful', 'Action successfully completed.');
        setCheckedIn(data === 'ADD');
        setStartTime(currentTime);
        setRefreshKey((prevKey) => prevKey + 1);
        if (data === 'UPDATE') setRemark('');
      })
      .catch((error) => {
        Alert.alert('Check Failure', 'Failed to Check.');
      });
  };

  const handlePressStatus = () => {
    router.push({
      pathname: 'AttendanceStatusDisplay',
      params: employeeData?.emp_data,
    });
  };

  return (
    <>
      <HeaderComponent headerTitle="My Attendance" onBackPress={() => navigation.goBack()} />
      <Container>
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
                  {checkedIn || attendance.geo_status === 'O' ? `Checked-In at ${attendance.start_time}` : 'CHECK IN'}
                </ButtonText>
              </Button>
              {attendance.start_time && (
                <Button
                  onPress={() => handleCheck('UPDATE')}
                  checked={checkedIn}
                  type="checkout"
                  disabled={!checkedIn || (attendance.geo_status !== 'I')}
                >
                  <Feather
                    name="log-out"
                    size={20}
                    color={!checkedIn || (attendance.geo_status !== 'I') ? 'white' : 'black'}
                  />
                  <ButtonText disabled={!checkedIn || (attendance.geo_status !== 'I')}>
                    {attendance.geo_status === 'I' ? 'CHECK OUT' : `Checked-Out at ${attendance.end_time}`}
                  </ButtonText>
                </Button>
              )}
            </AttendanceButton>
          )}
        </AttendanceCard>

        {attendance.geo_status === 'I' && (
          <>
            <Label>Remarks</Label>
            <RemarkInput
              placeholder="Enter Remarks"
              value={remark}
              onChangeText={(text) => setRemark(text)}
            />
          </>
        )}

        <CheckStatusButton onPress={handlePressStatus}>
          <CheckStatusText>Check Status</CheckStatusText>
        </CheckStatusButton>
      </Container>
    </>
  );
};

export default AddAttendance;
