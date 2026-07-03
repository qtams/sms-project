import { toast } from "react-toastify";

export const showSuccessToast = (message = "Success") => {
  toast.success(message);
};

export const showErrorToast = (message = "Something went wrong") => {
  toast.error(message);
};

export const showInfoToast = (message = "Information") => {
  toast.info(message);
};

export const showWarningToast = (message = "Warning") => {
  toast.warning(message);
};
