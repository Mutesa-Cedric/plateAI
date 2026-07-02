import _ from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/**
 * Single public API surface: the Express app server.
 * Prefer EXPO_PUBLIC_API_URL; fall back to app.json extra.apiUrl; then localhost.
 * Never hardcode a shared production host in source.
 */
const extra =
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined) ||
    ((Constants as any).manifest?.extra as { apiUrl?: string } | undefined) ||
    {};

const baseURL =
    process.env.EXPO_PUBLIC_API_URL ||
    extra.apiUrl ||
    "http://localhost:8000";

const axios = _.create({
    baseURL,
});

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
