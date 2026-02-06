export const simpleCount = (json) => {
  if (json && json.status && json.status.success) {
    return json.status.hits;
  }
  return 0;
};

export const fieldCount = (json) => {
  if (json && json.status && json.status.success && json.status.hits >= 1) {
    return Object.values(json.results[0].result.fields).filter(
      (value) => value && Object.keys(value).length > 0,
    ).length;
  }
  return 0;
};

export const valueCount = (json) => {
  if (json && json.status && json.status.success && json.status.hits >= 1) {
    let value;
    try {
      ({ value } = json.results[0].result.fields[json.fields[0]]);
    } catch {
      return 0;
    }
    if (Array.isArray(value)) {
      return value.length;
    }
    return 1;
  }
  return 0;
};
