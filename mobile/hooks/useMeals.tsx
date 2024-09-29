import useSWR from "swr";
import axios from "@/lib/axios.config";
import useAuth from "./useAuth";
import { useEffect, useState } from "react";
import { Meal } from "@/types";
import { useRecoilState } from "recoil";
import { mealsState, mostRecentMealState } from "@/atoms";

export default function useMeals() {
    const { user } = useAuth();
    const [meals, setMeals] = useRecoilState(mealsState);
    const [creatingMeal, setCreatingMeal] = useState(false);
    const [_, setMostRecentMeal] = useRecoilState(mostRecentMealState);

    const { error, mutate } = useSWR("/meals", async () => {
        if (!user) setMeals([]);
        const { data } = await axios.get(`/meals/by-user/${user?.id}`);
        setMeals(data.meals);
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
            mutate();
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