export const setSortBy = ({ sortBy, sortOrder, sortMode }) => {
  if (!sortBy) {
    return sortBy;
  }
  const validOrders = ["asc", "desc"];
  const validModes = ["min", "max", "avg", "median", "sum"];
  if (
    (typeof sortBy === "string" && sortBy.includes(",")) ||
    Array.isArray(sortBy)
  ) {
    const fields = Array.isArray(sortBy) ? sortBy : sortBy.split(",");
    const orders = parseValues(sortOrder);
    const modes = parseValues(sortMode);
    const modeValidation = validateValues(modes, validModes);
    if (modeValidation) {
      return modeValidation;
    }
    const orderValidation = validateValues(orders, validOrders);
    if (orderValidation) {
      return orderValidation;
    }
    return fields.map((field, index) => ({
      by: field,
      order: getValueWithFallback(orders, index, "asc"),
      mode: getValueWithFallback(modes, index, "max"),
    }));
  }
  const orderValidation = validateValues(sortOrder, validOrders);
  if (orderValidation) {
    return orderValidation;
  }
  const modeValidation = validateValues(sortMode, validModes);
  if (modeValidation) {
    return modeValidation;
  }
  return {
    by: sortBy,
    ...(sortOrder && { order: sortOrder }),
    ...(sortMode && { mode: sortMode }),
  };
};

const parseValues = (value) => {
  if (!value) return [];
  return typeof value === "string" ? value.split(",") : value;
};

const getValueWithFallback = (value, index, fallback) => {
  return value[index] !== undefined
    ? value[index]
    : value.length > 0
    ? value[value.length - 1]
    : fallback;
};

const validateValues = (values, validValues) => {
  if (Array.isArray(values)) {
    for (let value of values) {
      if (value && !validValues.includes(value)) {
        return {
          status: {
            success: false,
            error: `Invalid value: ${value}. Valid values are: ${validValues.join(
              ","
            )}`,
          },
        };
      }
    }
  } else if (values && !validValues.includes(values)) {
    return {
      status: {
        success: false,
        error: `Invalid value: ${values}. Valid values are: ${validValues.join(
          ","
        )}`,
      },
    };
  }
  return null;
};

export default setSortBy;
