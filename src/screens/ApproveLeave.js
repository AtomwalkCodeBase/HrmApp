import React, { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Link, useRouter } from "expo-router";
import ModalComponent from '../components/ModalComponent';
import { getEmpLeave } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import LeaveActionModal from '../components/LeaveActionModal';
import LeaveCard from '../components/ApproveLeaveCard';

const Container = styled.View`
  padding: 16px;
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

const LeaveScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [leaveData, setLeavedata] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRejectModalVisible, setRejectModalVisible] = useState(false);
  const [isApproveModalVisible, setApproveModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // New state for FlatList refreshing

  useEffect(() => {
    leaveDetails();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true); // Show the refresh indicator
    leaveDetails(); // Refetch data
  };

  const leaveDetails = () => {
    getEmpLeave("A").then((res) => {
      setLeavedata(res.data);
      setFilteredData(res.data);
      setRefreshing(false); // Hide the refresh indicator after data is fetched
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleBackPress = () => {
    router.push('home');
  };
  
  const handleCardPress = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const handleSearch = (text) => {
    setSearchQuery(text.trim().toLowerCase());
    const filtered = leaveData.filter((item) =>
      item.emp_data.emp_id.trim().toLowerCase().includes(text)
    );
    setFilteredData(filtered);
  };

  const renderLeaveItem = ({ item }) => (
    <LeaveCard
      leave={item}
      onPress={() => handleCardPress(item)}
      onApprove={() => {
        setSelectedLeave(item);
        setApproveModalVisible(true);
      }}
      onReject={() => {
        setSelectedLeave(item);
        setRejectModalVisible(true);
      }}
    />
  );

  return (
    <>
      <HeaderComponent headerTitle="Approve Leaves List" onBackPress={handleBackPress}/>
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
        <FlatList
          data={filteredData}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing} // Attach the refreshing state
          onRefresh={handleRefresh} // Attach the handleRefresh function
        />
        {selectedLeave && (
          <ModalComponent
            isVisible={isModalVisible}
            leave={selectedLeave}
            onClose={() => setModalVisible(false)}
          />
        )}
        {selectedLeave && (
          <LeaveActionModal 
            isVisible={isApproveModalVisible} 
            leave={selectedLeave} 
            onClose={() => { 
              setApproveModalVisible(false);
              handleRefresh(); // Refresh after closing
            }} 
            actionType="APPROVE" 
          />
        )}
        {selectedLeave && (
          <LeaveActionModal 
            isVisible={isRejectModalVisible} 
            leave={selectedLeave} 
            onClose={() => { 
              setRejectModalVisible(false);
              handleRefresh(); // Refresh after closing
            }} 
            actionType="REJECT" 
          />
        )}
      </Container>
    </>
  );
};

export default LeaveScreen;
