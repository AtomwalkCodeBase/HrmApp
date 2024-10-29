import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, StatusBar, View, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter,useNavigation } from "expo-router";
import ModalComponent from '../components/ModalComponent';
import { getEmpLeave } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import LeaveActionModal from '../components/LeaveActionModal';
import { Dimensions } from 'react-native';


const screenHeight = Dimensions.get('window').height;
const responsiveMarginBottom = screenHeight * 0.125;

const Container = styled.View`
  padding: 16px;
  height: 100%;
  width: 100%;
  background-color: #fff;
`;

const Title = styled.Text`
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
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

const LeaveText = styled.Text`
  font-size: 16px;
  color: #333;
  font-weight: 500;
`;

const LeaveNumber = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: ${props => props.color || '#000'};
  margin-top: 5px;
  margin-bottom: 5px;
`;

const ApplyLeaveButton = styled.TouchableOpacity`
  background-color: #4d88ff;
  padding: 12px 16px;
  border-radius: 25px;
  align-self: center;
  margin-bottom: ${responsiveMarginBottom}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-left: 8px;
`;

const ApplicationList = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
})`
  margin-top: 20px;
  margin-bottom: 10px;
`;

const ApplicationCard = styled.TouchableOpacity`
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${props => props.borderColor || '#ddd'};
  margin-bottom: 12px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const ApplicationStatusContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ApplicationStatus = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${props => props.bgColor || 'transparent'};
  padding: 2px 8px;
  border-radius: 8px;
`;

const ApplicationStatusText = styled.Text`
  font-size: 14px;
  color: ${props => props.color || '#000'};
  margin-left: 8px;
`;

const CancelButton = styled.TouchableOpacity`
  background-color: #ff6666;
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 5px 8px;
  border-radius: 8px;
  margin-top: 10px;
`;

const CancelButtonText = styled.Text`
  color: #fff;
  font-size: 14px;
`;

const TabContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-vertical: 10px;
`;

const TabButton = styled.TouchableOpacity`
  flex: 1;
  align-items: center;
`;

const TabButtonActive = styled(TabButton)`
  border-bottom-width: 3px;
  border-color: blue;
  color: black;
`;

const TabText = styled.Text`
  font-size: 16px;
  color: gray;
  margin-bottom: 10px;
`;

const TabTextActive = styled(TabText)`
  color: blue;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ApplicationDetails = styled.View`
  margin-top: 10px;
`;

const DetailText = styled.Text`
  font-size: 14px;
  color: #333;
`;

const DetailHighlight = styled.Text`
  font-weight: bold;
  color: #333;
`;

