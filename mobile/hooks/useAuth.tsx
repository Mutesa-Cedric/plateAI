/* eslint-disable react-hooks/exhaustive-deps */
import axios from "@/lib/axios.config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from "expo-router";
import { createContext, useContext, useState } from "react";
import { useToast } from "react-native-toast-notifications";
import { User } from "../types";

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => void;
    loggingIn: boolean;
    register: (user: User) => void;
    registering: boolean;
    logout: () => void;
    loggingOut: boolean;
    initialLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const toast = useToast();
    const [loggingIn, setLoggingIn] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const pathname = usePathname();

    // useEffect(() => {
    //     if (user) {
    //         setInitialLoading(false);
    //         return;
    //     }
    //     const fetchUser = async () => {
    //         try {
    //             const { data } = await axios.get("/auth/me");
    //             setUser(data.user);
    //         } catch (error) {
    //             setUser(null);
    //             if (!['/', '/Login', '/Register'].includes(pathname)) {
    //                 router.push("/Login");
    //             }
    //         } finally {
    //             setInitialLoading(false);
    //         }
    //     };
    //     fetchUser();
    // }
    //     , [pathname, user]);

    const login = async (email: string, password: string) => {
        setLoggingIn(true);
        try {
            const { data } = await axios.post("/auth/login", {
                email,
                password,
            });
            setUser(data.user);
            AsyncStorage.setItem("token", data.token);
            toast.show("Logged in successfully", {
                type: "success",
                duration: 1000
            });
            router.push("/Home");
        } catch (error: any) {
            console.log(error);
            if (error.response.status === 400) {
                toast.show("Invalid email or password", {
                    type: "danger",
                });
            } else {
                toast.show(error?.response?.data?.message ?? "An error occurred", {
                    type: "danger",
                });
            }
        } finally {
            setLoggingIn(false);
        }
    };

    const register = async (user: User) => {
        setRegistering(true);
        try {
            const { data } = await axios.post("/auth/register", user);
            toast.show("Registered successfully", {
                type: "success",
            });
            router.push("/Login");
        } catch (error: any) {
            toast.show(error?.response?.data?.message ?? "An error occurred", {
                type: "error",
            });
        } finally {
            setRegistering(false);
        }
    };


    const logout = async () => {
        setLoggingOut(true);
        try {
            setUser(null);
            AsyncStorage.removeItem("token");
            toast.show("Logged out successfully", {
                type: "success",
            });
            router.push("/Login");
        } catch (error) {
            toast.show("An error occurred", {
                type: "error",
            });
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, loggingIn, register, registering, logout, loggingOut, initialLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export default function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
