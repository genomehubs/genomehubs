import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    backgroundColor: theme.palette.background.paper,
    border: "none",
    boxShadow: "none",
    padding: "10px",
    overflow: "visible",
    "&:focus": {
      outline: "none",
    },
  },
  img: {},
}));
