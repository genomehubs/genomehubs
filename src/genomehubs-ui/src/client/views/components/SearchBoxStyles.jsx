import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme) => ({
  icon: {
    color: "black", // theme.palette.text.secondary,
    marginRight: 16,
  },
  formControl: {
    marginTop: 16,
    minWidth: "600px",
  },
  search: {
    fontSize: "2em",
    marginLeft: 8,
    backgroundColor: "inherit",
  },
}));