const LeaveScreen = () => {
  const navigation = useNavigation(); // Access the navigation object
  const router = useRouter();
  
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [leaveData, setLeaveData] = useState([]);
  const [selectedTab, setSelectedTab] = useState('My Leave');
  const [randomValue, setRandomValue] = useState(0);


  const generateRandomValue = () => {
    return Math.floor(Math.random() * 100); // Generates a random number between 0 and 99
  };

  useEffect(() => {
    // Update mathRender each time the component is mounted
    setRandomValue(generateRandomValue());
  }, []); 


  const handlePress = (leave) => {
    router.push({
      pathname: '/LeaveApply',
      params: leave,  // Pass leave data as params
    });
  };

  
  const handleCardPress = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const cancelLeave = (leave) => {
    setSelectedLeave(leave);
    setCancelModalVisible(true);
  };

  console.log('Random value---',randomValue)

  useEffect(() => {
    leaveDetails();
    
  }, [selectedTab,randomValue]);

  const leaveDetails = () => {
    getEmpLeave(selectedTab === 'My Leave' ? 'EL' : selectedTab === 'My Cancel Leave' ? 'EL' : 'WH').then((res) => {
      setLeaveData(res.data);
    });
  };

  const handleBackPress = () => {
    router.push('home');
  };

  const count = leaveData.length
  const max_leave = 0;
  // console.log(count)

  // Get status styles dynamically
  const getStatusStyles = (status_display) => {
    switch (status_display) {
      case 'Submitted':
        return { bgColor: '#fff7e6', color: '#ba5e07', borderColor: '#ffcc80', icon: 'check' };
      case 'Rejected':
        return { bgColor: '#ffe6e6', color: '#f50202', borderColor: '#ff6666', icon: 'cancel' };
      case 'Cancelled':
        return { bgColor: '#ffe6e6', color: '#fc0b03', borderColor: '#ff6666', icon: 'cancel' };
      case 'Approved':
        return { bgColor: '#eaffea', color: '#026b1c', borderColor: '#66cc66', icon: 'check-circle' };
      default:
        return { bgColor: '#fff', color: '#000', borderColor: '#ddd', icon: 'check-circle' };
    }
  };


  const renderLeaveItem = ({ item: leave }) => {
    const { bgColor, color, borderColor, icon } = getStatusStyles(leave.status_display);

    return (
      leave.status_display!='Cancelled'&&(selectedTab=='My Leave'||selectedTab=='My WFH')?<ApplicationCard
        key={leave.id}
        borderColor={borderColor}
        status={leave.status_display}
        onPress={() => handleCardPress(leave)}
      >
        <ApplicationStatusContainer>
          <View>
          <DetailText>
            <DetailHighlight>{leave.leave_type_display}</DetailHighlight>
          </DetailText>
          
          <DetailText>{leave.from_date} to {leave.to_date}</DetailText>
          <DetailText>
            <DetailHighlight>{leave.no_leave_count} Days</DetailHighlight>
          </DetailText>
          </View>
          <View style={{ flexDirection: 'culomn' }}>
            <ApplicationStatus bgColor={bgColor}>
              <ApplicationStatusText color={color}>{leave.status_display}</ApplicationStatusText>
              <MaterialIcons name={icon} size={24} color={color} />
            </ApplicationStatus>
            {/* Show Cancel button only if status is "Submitted" */}
            {leave.status_display === 'Submitted' && (
              <CancelButton onPress={() => cancelLeave(leave)} >
                <CancelButtonText>Cancel</CancelButtonText>
              </CancelButton>
            )}
          </View>
          </ApplicationStatusContainer>
        
      </ApplicationCard>:leave.status_display=='Cancelled'&&selectedTab=='My Cancel Leave'&&<ApplicationCard
        key={leave.id}
        borderColor={borderColor}
        status={leave.status_display}
        onPress={() => handleCardPress(leave)}
      >
        <ApplicationStatusContainer>
          <View>
          <DetailText>Date: {leave.from_date} to {leave.to_date}</DetailText>
          <DetailText>
            Leave Type: <DetailHighlight>{leave.leave_type_display}</DetailHighlight>
          </DetailText>
          <DetailText>
            Apply Days: <DetailHighlight>{leave.no_leave_count} Days</DetailHighlight>
          </DetailText>
          </View>
          <View style={{ flexDirection: 'culomn' }}>
            <ApplicationStatus bgColor={bgColor}>
              <ApplicationStatusText color={color}>{leave.status_display}</ApplicationStatusText>
              <MaterialIcons name={icon} size={24} color={color} />
            </ApplicationStatus>
            {/* Show Cancel button only if status is "Submitted" */}
            {leave.status_display === 'Submitted' && (
              <CancelButton onPress={() => cancelLeave(leave)} >
                <CancelButtonText>Cancel</CancelButtonText>
              </CancelButton>
            )}
          </View>
          </ApplicationStatusContainer>
        <ApplicationDetails>
          
          
        </ApplicationDetails>
      </ApplicationCard>
      
    );
  };
  
  return (
    <>
      <HeaderComponent headerTitle="My Leaves" onBackPress={handleBackPress} />
      <Container>
        <CardRow>
          <LeaveCard bgColor="#eaffea" borderColor="#66cc66">
            <LeaveNumber color="#66cc66">Total Leave Applied: {count}</LeaveNumber>
          </LeaveCard>
          <LeaveCard bgColor="#e6ecff" borderColor="#4d88ff">
            <LeaveNumber color="#4d88ff">Max Leave for Year: {max_leave}</LeaveNumber>
          </LeaveCard>
        </CardRow>

        
         {/* Tab Section */}
      <TabContainer>
        <TabButton onPress={() => setSelectedTab('My Leave')}>
          {selectedTab === 'My Leave' ? (
            <TabButtonActive>
              <TabTextActive>My Leave</TabTextActive>
            </TabButtonActive>
          ) : (
            <TabText>My Leave</TabText>
          )}
        </TabButton>
        <TabButton onPress={() => setSelectedTab('My WFH')}>
          {selectedTab === 'My WFH' ? (
            <TabButtonActive>
              <TabTextActive>My WFH</TabTextActive>
            </TabButtonActive>
          ) : (
            <TabText>My WFH</TabText>
          )}
        </TabButton>
        <TabButton onPress={() => setSelectedTab('My Cancel Leave')}>
          {selectedTab === 'My Cancel Leave' ? (
            <TabButtonActive>
              <TabTextActive>My Cancel Leave</TabTextActive>
            </TabButtonActive>
          ) : (
            <TabText>My Cancel Leave</TabText>
          )}
        </TabButton>
      </TabContainer>

        {/* Application List Section */}
        <ApplicationList>
        <FlatList
        data={[...leaveData].reverse()}
        renderItem={renderLeaveItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}  // Hide the scrollbar
        />
        </ApplicationList>
        
        {/* Apply Leave Button */}
        <ApplyLeaveButton onPress={() => handlePress(leaveData&&leaveData[0]?.emp_data)}>
          <MaterialIcons name="add-circle" size={24} color="#fff" />
          <ButtonText>Apply Leave</ButtonText>
        </ApplyLeaveButton>

        {selectedLeave && (
        <ModalComponent
          isVisible={isModalVisible}
          leave={selectedLeave}
          onClose={closeModal}
        />
      )}

      {selectedLeave && (       
          <LeaveActionModal 
            isVisible={isCancelModalVisible} 
            leave={selectedLeave} 
            onClose={() => {setCancelModalVisible(false),router.push('leave')}} 
            actionType="CANCEL" 
          />
      )}

      </Container>
      </>
  );
};

export default LeaveScreen;
