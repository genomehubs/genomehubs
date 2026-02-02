import CategoryIcon from "@mui/icons-material/Category";
import EmojiNatureIcon from "@mui/icons-material/EmojiNature";
import ExtensionIcon from "@mui/icons-material/Extension";
import FunctionsIcon from "@mui/icons-material/Functions";
import Grid from "@mui/material/Grid";
import LineStyleIcon from "@mui/icons-material/LineStyle";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import PersonPinCircleIcon from "@mui/icons-material/PersonPinCircle";
import SearchIcon from "@mui/icons-material/Search";
import TodayIcon from "@mui/icons-material/Today";
import Typography from "@mui/material/Typography";
import { useStyles } from "./SearchBoxStyles";

export const AutoCompleteOption = ({ option, ...props }) => {
  const classes = useStyles();
  let primaryText, secondaryText;
  let optionIcon = <SearchIcon className={classes.icon} />;
  if (option.result == "taxon" && option.taxon_id) {
    optionIcon = <EmojiNatureIcon className={classes.icon} />;
    option.string = `${option.negate ? "!" : ""}${option.taxon_id}[${option.scientific_name}]`;
  } else if (option.result == "assembly") {
    optionIcon = <ExtensionIcon className={classes.icon} />;
    // option.string = option.value;
  } else if (option.result == "sample") {
    optionIcon = <PersonPinCircleIcon className={classes.icon} />;
  } else if (option.result == "feature") {
    optionIcon = (
      <LineStyleIcon
        className={classes.icon}
        style={{ transform: "rotate(180deg)" }}
      />
    );
  }
  if (option.name_class) {
    primaryText = (
      <>
        {option.xref && (
          <div style={{ display: "inline-block" }}>
            <Typography variant="body2" color="textSecondary">
              {`${option.name_class}:`}
            </Typography>
          </div>
        )}
        {option.xref && " "}
        {option.value}
      </>
    );
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.taxon_rank}
        {option.name_class != "scientific name" &&
          option.name_class != "taxon ID" && (
            <span>: {option.scientific_name}</span>
          )}
      </Typography>
    );
  } else if (option.identifier_class) {
    primaryText = (
      <>
        {option.xref && (
          <div style={{ display: "inline-block" }}>
            <Typography variant="body2" color="textSecondary">
              {`${option.identifier_class}:`}
            </Typography>
          </div>
        )}
        {option.xref && " "}
        {option.value}
      </>
    );
    if (option.result == "assembly" || option.result == "sample") {
      secondaryText = option.value !== option.record_id && (
        <Typography variant="body2" color="textSecondary">
          {option.record_id}
        </Typography>
      );
    } else {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.feature_id}
        </Typography>
      );
    }
  } else if (option.record_id) {
    primaryText = option.record_id;
  } else if (option.type) {
    if (option.type == "rank") {
      optionIcon = (
        <LineStyleIcon
          className={classes.icon}
          style={{ transform: "rotate(-90deg)" }}
        />
      );
      option.string = `${option.negate ? "!" : ""}${option.title}`;
    } else if (option.type == "date") {
      optionIcon = <TodayIcon className={classes.icon} />;
    } else if (option.type == "keyword") {
      optionIcon = <CategoryIcon className={classes.icon} />;
    } else if (option.type == "operator") {
      optionIcon = <FunctionsIcon className={classes.icon} />;
    } else {
      optionIcon = <LooksOneIcon className={classes.icon} />;
    }
    primaryText = option.display_value || option.unique_term;
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.type}
      </Typography>
    );
  } else if (typeof option === "string") {
    optionIcon = null;
    primaryText = option;
    secondaryText = null;
  }

  let item = (
    <Grid size="grow">
      <div>{primaryText}</div>
      <span style={{ float: "right" }}>
        <Typography variant="body2" color="textSecondary">
          {(option.name_class && option.taxon_id) ||
            (option.identifier_class && option.scientific_name) ||
            option.assembly_id ||
            option.description ||
            option.name ||
            ""}
        </Typography>
      </span>
      {secondaryText}
    </Grid>
  );

  return (
    <li {...props} key={option.string}>
      <Grid container alignItems="center" size={12}>
        {optionIcon && <Grid>{optionIcon}</Grid>}
        {item}
      </Grid>
    </li>
  );
};

export default AutoCompleteOption;
