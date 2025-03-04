export const setSortBy = ({ sortBy, sortOrder, sortMode }) => {
  if(!sortBy){
    return sortBy;
  }
  if((typeof sortBy==="string" && sortBy.includes(","))|| Array.isArray(sortBy)){
    const fields=Array.isArray(sortBy)?sortBy:sortBy.split(",");
    const orders= sortOrder?(typeof sortOrder==="string"?sortOrder.split(","):sortOrder):[];
    const modes= sortMode?(typeof sortMode==="string"?sortMode.split(","):sortMode):[];
    return fields.map((field,index)=>{
      const sort={by:field};
      sort.order=orders[index]!== undefined?orders[index]:"asc";
      sort.mode=modes[index]!== undefined?modes[index]:"max";
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

export default setSortBy;
