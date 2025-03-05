export const setSortBy = ({ sortBy, sortOrder, sortMode }) => {
  if(!sortBy){
    return sortBy;
  }
  if((typeof sortBy==="string" && sortBy.includes(","))|| Array.isArray(sortBy)){
    const fields=Array.isArray(sortBy)?sortBy:sortBy.split(",");
    const orders= parseValues(sortOrder);
    const modes= parseValues(sortMode);
    return fields.map((field,index)=>{
      const sort={by:field};
      sort.order=getValueWithFallback(orders, index, "asc");
      sort.mode=getValueWithFallback(modes, index, "max")
      return sort;
    })
  }
  let sort = {};
  sort.by = sortBy;
  if (sortOrder) {
    sort.order = sortOrder;
  }
  if (sortMode) {
    sort.mode = sortMode;
  }
  sortBy = sort;
  return sortBy;
};

const parseValues = (value) => {  
  if (!value) return [];  
  return typeof value === "string" ? value.split(",") : value;  
};  

const getValueWithFallback = (value,index, fallback) => {
  return value[index] !==undefined ? value[index] : (value.length > 0 ? value[value.length - 1] : fallback)
}

export default setSortBy;
