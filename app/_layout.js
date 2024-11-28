import { Stack } from "expo-router";
import {AppProvider} from '../context/AppContext'

export default function RootLayout() {
  return (
    <AppProvider>

    <Stack>
      <Stack.Screen name="index"/>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="AuthScreen/index" options={{headerShown:false}}/> 
      <Stack.Screen name="PinScreen/index" options={{headerShown:false}}/> 
      <Stack.Screen name="LeaveApply/index" options={{headerShown:false}}/>
      <Stack.Screen name="ClaimApply/index" options={{headerShown:false}}/>
      <Stack.Screen name="ApproveClaim/index" options={{headerShown:false}}/>
      <Stack.Screen name="ApproveDetails/index" options={{headerShown:false}}/>
      <Stack.Screen name="AttendanceStatusDisplay/index" options={{headerShown:false}}/>
      <Stack.Screen name="ClaimScreen/index" options={{headerShown:false}}/>
      <Stack.Screen name="HolidayList/index" options={{headerShown:false}}/>
      <Stack.Screen name="ResetPassword/index" options={{headerShown:false}}/>
      <Stack.Screen name="ApproveLeaves/index" options={{headerShown:false}}/>
    </Stack>
    
    </AppProvider>
  );
}
