const getPrimaryAssemblyId = (record) => {
  if (!record || !record.record) {
    return;
  }
  if (record.record.assembly_id) {
    return record.record.assembly_id;
  }

  if (
    record.record.attributes &&
    record.record.attributes.assembly_level &&
    record.record.attributes.assembly_level.values
  ) {
    let primary = record.record.attributes.assembly_level.values.find(
      (o) => o.is_primary,
    );
    if (primary) {
      return primary.source_id;
    }
  }
};

export default getPrimaryAssemblyId;
