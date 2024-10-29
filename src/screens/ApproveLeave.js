import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, SafeAreaView, ScrollView, Text, View } from 'react-native';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons'; // For icons
import { useNavigation } from '@react-navigation/native';
import { Link, useRouter } from "expo-router";
import ModalComponent from '../components/ModalComponent';
import {getEmpLeave} from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import LeaveActionModal from '../components/LeaveActionModal';
// Container for the whole screen
const Container = styled.View`
  padding: 16px;
  /* margin-bottom: 30px; */
  height: 100%;
  background-color: #fff;
`;

const SearchContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #e9ecef;
  padding: 12px;
  border-radius: 28px;
  margin-bottom: 15px;
`;


const SearchInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: #495057;
  padding-left: 10px;
`;

const ButtonText = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  /* margin-left: 8px; */
`;

// Application List section
const ApplicationList = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,  // Hide vertical scrollbar
  showsHorizontalScrollIndicator: false,  // Hide horizontal scrollbar
})`
  /* margin-top: 20px; */
  margin-bottom: 120px;
`;

const ApplicationCard = styled.TouchableOpacity`
  background-color: #fff;
  padding: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${props => props.borderColor || '#ddd'};
  margin-bottom: 12px;
  /* box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); */
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  shadow-offset: 0px 2px;
  elevation: 4;
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
  padding: 4px 8px;
  border-radius: 8px;
`;

const ApplicationStatusText = styled.Text`
  font-size: 14px;
  color: ${props => props.color || '#000'};
  margin-left: 8px;
  font-weight: bold;
`;




const DetailText = styled.Text`
  font-size: 14px;
  margin-bottom: 10px;
  color: #333;
`;

const RejectButton = styled.TouchableOpacity`
  background-color: #ff6666;
  display: flex;
  /* border: 1px solid black; */
  align-items: center;
  justify-content: center;
  height: 40px;
  /* width: 120px; */

  padding: 3px 28px;
  border-radius: 22px;
  margin-top: 10px;
  /* margin-left: 10px; */
`;
const ApprovelButton = styled.TouchableOpacity`
  background-color: #06BF63;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 20px;
  border-radius: 22px;
  margin-top: 10px;
  height: 40px;
  /* width: 120px; */
  /* border: 1px solid black; */

  /* margin-left: 10px; */
`;

// const CancelButtonText = styled.Text`
//   color: #fff;
//   font-size: 14px;
// `;

const DetailHighlight = styled.Text`
  font-weight: bold;
  color: #333;
`;

