import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme) => ({
  root: {},
  icon: {
    color: theme.palette.text.secondary,
    marginRight: "16px",
  },
  formControl: {
    marginTop: "16px",
    minWidth: "600px",
  },
  searchButton: {
    fontSize: "2em",
    marginLeft: "8px",
    backgroundColor: "inherit",
    height: "48px",
    lineHeight: "48px",
  },
}));
