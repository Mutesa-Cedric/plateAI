import { Response } from "express";
import { AuthedRequest } from "../../middlewares/auth";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

export default class MealsController {
    public static async createMeal(req: AuthedRequest, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Ignore client-supplied userId (IDOR prevention).
            const meal = req.body || {};
            if (!meal.foodItems) {
                return res.status(400).json({ message: "foodItems is required" });
            }

            const newMeal = await prisma.meal.create({
                data: {
                    image: meal.image || "",
                    foodItems: meal.foodItems,
                    user: { connect: { id: userId } },
                },
            });

            res.status(201).json({
                success: true,
                meal: newMeal,
            });
        } catch (error) {
            console.error("createMeal", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    public static async getUserMeals(req: AuthedRequest, res: Response) {
        try {
            const authedId = req.userId;
            const { userId } = req.params;

            if (!authedId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            // Only the owner may list their meals.
            if (userId !== authedId) {
                return res.status(403).json({ message: "Forbidden" });
            }

            const meals = await prisma.meal.findMany({
                where: { userId: authedId },
                select: {
                    id: true,
                    foodItems: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: "desc" },
            });

            res.status(200).json({
                success: true,
                meals,
            });
        } catch (error) {
            console.error("getUserMeals", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    public static async getMeal(req: AuthedRequest, res: Response) {
        try {
            const authedId = req.userId;
            const { mealId } = req.params;
            if (!authedId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const meal = await prisma.meal.findUnique({
                where: { id: mealId },
            });

            if (!meal) {
                return res.status(404).json({ message: "Meal not found" });
            }
            if (meal.userId !== authedId) {
                return res.status(403).json({ message: "Forbidden" });
            }

            res.status(200).json({
                success: true,
                meal,
            });
        } catch (error) {
            console.error("getMeal", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
