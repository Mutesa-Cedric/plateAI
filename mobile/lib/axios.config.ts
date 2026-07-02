import _ from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Single public API surface: the Express app server.
 * AI features live under /ai/* and are proxied to core via gRPC.
 * The mobile app never dials the core service directly.
 */
const axios = _.create({
    baseURL: "http://157.173.127.185:8000",
    // baseURL: "http://localhost:8000",
});

// Get the token from AsyncStorage
AsyncStorage.getItem("token")
    .then((token) => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    })
    .catch((error) => {
        console.log("Error retrieving token from AsyncStorage:", error);
    });

export default axios;
