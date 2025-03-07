import React, { createContext, useState, useEffect } from 'react';
import { publicAxiosRequest } from "../src/services/HttpMethod";
import { loginURL } from "../src/services/ConstantServies";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompanyInfo } from '../src/services/authServices';
import axios from "axios";
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import ErrorModal from '../src/components/ErrorModal';

const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);
    const [dbName, setDbName] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isErrorVisible, setIsErrorVisible] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    const router = useRouter();

    const checkNetwork = async () => {
        const netState = await NetInfo.fetch();
        setIsConnected(netState.isConnected);
        return netState.isConnected;
    };

    const showError = (message) => {
        setErrorMessage(message);
        setIsErrorVisible(true);
    };

    const onRetry = async () => {
        const networkStatus = await checkNetwork();
        if (networkStatus) {
            setIsErrorVisible(false);
        }
    };

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
            if (!state.isConnected) {
                showError('🚫 No Internet Connection. Please check your network.');
            }
        });
        return () => unsubscribe();
    }, []);

    const login = async (username, password) => {
        setIsLoading(true);
        if (!isConnected) {
            showError('🚫 No Internet. Please check your network connection.');
            setIsLoading(false);
            return;
        }
        try {
            if (!username.includes("@")) {
                const userDetailResponse = await axios.get(`https://www.atomwalk.com/api/get_user_detail/?user_id=${username}`);
                username = userDetailResponse.data.username;
            }
            const res = await publicAxiosRequest.post(loginURL, { username, password });
            const userToken = res.data['key'];
            await AsyncStorage.multiSet([
                ['userToken', userToken],
                ['Password', password],
                ['username', username],
            ]);
            setUserToken(userToken);
            router.replace({ pathname: 'home' });
        } catch (err) {
            showError('❌ Incorrect E-mail ID or password');
        }
        try {
            const res = await getCompanyInfo();
            const companyInfo = res.data;
            const db_name = companyInfo.db_name.substr(3);
            await AsyncStorage.multiSet([
                ['companyInfo', JSON.stringify(companyInfo)],
                ['dbName', db_name],
            ]);
            setCompanyInfo(companyInfo);
            setDbName(db_name);
        } catch (error) {
            showError('❌ Failed to fetch company info. Please try again.');
        }
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        await AsyncStorage.clear();
        setUserToken(null);
        setCompanyInfo(null);
        setDbName(null);
        setIsLoading(false);
        router.replace('AuthScreen');
    };

    const isLoggedIn = async () => {
        const networkStatus = await checkNetwork();
        if (!networkStatus) {
            showError('🚫 No Internet. You are offline.');
            return;
        }
        try {
            setIsLoading(true);
            const userToken = await AsyncStorage.getItem('userToken');
            if (!userToken) {
                router.replace('AuthScreen');
                return;
            }
            setUserToken(userToken);
            const dbName = await AsyncStorage.getItem('dbName');
            setDbName(dbName);
            const storedCompanyInfo = await AsyncStorage.getItem('companyInfo');
            if (storedCompanyInfo) {
                setCompanyInfo(JSON.parse(storedCompanyInfo));
            }
        } catch (e) {
            showError(`Login Status Error: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AppContext.Provider value={{
            login,
            logout,
            isLoading,
            userToken,
            companyInfo,
            dbName,
            isConnected,
            checkNetwork,
            setIsLoading
        }}>
            {children}
            <ErrorModal 
                visible={isErrorVisible} 
                message={errorMessage} 
                onClose={() => setIsErrorVisible(false)}
                onRetry={onRetry} 
            />
        </AppContext.Provider>
    );
};

export { AppContext, AppProvider };
