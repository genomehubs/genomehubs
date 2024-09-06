import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme) => ({
  icon: {
    color: "black", // theme.palette.text.secondary,
    marginRight: "16px",
  },
  formControl: {
    marginTop: "16px",
    minWidth: "600px",
  },
  search: {
    fontSize: "2em",
    marginLeft: "8px",
    backgroundColor: "inherit",
  },
}));
