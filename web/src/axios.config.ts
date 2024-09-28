import _ from "axios";

const axios = _.create({
    baseURL: "http://157.173.127.185:8000/",
});

export default axios;