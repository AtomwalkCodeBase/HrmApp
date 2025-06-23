import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRoute } from '@react-navigation/native';
import TrainingScreen from '../../src/screens/TrainingScreen';


const index = () => {
  const route = useRoute();
  const data = route?.params;

  return (
    <View style={{ flex: 1 }}>
            <TrainingScreen/>
    </View>
  )
}

export default index

const styles = StyleSheet.create({})