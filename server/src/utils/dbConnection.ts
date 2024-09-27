import mongoose = require("mongoose");


const dbUrl = process.env.MONGOURL as string;

export const dbConnection = async () => {
    await mongoose.connect(dbUrl);
};
