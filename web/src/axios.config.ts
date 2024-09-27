import _ from "axios";

const axios = _.create({
    baseURL: "http://localhost:8000",
});

export default axios;