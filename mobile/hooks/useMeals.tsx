import useSWR from "swr";
import axios from "@/lib/axios.config";
import useAuth from "./useAuth";
import { useEffect, useState } from "react";
import { Meal } from "@/types";
import { useRecoilState } from "recoil";
import { mostRecentMealState } from "@/atoms";

export default function useMeals() {
    const { user } = useAuth();
    const [creatingMeal, setCreatingMeal] = useState(false);
    const [_, setMostRecentMeal] = useRecoilState(mostRecentMealState);

    const { data: meals, error, mutate } = useSWR("/meals", async () => {
        if (!user) return [];
        const { data } = await axios.get(`/meals/by-user/${user?.id}`);
        return data.meals as Meal[];
    });

    useEffect(() => {
        if (!user) return;
        mutate();
    }, [user]);

    const createMeal = async (meal: Partial<Meal>) => {
        try {
            setCreatingMeal(true);
            const { data } = await axios.post("/meals", {
                ...meal,
                userId: user?.id,
            });
            mutate([...meals ?? [], data.meal], false);
            setMostRecentMeal(data.meal);
        } catch (error) {
            console.log(error);
        } finally {
            setCreatingMeal(false);
        }
    }


    return {
        meals,
        loading: !meals && !error,
        createMeal,
        creatingMeal,
    };

}