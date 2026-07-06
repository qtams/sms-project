const API_DEBUG_ENABLED = true;

const API_BASE_URL = "/api/debug";

const isFileValue = (value) => {
  return typeof File !== "undefined" && value instanceof File;
};

const hasFileInPayload = (payload) => {
  if (!payload || typeof payload !== "object") return false;

  return Object.values(payload).some((value) => {
    if (isFileValue(value)) return true;

    if (Array.isArray(value)) {
      return value.some((item) => hasFileInPayload(item));
    }

    if (value && typeof value === "object") {
      return hasFileInPayload(value);
    }

    return false;
  });
};

const getConsolePayload = (payload) => {
  if (isFileValue(payload)) {
    return {
      fileName: payload.name,
      fileType: payload.type,
      fileSize: payload.size,
    };
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => getConsolePayload(item));
  }

  if (payload && typeof payload === "object") {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [
        key,
        getConsolePayload(value),
      ]),
    );
  }

  return payload;
};

const appendFormData = (formData, key, value) => {
  if (value === undefined || value === null) return;

  if (isFileValue(value)) {
    formData.append(key, value);
    return;
  }

  if (Array.isArray(value) || typeof value === "object") {
    formData.append(key, JSON.stringify(getConsolePayload(value)));
    return;
  }

  formData.append(key, String(value));
};

export const apiDebugRequest = async ({
  module = "unknown",
  action = "unknown",
  method = "POST",
  payload = {},
}) => {
  if (!API_DEBUG_ENABLED) return null;

  const endpoint = `${API_BASE_URL}/${module}/${action}`;
  const hasFile = hasFileInPayload(payload);

  console.groupCollapsed(
    `%cAPI REQUEST%c ${method} ${endpoint}`,
    "color:#03a4d3;font-weight:900;",
    "color:#fb920e;font-weight:900;",
  );
  console.log("Payload:", getConsolePayload(payload));
  console.log("Has File:", hasFile);
  console.groupEnd();

  try {
    let fetchOptions = {
      method,
    };

    if (hasFile) {
      const formData = new FormData();

      formData.append("module", module);
      formData.append("action", action);
      formData.append("method", method);
      formData.append("endpoint", endpoint);
      formData.append("timestamp", new Date().toISOString());

      Object.entries(payload).forEach(([key, value]) => {
        appendFormData(formData, key, value);
      });

      fetchOptions.body = formData;
    } else {
      fetchOptions.headers = {
        "Content-Type": "application/json",
      };

      fetchOptions.body = JSON.stringify({
        module,
        action,
        method,
        endpoint,
        payload: getConsolePayload(payload),
        timestamp: new Date().toISOString(),
      });
    }

    const response = await fetch(endpoint, fetchOptions);

    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      hasFile,
    };
  } catch (error) {
    console.warn("API request failed:", {
      endpoint,
      error,
    });

    return {
      ok: false,
      status: 0,
      endpoint,
      hasFile,
      error,
    };
  }
};
