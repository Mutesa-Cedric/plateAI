

export interface User {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
    purpose?: "LOSE" | "GAIN" | "MAINTAIN";
}