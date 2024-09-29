import { Request, Response } from "express";

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


export default class MealsController {
    public static async createMeal(req: Request, res: Response) {
        try {
            const meal = req.body;
            const userId = req.body.userId;

            const newMeal = await prisma.meal.create({
                data: {
                    image: meal.image,
                    foodItems: meal.foodItems,
                    user: {
                        connect: {
                            id: userId
                        }
                    }
                },
            });

            res.status(201).json({
                success: true,
                meal: newMeal,
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Internal Server Error"
            })
        }
    }

    public static async getUserMeals(req: Request, res: Response) {
        try {
            const { userId } = req.params

            const meals = await prisma.meal.findMany({
                where: {
                    userId
                },
                select: {
                    id: true,
                    foodItems: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            res.status(200).json({
                success: true,
                meals
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Internal Server Error"
            })
        }
    }

    public static async getMeal(req: Request, res: Response) {
        try {
            const { mealId } = req.params

            const meal = await prisma.meal.findUnique({
                where: {
                    id: mealId
                }
            });

            res.status(200).json({
                success: true,
                meal
            })
        } catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Internal Server Error"
            })
        }
    }
}