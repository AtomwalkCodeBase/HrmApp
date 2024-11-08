import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import styled from 'styled-components/native';
import { getEmpHoliday, postEmpLeave } from '../services/productServices';
import { useNavigation, useRouter } from 'expo-router';
import HeaderComponent from '../components/HeaderComponent';
import HolidayCard from '../components/HolidayCard';
import { getProfileInfo } from '../services/authServices';

const monthNameMap = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4,
  'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9,
  'Nov': 10, 'Dec': 11,
};

const monthFullNameMap = {
  'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4,
  'June': 5, 'July': 6, 'August': 7, 'September': 8, 'October': 9,
  'November': 10, 'December': 11,
};

const Container = styled.View`
  flex: 1;
  padding: 16px;
  background-color: #fff;
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
`;

const TabContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 20px;
`;

const Tab = styled.TouchableOpacity`
  padding: 10px 20px;
  border-radius: 15px;
  background-color: ${({ active }) => (active ? '#007AFF' : '#E0E0E0')};
  margin: 0 5px;
`;

const TabText = styled.Text`
  color: ${({ active }) => (active ? '#FFF' : '#000')};
  font-weight: bold;
`;


const LeaveCard = styled.TouchableOpacity`
  width: 95%;
  background-color: ${props => props.bgColor || '#fff'};
  border-radius: 16px;
  border-width: 1px;
  border-color: ${props => props.borderColor || '#ddd'};
  margin-bottom: 12px;
  align-items: center;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const LeaveNumber = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: ${props => props.color || '#000'};
  margin-top: 5px;
  margin-bottom: 5px;
`;

const HolidayInfo = styled.View`
  flex: 1;
`;

const HolidayName = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #666;
  margin-bottom: 7px;
`;

const HolidayScreen = () => {
  const [holidays, setHolidays] = useState({});
  const [holidaydata, setHolidaydata] = useState({});
  const [activeTab, setActiveTab] = useState('Company Holiday');
  const [profile, setProfile] = useState({});
  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

  const router = useRouter();


  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    const data = { year: currentYear };
    getProfileInfo().then(res => setProfile(res.data));
    fetchAttendanceDetails(data);
  }, [currentYear]);

  const fetchAttendanceDetails = data => {
    getEmpHoliday(data).then(res => {
      processHolidayData(res.data);
      setHolidaydata(res.data);
    });
  };

  const handleBackPress = () => {
    router.push('home');
  };

  const processHolidayData = data => {
    const holidayMap = {};
    for (let i = 0; i < 12; i++) holidayMap[i] = [];
  
    if (data.h_list && Array.isArray(data.h_list)) {
      data.h_list.forEach(holiday => {
        const { day, h_type, remarks, is_opted } = holiday;
        const [dayNum, monthName, year] = day.split('-');
        const month = monthNameMap[monthName];
        if (month !== undefined && parseInt(year, 10) === currentYear) {
          const dateObj = new Date(year, month, dayNum);
          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  
          holidayMap[month].push({
            name: remarks,
            date: day,
            weekday: weekday, // Add weekday here
            type: h_type === 'O' ? 'Optional' : 'Mandatory',
            is_opted: is_opted || false,
          });
        }
      });
    }
  
  
    setHolidays(holidayMap);
  };
  

  const handleHolidayAction = (date, actionType) => {
    const [day, monthName, year] = date.split('-');
    const month = monthNameMap[monthName];
    const holidayDate = new Date(year, month, day);
    const currentDate = new Date();
  
    if (actionType === 'cancel' && currentDate >= holidayDate) {
      Alert.alert("Cancellation Not Allowed", "You cannot cancel a holiday that has already passed.");
      return;
    }
  
    const formattedDate = `${day.padStart(2, '0')}-${(month + 1).toString().padStart(2, '0')}-${year}`;
  
    const leavePayload = {
      emp_id: `${profile?.emp_data?.id}`,
      from_date: formattedDate,
      to_date: formattedDate,
      remarks: 'Optional Holiday',
      leave_type: 'OH',
      call_mode: actionType === 'opt' ? 'ADD' : 'CANCEL',
    };
  
    // If canceling, add a placeholder leave_id (to be replaced as needed).
    if (actionType === 'cancel') leavePayload.leave_id = '999999999';
  
    postEmpLeave(leavePayload)
      .then(() => {
        Alert.alert(
          `Holiday ${actionType === 'opt' ? 'Applied' : 'Canceled'}`,
          `Holiday ${actionType === 'opt' ? 'applied successfully' : 'canceled successfully'}`
        );
        router.push({ pathname: 'HolidayList' });
      })
      .catch(() => {
        Alert.alert(
          `Holiday ${actionType === 'opt' ? 'Application Failed' : 'Cancellation Failed'}`,
          `Failed to ${actionType === 'opt' ? 'apply' : 'cancel'} the optional holiday.`
        );
      });
  };
    
  return (
    <>
      <HeaderComponent headerTitle="Holiday List" onBackPress={handleBackPress} />
      <Container>
        {/* Render max optional holidays card and tabs */}
        <CardRow>
          <LeaveCard bgColor="#e6ecff" borderColor="#4d88ff">
            <LeaveNumber color="#4d88ff">Max Optional Holiday : {holidaydata?.no_optional_holidays}</LeaveNumber>
          </LeaveCard>
        </CardRow>

        <TabContainer>
          <Tab active={activeTab === 'Company Holiday'} onPress={() => setActiveTab('Company Holiday')}>
            <TabText active={activeTab === 'Company Holiday'}>Company Holiday</TabText>
          </Tab>
          <Tab active={activeTab === 'Optional Holiday'} onPress={() => setActiveTab('Optional Holiday')}>
            <TabText active={activeTab === 'Optional Holiday'}>Optional Holiday</TabText>
          </Tab>
        </TabContainer>

        <ScrollView>
          {Object.entries(holidays).map(([monthIndex, monthHolidays]) => (
            monthHolidays.filter(holiday => activeTab === 'Company Holiday' ? holiday.type === 'Mandatory' : holiday.type === 'Optional').length > 0 && (
              <View key={monthIndex}>
                <HolidayInfo>
                  <HolidayName>{Object.keys(monthFullNameMap)[monthIndex]}</HolidayName>
                </HolidayInfo>
                {monthHolidays
                  .filter(holiday => activeTab === 'Company Holiday' ? holiday.type === 'Mandatory' : holiday.type === 'Optional')
                  .map((holiday, index) => (
                    <HolidayCard
                      data={index}
                      holiday={holiday}
                      onOptClick={() => handleHolidayAction(holiday.date, 'opt')}
                      onCancelClick={() => handleHolidayAction(holiday.date, 'cancel')}
                    />


                  ))}
              </View>
            )
          ))}
        </ScrollView>
      </Container>
    </>
  );
};

export default HolidayScreen;
