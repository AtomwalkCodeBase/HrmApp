import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { getProfileInfo } from '../services/authServices';
import { getClaimApprover, postClaimAction } from '../services/productServices';
import HeaderComponent from '../components/HeaderComponent';
import AmountInput from '../components/AmountInput'; // Custom Amount Input component
import RemarksInput from '../components/RemarkInput'; // Custom Remarks Input component
import DropdownPicker from '../components/DropdownPicker'; // Custom DropdownPicker component

const Container = styled.View`
  flex: 1;
  padding: 16px;
  background-color: #ffffff;
`;

const ClaimDetailContainer = styled.View`
  border: 1px solid #a970ff;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const ClaimDetailText = styled.Text`
  font-size: 18px;
  color: ${(props) => props.color || '#333'};
  margin-bottom: 8px;
  font-weight: 500;
`;

const FillFieldsContainer = styled.View`
  margin-top: 10px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

const ActionButton = styled.TouchableOpacity`
  flex: 1;
  background-color: ${(props) => props.color || '#4d88ff'};
  padding: 15px;
  margin: 0 5px;
  border-radius: 12px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
`;

const ApproveClaimDetails = (props) => {
  const [profile, setProfile] = useState({});
  let claim;
  
  const claimData = props?.claim_data;
  if (claimData) {
    const claimDetails = claimData.claimDetails;
    if (typeof claimDetails === 'string' && claimDetails !== "[object Object]") {
      try {
        claim = JSON.parse(claimDetails);
      } catch (error) {
        console.error("Error parsing claimDetails: ", error);
      }
    } else {
      claim = claimDetails && typeof claimDetails === 'object' ? claimDetails : {};
    }
  } else {
    console.warn("claim_data is undefined or null");
  }

  const callType = props?.claim_data?.callType;
  const navigation = useNavigation();
  const router = useRouter();
  const managerData = profile?.emp_data;

  const [claimAmount, setClaimAmount] = useState(claim?.expense_amt);
  const [remarks, setRemarks] = useState(claim?.approval_remarks);
  const [selectedManager, setSelectedManager] = useState('');
  const [eligible, setEligible] = useState(false);
  const [managers, setManagers] = useState([]);
  const [claimGradeLevel, setClaimGradeLevel] = useState(0);
  
  useEffect(() => {
    getProfileInfo().then((res) => {
      setProfile(res.data);
    });
    getClaimApprover()
      .then((res) => setManagers(res.data))
      .catch((error) => console.error('Error fetching claim approvers: ', error));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Parse and calculate dates for claim submission
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('-');
    const monthMap = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04',
      May: '05', Jun: '06', Jul: '07', Aug: '08',
      Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const formattedMonth = monthMap[month] || '01';
    return `${year}-${formattedMonth}-${day}`;
  };

  const submittedDate = new Date(parseDate(claim.submitted_date));
  const expenseDate = new Date(parseDate(claim.expense_date));
  const timeDifference = submittedDate - expenseDate;
  const daysDifference = timeDifference / (1000 * 3600 * 24);
  const maxApproveDays = managerData?.approve_data?.find(data => data.max_days)?.max_days || 0;

  useEffect(() => {
    if (managerData?.approve_data && claimAmount) {
      const approveGradeLevel = managerData.approve_data.find(data => data.claim_grade_level)?.claim_grade_level;
      const maxClaimAmount = managerData.approve_data.find(data => data.max_claim_amt)?.max_claim_amt;
      setClaimGradeLevel(profile?.emp_data?.grade_level);
      
      if (approveGradeLevel > claimGradeLevel) {
        if (parseFloat(claimAmount) > maxClaimAmount || daysDifference > maxApproveDays) {
          setEligible(true);
        }
      }
    }
  }, [managerData, claimAmount, claimGradeLevel, maxApproveDays]);

  const handleAction = (res1) => {
    if (eligible && (claimAmount.trim() === '' || remarks.trim() === '' || selectedManager.trim() === '')) {
      Alert.alert('Incomplete Submission', 'Please fill in all fields including selecting a manager.');
      return;
    }
    const claimPayload = {
      approve_by_id: selectedManager,
      approve_amt: `${claimAmount}`,
      claim_id: `${claim?.id}`,
      remarks,
      call_mode: res1,
    };
    postClaimAction(claimPayload)
      .then(() => {
        Alert.alert('Claim Status Update', `Claim action updated.`);
        router.push('leave');
      })
      .catch(() => {
        Alert.alert('Claim Action Failed', `Failed to ${res1} claim.`);
      });
  };

  return (
    <>
      <HeaderComponent headerTitle={`Approve (${claim?.claim_id})`} onBackPress={navigation.goBack} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Container>
          <ClaimDetailContainer>
            <ClaimDetailText>Expense Item: {claim?.item_name}</ClaimDetailText>
            <ClaimDetailText color="#ff8c00">Expense Date: {claim?.expense_date}</ClaimDetailText>
            <ClaimDetailText color="#ff8c00">Claim Id: {claim?.claim_id}</ClaimDetailText>
            <ClaimDetailText>Claim Remark: {claim?.remarks}</ClaimDetailText>
            <ClaimDetailText>Emp: {claim?.employee_name}</ClaimDetailText>
            <ClaimDetailText>Claim Amount: {claim?.expense_amt}</ClaimDetailText>
          </ClaimDetailContainer>

          <FillFieldsContainer>
            {/* Using AmountInput component */}
            <AmountInput 
              value={claimAmount}
              onChangeText={setClaimAmount}
            />
            {/* Using RemarksInput component */}
            <RemarksInput 
              value={remarks}
              onChangeText={setRemarks}
            />
            {/* {eligible && (
              <>
                <DropdownPicker
                  label="Select Manager"
                  items={managers.map(manager => ({ label: `${manager.name} [${manager.emp_id}]`, value: manager.id }))}
                  value={selectedManager}
                  onValueChange={setSelectedManager}
                />
              </>
            )} */}
          </FillFieldsContainer>

          <ButtonContainer>
            <ActionButton color="#ff5722" onPress={() => handleAction('REJECT')}>
              <ButtonText>Reject Claim</ButtonText>
            </ActionButton>
            {callType === 'Approve' && (
              <ActionButton color="#06BF63" onPress={() => handleAction('APPROVE')}>
                <ButtonText>Approve Claim</ButtonText>
              </ActionButton>
            )}
            {callType === 'Return' && (
              <ActionButton color="#ffa500" onPress={() => handleAction('SEND_BACK')}>
                <ButtonText>Back to Claimant</ButtonText>
              </ActionButton>
            )}
          </ButtonContainer>
        </Container>
      </ScrollView>
    </>
  );
};

export default ApproveClaimDetails;