const LeaveScreen = () => {
  const navigation = useNavigation(); // Access the navigation object
  const router = useRouter();
  
  
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [leaveData,setLeavedata]=useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRejectModalVisible, setRejectModalVisible] = useState(false);
  const [isApproveModalVisible, setApproveModalVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Approve Leave');
  
  // const handlePress = () => {
  //   router.push('/LeaveApply'); 
  // };

  const handlePress = (leave) => {
    router.push({
      pathname: 'LeaveApply',
      params: leave,  // Pass leave data as params
    });
  };

  useEffect(() => {
    leaveDetails();
  }, [selectedTab]);
  


  const leaveDetails = () => {
    getEmpLeave(selectedTab =='My Leave' ? "EL" : selectedTab =='My WFH' ? "WH" : "A" ).then((res) => {
      setLeavedata(res.data);
      setFilteredData(res.data);
    });
  };

  const handleCardPress = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const rejectLeave = (leave) => {
    // Set selected leave and open the cancel modal
    setSelectedLeave(leave);
    // console.log(leave)
    setRejectModalVisible(true);
  };

  const approveLeave = (leave) => {
    // Set selected leave and open the cancel modal
    setSelectedLeave(leave);
    // console.log(leave)
    setApproveModalVisible(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);


  const handleBackPress = () => {
    router.push('home');
  };

  const handleSearch = (text) => {
    setSearchQuery(text.trim().toLowerCase());
  
    // Filter the leaveData based on the employee ID directly
    const filtered = leaveData.filter((item) => {
      // Access emp_id directly from the item.emp_data
      const empId = item.emp_data.emp_id.trim().toLowerCase(); 
      return empId.includes(text); // Check if emp_id includes the search text
    });
  
    setFilteredData(filtered);
  };



 
  

  console.log("Leave Type",leaveData)

  const getLeaveStyles = (leave_type_display) => {
    switch (leave_type_display) {
      case 'Work from Home':  
        return { lbgColor: '#ffc107', lcolor: '#ffffff'};
      case 'Leave without Pay':
        return { lbgColor: '#DC3545', lcolor: '#ffffff'};
      case 'Earned Leave':
        return { lbgColor: '#17A2B8', lcolor: '#ffffff'};
      default:
        return { lbgColor: '#fff', lcolor: '#000'};
    }
  };
  

  // Get status styles dynamically
  const getStatusStyles = (status_display) => {
    switch (status_display) {
      case 'Submitted':
        return { bgColor: '#fff7e6', color: '#ffcc80', borderColor: '#ffcc80', icon: 'check' };
      case 'Rejected':
        return { bgColor: '#ffe6e6', color: '#ff6666', borderColor: '#ff6666', icon: 'cancel' };
      case 'Cancelled':
        return { bgColor: '#ffe6e6', color: '#ff6666', borderColor: '#ff6666', icon: 'cancel' };
      case 'Approved':
        return { bgColor: '#eaffea', color: '#66cc66', borderColor: '#66cc66', icon: 'check-circle' };
      default:
        return { bgColor: '#fff', color: '#000', borderColor: '#ddd', icon: 'check-circle' };
    }
  };
  const renderLeaveItem = ({ item: leave }) => {
    const { bgColor, color, borderColor, icon } = getStatusStyles(leave.status_display);
    const { lbgColor, lcolor, lborderColor, licon } = getLeaveStyles(leave.leave_type_display);
  // console.log(leave,"check")
    return (
      <ApplicationCard
        key={leave.id}
        borderColor={borderColor}
        status={leave.status_display}
        onPress={() => handleCardPress(leave)}
      >
        
        <ApplicationStatusContainer>
          <View>
          <DetailText>
            <DetailHighlight>{leave.emp_data.emp_id} [{leave.emp_data.name}]</DetailHighlight>
          </DetailText>
          <DetailText style={{ paddingTop: '10px' }}>Date: {leave.from_date} to {leave.to_date}</DetailText>
          {/* <DetailText>
            Leave Type: <DetailHighlight>{leave.leave_type_display}</DetailHighlight>
          </DetailText> */}
          {/* <DetailText>
            Apply Days: <DetailHighlight>{leave.no_leave_count} Days</DetailHighlight>
          </DetailText> */}
          
          </View>
          <View style={{ flexDirection: 'culomn', justifyContent:'center',alignItems: 'center', }}>
          <ApplicationStatus bgColor={lbgColor}>
              <ApplicationStatusText color={lcolor}>{leave.leave_type_display}</ApplicationStatusText>
              {/* <MaterialIcons name={licon} size={24} color={lcolor} /> */}
            </ApplicationStatus>
            <DetailText>
            Apply Days: <DetailHighlight>{leave.no_leave_count} Days</DetailHighlight>
          </DetailText>

            {/* <ApplicationStatus bgColor={bgColor}>
              <ApplicationStatusText color={color}>{leave.status_display}</ApplicationStatusText>
              <MaterialIcons name={icon} size={24} color={color} />
            </ApplicationStatus> */}
            
          </View>
        </ApplicationStatusContainer>
        {/* Show Cancel button only if status is "Submitted" */}
        {leave.status_display === 'Submitted' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              
              <RejectButton onPress={() => rejectLeave(leave)} >
                <ButtonText>Reject</ButtonText>
              </RejectButton>
              <ApprovelButton onPress={() => approveLeave(leave)} >
                <ButtonText>Approve</ButtonText>
              </ApprovelButton>
            </View>
            )}

      </ApplicationCard>
    );
  };
  
  return (
    <>
    
    <HeaderComponent headerTitle="Approve Leaves List" onBackPress={handleBackPress} />
      <Container>
      <SearchContainer>
          <MaterialIcons name="search" size={24} color="#888" />
          <SearchInput
            placeholder="Search Employee ID"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </SearchContainer>
        <ApplicationList>
        <FlatList
        data={filteredData}
        renderItem={renderLeaveItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />

        </ApplicationList>
        {selectedLeave && (
        <ModalComponent
          isVisible={isModalVisible}
          leave={selectedLeave}
          onClose={closeModal}
        />
      )}
      {selectedLeave && (
      <LeaveActionModal 
        isVisible={isApproveModalVisible} 
        leave={selectedLeave} 
        onClose={() => {setApproveModalVisible(false),router.push('ApproveLeaves')}} 
        actionType="APPROVE" 
      />
      )}
     
      {selectedLeave && (
        <>
        <LeaveActionModal 
        isVisible={isRejectModalVisible} 
        leave={selectedLeave} 
        onClose={() => {setRejectModalVisible(false),router.push('ApproveLeaves')}} 
        actionType="REJECT" 
        />
      </>
      )}
      </Container>
      </>
  );
};

export default LeaveScreen;
