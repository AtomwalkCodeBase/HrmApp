import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import styled from 'styled-components/native';
import { getEmpHoliday, postEmpLeave } from '../services/productServices';
import { useNavigation } from 'expo-router';
import HeaderComponent from '../components/HeaderComponent';
import { getProfileInfo } from '../services/authServices';

const monthNameMap = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4,
  'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9,
  'Nov': 10, 'Dec': 11,
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

const HeaderText = styled.Text`
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
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

const HolidayBox = styled.View`
  background-color: #f8f8f8;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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

const HolidayText = styled.Text`
  font-size: 16px;
`;

const HolidayButton = styled(TouchableOpacity)`
  padding: 8px 16px;
  border-radius: 10px;
  background-color: ${({ color }) => color};
`;

const HolidayButtonText = styled.Text`
  color: #fff;
  font-weight: bold;
`;

const HolidayScreen = () => {
  const [holidays, setHolidays] = useState({});
  const [holidaydata, setHolidaydata] = useState({});
  const [activeTab, setActiveTab] = useState('Company Holiday');
  const [profile, setProfile] = useState({});
  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

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

  const processHolidayData = data => {
    const holidayMap = {};
    for (let i = 0; i < 12; i++) holidayMap[i] = [];

    if (data.h_list && Array.isArray(data.h_list)) {
      data.h_list.forEach(holiday => {
        const { day, h_type, remarks, is_opted } = holiday;
        const [dayNum, monthName, year] = day.split('-');
        const month = monthNameMap[monthName];
        if (month !== undefined && parseInt(year, 10) === currentYear) {
          holidayMap[month].push({
            name: remarks,
            date: day,
            type: h_type === 'O' ? 'Optional' : 'Mandatory',
            is_opted: is_opted || false,
          });
        }
      });
    }

    if (data.holiday_list && Array.isArray(data.holiday_list)) {
      data.holiday_list.forEach(holidayDate => {
        const [day, monthName, year] = holidayDate.split('-');
        const month = monthNameMap[monthName];
        if (month !== undefined && parseInt(year, 10) === currentYear) {
          holidayMap[month].push({
            name: 'Company Holiday',
            date: holidayDate,
            type: 'Mandatory',
          });
        }
      });
    }

    setHolidays(holidayMap);
  };

  const handleOptHolidayClick = date => {
    const [day, monthName, year] = date.split('-');
    const month = monthNameMap[monthName];
    const fromDate = new Date(year, month, day);
    const formattedDate = `${fromDate.getDate().toString().padStart(2, '0')}-${(fromDate.getMonth() + 1).toString().padStart(2, '0')}-${fromDate.getFullYear()}`;

    const leavePayload = {
      emp_id: `${profile?.emp_data?.id}`,
      from_date: formattedDate,
      to_date: formattedDate,
      remarks: 'Optional Holiday',
      leave_type: 'OH',
      call_mode: 'ADD',
    };

    postEmpLeave(leavePayload)
      .then(() => Alert.alert('Application Submitted', 'Holiday applied successfully'))
      .catch(() => Alert.alert('Holiday Application Failed', 'Failed to apply optional holiday.'));
  };

  console.log("Leave Data++--",holidaydata)

  const handleCancelHolidayClick = date => {
    console.log('Optional holiday canceled:', date);
    const [day, monthName, year] = date.split('-');
    const month = monthNameMap[monthName];
    const fromDate = new Date(year, month, day);
    const formattedDate = `${fromDate.getDate().toString().padStart(2, '0')}-${(fromDate.getMonth() + 1).toString().padStart(2, '0')}-${fromDate.getFullYear()}`;

    const leavePayload = {
      emp_id: `${profile?.emp_data?.id}`,
      leave_id: `999999999`,//For the time beign we set the temporary leave id but letter it will be modified.
      from_date: formattedDate,
      to_date: formattedDate,
      remarks: 'Optional Holiday',
      leave_type: 'OH',
      call_mode: 'CANCEL',
    };

    postEmpLeave(leavePayload)
      .then(() => Alert.alert('Application Submitted', 'Holiday applied successfully'))
      .catch((error) => {
        Alert.alert('Cancelation Failed', 'Failed to Cancel.');
        console.log('Error Data', error)
      });
  };

  return (
    <>
      <HeaderComponent headerTitle="Holiday List" onBackPress={() => navigation.goBack()} />
      <Container>
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
                <HeaderText>{Object.keys(monthNameMap)[monthIndex]}</HeaderText>
                {monthHolidays
                  .filter(holiday => activeTab === 'Company Holiday' ? holiday.type === 'Mandatory' : holiday.type === 'Optional')
                  .map((holiday, index) => (
                    <HolidayBox key={index}>
                      <HolidayText>{holiday.name}</HolidayText>
                      <HolidayText>{holiday.date}</HolidayText>
                      {holiday.type === 'Optional' && (
                        holiday.is_opted ? (
                          <HolidayButton color="#FF0000" onPress={() => handleCancelHolidayClick(holiday.date)}>
                            <HolidayButtonText>Cancel</HolidayButtonText>
                          </HolidayButton>
                        ) : (
                          <HolidayButton color="#555" onPress={() => handleOptHolidayClick(holiday.date)}>
                            <HolidayButtonText>Opt Holiday</HolidayButtonText>
                          </HolidayButton>
                        )
                      )}
                    </HolidayBox>
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
