

export interface User {
    id: string;
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


export interface FoodItem {
    id: string;
    foodItem: string;
    calories: number;
    carbohydrates: number;
    fats: number;
    proteins: number;
    sodium: number;
    createdAt: Date;
    updatedAt: Date;
}


export interface Meal {
    id: string;
    image: string;
    foodItems: FoodItem[];
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}
