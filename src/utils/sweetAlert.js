import Swal from "sweetalert2";

export const showSuccessAlert = (title = "Success", text = "") => {
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonColor: "#2563eb",
  });
};

export const showErrorAlert = (title = "Error", text = "") => {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonColor: "#dc2626",
  });
};

export const showConfirmAlert = ({
  title = "Are you sure?",
  text = "",
  confirmButtonText = "Yes",
  cancelButtonText = "Cancel",
} = {}) => {
  return Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#2563eb",
  });
};
