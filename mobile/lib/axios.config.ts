import _ from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const axios = _.create({
    baseURL: "http://157.173.127.185:8000",
    // baseURL: DEV_URL,
    // timeout: 5000,
});


export const AIAxios = _.create({
    baseURL: "http://157.173.127.185:5000",
    // timeout: 5000,
});
// Get the token from AsyncStorage
AsyncStorage.getItem("token")
    .then((token) => {
        // Set the token as the authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    })
    .catch((error) => {
        console.log("Error retrieving token from AsyncStorage:", error);
    });

export default axios;
