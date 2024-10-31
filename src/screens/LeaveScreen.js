import React, { useEffect, useState } from 'react';
import { FlatList, View, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import ModalComponent from '../components/ModalComponent';
import { getEmpLeave } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import LeaveActionModal from '../components/LeaveActionModal';
import { getProfileInfo } from '../services/authServices';
import LeaveCardComponent from '../components/LeaveCardComponent';
import ApplyButton from '../components/ApplyButton';

const screenHeight = Dimensions.get('window').height;
const responsiveMarginBottom = screenHeight * 0.125;

const Container = styled.View`
  padding: 16px;
  padding-bottom: 100px;
  height: 100%;
  width: 100%;
  background-color: #fff;
`;

const TabContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-vertical: 10px;
`;

const TabButton = styled.TouchableOpacity`
  flex: 2;
  align-items: center;
`;

const TabButtonActive = styled(TabButton)`
  border-bottom-width: 2px;
  border-color: blue;
  color: black;
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

const ApplicationList = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
})`
  margin-top: 20px;
  /* margin-bottom: 10px; */
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




const LeaveText = styled.Text`
  font-size: 16px;
  color: #333;
  font-weight: 500;
`;

const CardRow = styled.View`
  flex-direction: row;
  justify-content: center;
  flex-wrap: wrap;
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
  margin-bottom: 0px;
`;

const LeaveScreen = () => {
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [leaveData, setLeaveData] = useState([]);
  const [randomValue, setRandomValue] = useState(0);
  const [selectedTab, setSelectedTab] = useState('My Leave');
  const [profile, setProfile] = useState({});

  const generateRandomValue = () => {
    return Math.floor(Math.random() * 100); // Generates a random number between 0 and 99
  };

  useEffect(() => {
    setRandomValue(generateRandomValue());
    getProfileInfo().then((res) => {
      setProfile(res.data);
    });
  }, []);

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

  useEffect(() => {
    leaveDetails();
  }, [selectedTab, randomValue]);

  const leaveDetails = () => {
    getEmpLeave(selectedTab === 'My Leave' ? 'EL' : selectedTab === 'My WFH' ? 'WH' : 'EL')
      .then((res) => {
        // Filter out cancelled leaves if "My Leave" tab is selected
        const filteredData = selectedTab === 'My Leave'
          ? res.data.filter((leave) => leave.status_display !== 'Cancelled')
          : selectedTab === 'My Cancel Leave'
          ? res.data.filter((leave) => leave.status_display === 'Cancelled')
          : res.data;
        setLeaveData(filteredData);
      });
  };

  const handleBackPress = () => {
    router.push('home');
  };

  const handleRefresh = () => {
    setRandomValue(randomValue+1);
  };

  const handlePress = (leave) => {
    router.push({
      pathname: '/LeaveApply',
      params: leave,  // Pass leave data as params
    });
  };



  const count = leaveData.length;
  const max_leave = profile?.emp_data?.max_no_leave;

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
    const statusStyles = getStatusStyles(leave.status_display);
    return (
      <LeaveCardComponent
        leave={leave}
        statusStyles={statusStyles}
        onPress={handleCardPress}
        onCancelPress={cancelLeave}
        showCancelButton={leave.status_display === 'Submitted'}
      />
    );
  };

  return (
    <>
      <HeaderComponent headerTitle="My Leaves" onBackPress={handleBackPress} />
      <Container>
        <CardRow>
          <LeaveCard bgColor="#eaffea" borderColor="#66cc66">
            <LeaveNumber color="#66cc66">Total Leave Application: {count}</LeaveNumber>
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

        <ApplicationList>

        


        <FlatList
          data={[...leaveData].reverse()}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id.toString()}
        />
        </ApplicationList>
        <ApplyButton onPress={() => handlePress(leaveData && leaveData[0]?.emp_data)} buttonText="Apply Leave" />


        {/* <ApplyLeaveButton onPress={() => handlePress(leaveData&&leaveData[0]?.emp_data)}>
          
        </ApplyLeaveButton> */}
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
            onClose={() => {setCancelModalVisible(false),handleRefresh()}} 
            actionType="CANCEL"
          />
        )}
      </Container>
    </>
  );
};

export default LeaveScreen;
