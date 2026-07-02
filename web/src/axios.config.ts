import _ from "axios";

const baseURL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    "http://localhost:8000";

const axios = _.create({
    baseURL: baseURL.endsWith("/") ? baseURL : `${baseURL}/`,
});

export default axios;
