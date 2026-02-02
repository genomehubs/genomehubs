import Grid from "@mui/material/Grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Typography from "@mui/material/Typography";
import { useStyles } from "./SearchBoxStyles";

export const AutoCompleteSuggestion = ({ option, ...props }) => {
  const classes = useStyles();
  return (
    <li {...props}>
      <Grid container alignItems="center">
        <Grid>
          <HelpOutlineIcon className={classes.icon} />
        </Grid>
        <Grid size="grow">
          <Typography variant="body2" color="textSecondary">
            Did you mean
          </Typography>
          <div>{option.value}</div>
        </Grid>
      </Grid>
    </li>
  );
};

export default AutoCompleteSuggestion;
