import toast from "react-hot-toast";

export const showApiError = (err) => {
  const message = err?.response?.data?.message || "خطایی رخ داد";
  if (Array.isArray(message)) {
    message.forEach((msg) => toast.error(msg));
  } else {
    toast.error(message);
  }
};
