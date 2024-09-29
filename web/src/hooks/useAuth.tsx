"use client"

import axios from "@/axios.config";
import type { IUser } from "@/types";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

interface IAuthContext {
    user: IUser | null;
    login: (email: string, password: string) => void;
    loggingIn: boolean;
    register: (user: IUser) => void;
    registering: boolean;
    logout: () => void;
}


const AuthContext = createContext<IAuthContext | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);
    const [registering, setRegistering] = useState(false);
    const router = useRouter();

    const login = async (email: string, password: string) => {
        setLoggingIn(true);
        try {
            const { data } = await axios.post("/auth/login", { email, password });
            setUser(data.user);
            toast.success("Logged in successfully");
            // setTimeout(() => {
            //     router.push("/download");
            // }, 500)
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 401) {
                toast.error("Invalid credentials");
            } else {
                toast.error("Failed to login");
            }
        } finally {
            setLoggingIn(false);
        }
    };

    const register = async (newUser: IUser) => {
        setRegistering(true);
        try {
            const { data } = await axios.post("/auth/register", newUser);
            setUser(data.user);
            toast.success("Registered successfully");
            // setTimeout(() => {
            //     router.push("/download");
            // }, 500)
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 400) {
                toast.error("User with that already exists");
            } else {
                toast.error("Failed to register");
            }
        } finally {
            setRegistering(false);
        }
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loggingIn, register, registering, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}