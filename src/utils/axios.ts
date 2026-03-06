import axios from "axios";
import Cookies from "js-cookie";

// Helper function to create Axios instance for a specific API version
const createAxiosInstance = (version: string) => {
    const instance = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_APP_URL}/api/${version}`,
        withCredentials: true,
        // Don't set Content-Type here because it will be dynamic per request
    });

    instance.interceptors.request.use(
        (config) => {
            const csrftoken = Cookies.get("csrftoken");
            if (csrftoken) {
                config.headers = config.headers || {};
                config.headers["X-CSRFToken"] = csrftoken;
            }

            // Dynamically set Content-Type based on data type
            if (config.data instanceof FormData) {
                config.headers["Content-Type"] = "multipart/form-data";
            } else {
                // Only set JSON if Content-Type is not already set by user
                if (!config.headers["Content-Type"]) {
                    config.headers["Content-Type"] = "application/json";
                }
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    return instance;
};

// Export instances for different versions
export const apiV1 = createAxiosInstance("v1");
export const apiV2 = createAxiosInstance("v2");
export const apiV3 = createAxiosInstance("v3");

