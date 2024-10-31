import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { Alert, Keyboard, SafeAreaView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { postEmpLeave } from '../services/productServices';
import HeaderComponent from './HeaderComponent';
import DatePicker from '../components/DatePicker';
import RemarksTextArea from '../components/RemarkInput';
import DropdownPicker from '../components/DropdownPicker';
import SubmitButton from '../components/SubmitButton';
import styled from 'styled-components/native';
import { colors } from '../Styles/appStyle';

const Container = styled.ScrollView`
  flex: 1;
  padding: 10px;
  background-color: #fff;
  height: 100%;
`;

const ApplyLeave = (props) => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [remarks, setRemarks] = useState('');
  // const [leave_type, setLeave_type] = useState('EL');
  const [numOfDays, setNumOfDays] = useState(0);
  const [errors, setErrors] = useState({});
  const call_mode = 'ADD';
  
  // console.log("Employee ===++",props)
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleBackPress = () => {
    router.push('leave');
  };

  const calculateDays = useCallback((startDate, endDate) => {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setNumOfDays(diffDays);
  }, []);

  const handleError = (error, input) => {
    setErrors((prevState) => ({ ...prevState, [input]: error }));
  };

  const validate = (res) => {
    Keyboard.dismiss();
    let isValid = true;
    let isEL = res==='EL'
    let isLP = res==='LP'
    let isWH = res==='WH'

    // console.log('REsponse=+=+',isEL)

    if (!fromDate) {
      handleError('Please select From Date', 'fromDate');
      isValid = false;
    }

    if (!toDate) {
      handleError('Please select To Date', 'toDate');
      isValid = false;
    } else if (toDate < fromDate) {
      handleError("'To Date' should not be earlier than 'From Date.'", 'toDate');
      isValid = false;
    }

    if (!remarks) {
      handleError('Please fill the Remark field', 'remarks');
      isValid = false;
    }

    if (isValid) {
      if (isEL) {
        addLeave(res);
      }
      if (isLP) {
        addLeave(res);
      }
      if (isWH) {
        addLeave(res);
      }
    }
  };

  const addLeave = (res) => {
    const leavePayload = {
      emp_id: props.id,
      from_date: `${fromDate.getDate().toString().padStart(2, '0')}-${(fromDate.getMonth() + 1).toString().padStart(2, '0')}-${fromDate.getFullYear()}`,
      to_date: `${toDate.getDate().toString().padStart(2, '0')}-${(toDate.getMonth() + 1).toString().padStart(2, '0')}-${toDate.getFullYear()}`,
      remarks,
      leave_type: res,
      call_mode,
    };

    
    postEmpLeave(leavePayload)
      .then(() => {
        Alert.alert('Application Submitted', 'Leave applied successfully');
        router.push('leave');
      })
      .catch(() => Alert.alert(
        'Leave Application Failed',
        'Please verify the selected dates. Either the dates are already approved or fall on a holiday.'
      ));      
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HeaderComponent headerTitle="Apply Leave" onBackPress={handleBackPress} />
      <Container>
        <DatePicker 
          label="From Date" 
          cDate={fromDate} 
          setCDate={setFromDate} 
          error={errors.fromDate} 
        />
        <DatePicker 
          label="To Date" 
          cDate={toDate} 
          setCDate={setToDate} 
          error={errors.toDate} 
        />
        <RemarksTextArea 
          remark={remarks} 
          setRemark={setRemarks}
          error={errors.remarks} 
        />
        {/* <DropdownPicker
          label="Type of Leave"
          data={[
            { name: 'Earned Leave', value: 'EL' },
            { name: 'Loss of Pay', value: 'LP' },
            { name: 'Work From Home', value: 'WH' },
          ]}
          value={leave_type}
          setValue={setLeave_type}
        /> */}
        <SubmitButton
          label="Apply Leave (EL)"
          onPress={()=>{validate('EL')}}
          bgColor={colors.primary}
          textColor="white"
        />
        <SubmitButton
          label="Apply WFH"
          onPress={()=>{validate('WH')}}
          bgColor={colors.yellow}
          textColor="white"
        />
        <SubmitButton
          label="Apply LOP"
          onPress={()=>{validate('LP')}}
          bgColor={colors.red}
          textColor="white"
        />
      </Container>
    </SafeAreaView>
  );
};

export default ApplyLeave;
