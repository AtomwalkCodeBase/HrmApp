import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native';
import ClaimScreen from '../../src/screens/ClaimScreen';
import HolidayScreen from '../../src/screens/HolidayScreen';


const index = () => {

  const route = useRoute();
  const leave = route.params;
  const emp_data_id = leave.id
  return (
    <View style={{ flex: 1,
        
        }}>
            <HolidayScreen/>
    </View>
  )
}

export default index

const styles = StyleSheet.create({})