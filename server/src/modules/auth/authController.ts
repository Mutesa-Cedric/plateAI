import { comparePassword, hashPassword } from "../../utils/bcrypt";
import { generateToken } from "../../utils/jwt";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;

function publicUser(user: Record<string, unknown>) {
    if (!user) return user;
    const { password: _pw, ...safe } = user;
    return safe;
}

function pickRegistrationFields(body: any) {
    return {
        firstName: String(body.firstName || "").trim(),
        lastName: String(body.lastName || "").trim(),
        email: String(body.email || "").trim().toLowerCase(),
        password: String(body.password || ""),
        age: body.age !== undefined && body.age !== null && body.age !== ""
            ? Number(body.age)
            : undefined,
        weight:
            body.weight !== undefined && body.weight !== null && body.weight !== ""
                ? Number(body.weight)
                : undefined,
        height:
            body.height !== undefined && body.height !== null && body.height !== ""
                ? Number(body.height)
                : undefined,
        purpose: body.purpose || undefined,
        gender: body.gender || undefined,
    };
}

export default class AuthController {
    public static async createUser(req, res) {
        try {
            const fields = pickRegistrationFields(req.body || {});

            if (!fields.firstName || !fields.lastName) {
                return res
                    .status(400)
                    .json({ message: "firstName and lastName are required" });
            }
            if (!fields.email || !EMAIL_RE.test(fields.email)) {
                return res.status(400).json({ message: "Valid email is required" });
            }
            if (!fields.password || fields.password.length < MIN_PASSWORD_LEN) {
                return res.status(400).json({
                    message: `Password must be at least ${MIN_PASSWORD_LEN} characters`,
                });
            }

            const existingUser = await prisma.user.findUnique({
                where: { email: fields.email },
            });
            if (existingUser) {
                return res.status(400).json({
                    message: "User with that email already exists",
                });
            }

            const data: any = {
                firstName: fields.firstName,
                lastName: fields.lastName,
                email: fields.email,
                password: await hashPassword(fields.password),
            };
            if (fields.age !== undefined && !Number.isNaN(fields.age)) data.age = fields.age;
            if (fields.weight !== undefined && !Number.isNaN(fields.weight))
                data.weight = fields.weight;
            if (fields.height !== undefined && !Number.isNaN(fields.height))
                data.height = fields.height;
            if (fields.purpose) data.purpose = fields.purpose;
            if (fields.gender) data.gender = fields.gender;

            const newUser = await prisma.user.create({ data });
            const token = generateToken(newUser.id);

            res.setHeader("Authorization", `Bearer ${token}`);
            res.status(201).json({
                success: true,
                user: publicUser(newUser),
                token,
            });
        } catch (error) {
            console.error("createUser error", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    public static async login(req, res) {
        try {
            const email = String(req.body?.email || "")
                .trim()
                .toLowerCase();
            const password = String(req.body?.password || "");

            // Never log passwords (AUTH-02).
            console.log("login attempt", { email: email ? "[present]" : "[missing]" });

            if (!email || !password) {
                return res
                    .status(400)
                    .json({ message: "Email and password are required" });
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res
                    .status(401)
                    .json({ message: "Invalid email or password" });
            }

            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                return res
                    .status(401)
                    .json({ message: "Invalid email or password" });
            }

            const token = generateToken(user.id);
            res.setHeader("Authorization", `Bearer ${token}`);
            res.status(200).json({
                success: true,
                user: publicUser(user),
                token,
            });
        } catch (error) {
            console.error("login error", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    public static async logout(_req, res) {
        try {
            res.setHeader("Authorization", "Bearer ");
            res.status(200).json({
                success: true,
                message: "Logout successful",
            });
        } catch (error) {
            console.error("logout error", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    public static async getUser(req, res) {
        try {
            const userId = (req as any).userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    age: true,
                    weight: true,
                    height: true,
                    purpose: true,
                    gender: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            res.status(200).json({ success: true, user });
        } catch (error) {
            console.error("getUser error", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}
