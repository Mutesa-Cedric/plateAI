import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = await hash('password123', 10);

    const demo = await prisma.user.upsert({
        where: { email: 'demo@plateai.com' },
        update: {},
        create: {
            firstName: 'Demo',
            lastName:  'User',
            email:     'demo@plateai.com',
            password,
            age:       25,
            weight:    70.0,
            height:    175.0,
            purpose:   'MAINTAIN',
            gender:    'MALE',
        },
    });

    // foodItems is Json in PostgreSQL and String in SQLite.
    // JSON.stringify works for both: Prisma stores it as-is for Json, and as a
    // plain text string for String. The app reads it back and the mobile parses it.
    const foodItems = JSON.stringify([
        { food_item: 'Rice',     calories: '206', carbohydrates: '45g', proteins: '4g',   sodium: '1mg',  fats: '0.4g' },
        { food_item: 'Chicken',  calories: '165', carbohydrates: '0g',  proteins: '31g',  sodium: '74mg', fats: '3.6g' },
        { food_item: 'Broccoli', calories: '55',  carbohydrates: '11g', proteins: '3.7g', sodium: '33mg', fats: '0.6g' },
    ]);

    await prisma.meal.upsert({
        where: { id: 'seed-meal-001' },
        update: {},
        create: {
            id:        'seed-meal-001',
            userId:    demo.id,
            image:     '',
            foodItems,
        },
    });

    console.log(`Seeded demo user: ${demo.email}  (password: password123)`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
