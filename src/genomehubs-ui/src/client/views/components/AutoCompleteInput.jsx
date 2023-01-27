import React, { memo, useRef, useState } from "react";

import AutoCompleteOption from "./AutoCompleteOption";
import AutoCompleteSuggestion from "./AutoCompleteSuggestion";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { PlacedPopper } from "./SearchBox";
import TextField from "@material-ui/core/TextField";
import { compose } from "recompose";
// import dispatchLiveQuery from "../hocs/dispatchLiveQuery";
import styles from "./Styles.scss";
import withAutocomplete from "../hocs/withAutocomplete";
// import withSearchDefaults from "../hocs/withSearchDefaults";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

export const AutoCompleteInput = ({
  id = "main-search",
  required,
  error,
  searchDefaults,
  inputValue,
  setInputValue,
  inputRef,
  inputLabel,
  inputName,
  multiline,
  setMultiline = () => {},
  autocompleteTerms,
  fetchAutocomplete,
  resetAutocomplete,
  handleSubmit = () => {},
  doSearch = () => {},
  size = "medium",
  maxRows = 5,
  types,
  taxonomy,
  result,
  fixedType,
  multipart,
  setLiveQuery = () => {},
  inputClassName = "autocompleteInput",
}) => {
  const [open, setOpen] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [subTerm, setSubTerm] = useState("");
  const [activeLookup, setActiveLookup] = useState(null);
  let terms;
  let options = [];

  if (!inputRef) {
    inputRef = useRef(null);
  }
  const outerRef = useRef(null);
  // let inValue = inputValue;
  // if (!setInputValue) {
  const [inValue, setInValue] = useState(inputValue);
  // }
  if (
    autocompleteTerms.status &&
    autocompleteTerms.status.success &&
    autocompleteTerms.results &&
    autocompleteTerms.results.length > 0
  ) {
    terms = [];
    autocompleteTerms.results.forEach((result, i) => {
      let value;
      if (result.result.type) {
        let display_value = result.result.name || result.result.key;
        let value = display_value;
        if (result.result.after && !suffix.startsWith(result.result.after)) {
          value += result.result.after;
        }
        options.push({
          value,
          display_value,
          description: result.result.description,
          name: result.result.display_name,
          type: result.result.type,
          title: `${prefix}${value}${suffix}`,
          prefix,
          subTerm,
          suffix,
          result: result.result.group,
          unique_term: value,
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{result.key}</span>
            <div className={styles.extra}>{`\u2014 ${result.type}`}</div>
          </div>
        );
      } else {
        if (autocompleteTerms.status.result == "taxon") {
          if (result.reason) {
            value = result.reason[0].fields["taxon_names.name.raw"][0];
          } else {
            value = result.result.scientific_name;
          }
          let extra = "";
          let closure = "";
          if (!prefix.match(/tax_\w+\(\s*/)) {
            extra = "tax_name(";
            if (!suffix.match(/^\s*\($/)) {
              closure = ")";
            }
          }
          let title = `${prefix}${extra}${result.result.taxon_id}[${value}]${closure}${suffix}`;

          options.push({
            value,
            title,
            prefix,
            subTerm,
            suffix,
            result: "taxon",
            unique_term: result.result.taxon_id,
            taxon_id: result.result.taxon_id,
            taxon_rank: result.result.taxon_rank,
            scientific_name: result.result.scientific_name,
            name_class: result.reason
              ? result.reason[0].fields["taxon_names.class"]
              : "taxon ID",
            xref: Boolean(
              result.reason &&
                result.reason[0].fields["taxon_names.class"] &&
                !result.reason[0].fields["taxon_names.class"][0].match(" name")
            ),
          });
          terms.push(
            <div key={i} className={styles.term}>
              <span className={styles.value}>{value}</span>
              <div
                className={styles.extra}
              >{`\u2014 ${result.result.taxon_rank}`}</div>
            </div>
          );
        } else if (
          autocompleteTerms.status.result == "assembly" ||
          autocompleteTerms.status.result == "sample"
        ) {
          if (result.reason) {
            value = result.reason[0].fields["identifiers.identifier.raw"][0];
          } else {
            value = result.result[`${autocompleteTerms.status.result}_id`];
          }
          options.push({
            value,
            title: `${prefix}${value}${suffix}`,
            prefix,
            subTerm,
            suffix,
            result: autocompleteTerms.status.result,
            unique_term: result.result[`${autocompleteTerms.status.result}_id`],
            taxon_id: result.result.taxon_id,
            scientific_name: result.result.scientific_name,
            [`${autocompleteTerms.status.result}_id`]:
              result.result[`${autocompleteTerms.status.result}_id`],
            identifier_class: result.reason
              ? result.reason[0].fields["identifiers.class"]
              : `${autocompleteTerms.status.result} ID`,
          });
          terms.push(
            <div key={i} className={styles.term}>
              <span className={styles.value}>{value}</span>
              <div
                className={styles.extra}
              >{`\u2014 ${result.result.scientific_name}`}</div>
            </div>
          );
        } else if (autocompleteTerms.status.result == "feature") {
          if (result.reason) {
            value = result.reason[0].fields["identifiers.identifier.raw"][0];
          } else {
            value = result.result.feature_id;
          }
          options.push({
            value,
            title: `${prefix}${value}${suffix}`,
            prefix,
            subTerm,
            suffix,
            result: "feature",
            unique_term: result.result.feature_id,
            taxon_id: result.result.taxon_id,
            assembly_id: result.result.assembly_id,
            feature_id: result.result.feature_id,
            identifier_class: result.reason
              ? result.reason[0].fields["identifiers.class"]
              : "feature ID",
          });
          terms.push(
            <div key={i} className={styles.term}>
              <span className={styles.value}>{value}</span>
              <div
                className={styles.extra}
              >{`\u2014 ${result.result.primary_type}`}</div>
            </div>
          );
        }
      }
    });
  }
  if (
    autocompleteTerms.status &&
    autocompleteTerms.status.success &&
    autocompleteTerms.suggestions &&
    autocompleteTerms.suggestions.length > 0 &&
    !/[\(\)<>=]/.test(inputValue)
  ) {
    autocompleteTerms.suggestions.forEach((suggestion, i) => {
      let value = suggestion.suggestion.text;
      options.push({
        value,
        title: `${prefix}${value}${suffix}`,
        prefix,
        subTerm,
        suffix,
        unique_term: value,
        highlighted: suggestion.suggestion.highlighted,
      });
    });
  }
  if (options.length == 1 && options[0].value == options[0].subTerm) {
    // options = [];
  }

  const setLastType = (value, lastType, types) => {
    if (value.match(/(\)|\sAND\s)/i)) {
      return {};
    }
    value = value.replace(/^\s*/, "").replace(/\s*$/, "");
    if (value.length == 0) {
      return lastType;
    }
    if (value.match(/tax_(eq|lineage|name|tree)/)) {
      return { type: "taxon" };
    }
    if (value.match(/tax_rank/)) {
      return { type: "rank" };
    }
    if (lastType.name && value.match(/\s*(<|<=|=|!=|>=|>)\s*/i)) {
      return { ...lastType, operator: value };
    }
    if (lastType.name && lastType.operator) {
      return { ...lastType, value };
    }
    if (types[value]) {
      return types[value];
    }
    return lastType;
  };

  const updateTerm = (value, index, types) => {
    setInValue(value);
    clearTimeout(activeLookup);
    if (index < 1) {
      return;
    }
    if (inputRef.current.selectionEnd > inputRef.current.selectionStart) {
      return;
    }
    // let parts = value.split(/(\s{0,1}(?:<=|!=|>=|[\(\),!<=>]|and|AND)\s{0,1})/);
    let queryResult, separator;
    [queryResult, separator, value] = (value || "").split(/(--)/);
    if (!separator) {
      value = queryResult;
      queryResult = undefined;
    }
    let parts = (value || "").split(/(\s(?:<=|!=|>=|<|=|>|and)\s|[\(\),!])/i);
    let section = 0;
    let newPrefix = "";
    let newSuffix = "";
    let lastType = {};
    if (parts.length > 1) {
      let length = 0;
      for (let i = 0; i < parts.length; i++) {
        let end = length + parts[i].length;
        if (index == end && end == length) {
          newPrefix += parts[i];
          section = i;
        } else if (index >= end) {
          lastType = setLastType(parts[i], lastType, types);
          if (index == end) {
            if (i % 2 == 1) {
              newPrefix += parts[i];
            }
            section = i;
          } else {
            newPrefix += parts[i];
          }
        } else if (index > length) {
          lastType = setLastType(parts[i], lastType, types);
          section = i;
        } else {
          newSuffix += parts[i];
        }
        length = end;
      }
    }
    if (!newSuffix && newPrefix.match(/\(\s*$/)) {
      newSuffix = ")";
    }
    if (
      parts[section].match(
        /(\s(?:<=|!=|>=|<|=|>|and)\s|(?:\s{0,1}[\(\),!]\s{0,1})|^and\s)/i
      )
    ) {
      newPrefix += parts[section];
      section += 1;
    }
    if (section == parts.length) {
      parts.push("");
    }
    if (parts[section].match(/\s/) && !lastType.operator) {
      let bits = parts[section].split(/(\s+)/);
      if (types[bits[0]]) {
        let bit = bits.shift();
        if (types[bit]) {
          lastType = setLastType(bit, lastType, types);
          newPrefix += bit + bits[0];
          parts[section] = bits.join("");
        }
      }
    }
    setPrefix(newPrefix);
    setSuffix(newSuffix);
    setSubTerm(parts[section]);
    setActiveLookup(
      setTimeout(() => {
        fetchAutocomplete({
          lookupTerm: parts[section].replace(/^\s+/, ""),
          taxonomy,
          result:
            lastType?.type == "taxon"
              ? "taxon"
              : queryResult
              ? queryResult
              : newPrefix
              ? result
              : undefined,
          lastType: fixedType || lastType,
        });
      }, 200)
    );
  };

  const highlightRange = (text) => {
    let length = text
      ? text.length
      : inputRef.current?.value
      ? inputRef.current.value.length
      : 0;
    let end = length;
    end = length - suffix.length;
    return [prefix.length, end];
  };
  const handlePopperClose = (e, reason) => {
    if (e && reason == "select-option" && !prefix && !suffix) {
      setTimeout(() => {
        if (inputRef.current) {
          handleSubmit(null, {
            id,
            value: inputRef.current.value,
          });
        }
      }, 75);
    } else if (e) {
      let range = highlightRange();
      let current = inputRef.current;
      setTimeout(() => {
        range = highlightRange();
        try {
          current.setSelectionRange(...range);
        } catch (err) {
          // Ignore
        }
      }, 20);
      setTimeout(() => {
        try {
          let end = current.selectionEnd;
          if (end > current.selectionStart) {
            current.setSelectionRange(end, end);
          }
        } catch (err) {
          // Ignore
        }
      }, 750);
    }
  };
  const handleHighlightChange = (e, option, reason) => {
    if (multipart) {
      if (e && option) {
        if (reason == "mouse" && prefix.length == 0 && suffix.length == 0) {
          setInValue(option.title);
        }
        let range = highlightRange(option.title);
        setTimeout(() => {
          inputRef.current.setSelectionRange(...range);
        }, 20);
      }
    }
  };
  const updateValue = (value) => {
    if (multipart) {
      return;
    }
    if (typeof value !== "string") {
      return;
    }
    setInValue(value);
    if (setInputValue) {
      setInputValue(value);
    }
  };
  const handleChange = (e, newValue) => {
    if (newValue != inputValue) {
      if (!newValue.match(/[\r\n]/)) {
        setMultiline(false);
        updateTerm(newValue, e?.target?.selectionStart || prefix.length, types);
        setOpen(true);
      } else if (!multiline) {
        updateTerm(newValue, e.target.selectionStart, types);
        setOpen(true);
      }
      if (e) {
        if (e.key && e.key == "Enter") {
          updateValue(newValue);
        } else {
          setLiveQuery(e.target.value || " ");
        }
      }
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        setMultiline(true);
        setInValue(`${inputRef.current.value}\n`);
      } else if (!multiline) {
        handleSubmit(e, {
          id,
          value: inputRef.current.value,
        });
        // setInputValue(inputRef.current.value);
      }
      resetAutocomplete();
    }
  };

  const handleKeyDown = (e, newValue, reason) => {
    if (reason == "clear") {
      updateValue("");
      outerRef.current.blur();
      resetAutocomplete();
      return;
    }
    if (reason == "select-option") {
      updateValue(newValue.title);
      // setTimeout(() => {
      resetAutocomplete();
      if (multipart) {
        if (
          newValue.result == "assembly" ||
          newValue.result == "feature" ||
          newValue.result == "sample"
        ) {
          handleSubmit(e, {
            id,
            value: newValue.title,
            index: newValue.result,
          });
        } else {
          setInValue(newValue.title);
        }
      } else {
        handleSubmit(e, { id, value: newValue.title });
      }
      // }, 2000);

      outerRef.current.blur();
      return;
    }
    if (e.shiftKey) {
      handleKeyPress(e);
    } else if (newValue) {
      if (newValue.highlighted) {
        setOpen(true);
      } else {
        setOpen(false);
        if (newValue.type || prefix || suffix) {
          setInValue(newValue.title);
          // if (e.key === "Enter") {
          //   console.log(newValue);
          //   updateValue(newValue.title);
          // }
        } else {
          doSearch(
            newValue.unique_term || e.target.value,
            newValue.result || result || "taxon",
            newValue.title || e.target.value
          );
        }
      }
    } else {
      resetAutocomplete();
      setMultiline(false);
    }
  };
  const handleBlur = (e) => {
    setInputValue(e.target.value);
  };
  return (
    <Autocomplete
      id={id}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.title
      }
      getOptionSelected={(option, value) => option.title === value.title}
      options={options}
      autoComplete
      includeInputInList
      freeSolo
      value={inValue}
      open={open}
      size={size}
      ref={outerRef}
      clearOnBlur={true}
      onChange={handleKeyDown}
      onBlur={handleBlur}
      onClose={handlePopperClose}
      onInputChange={handleChange}
      onHighlightChange={handleHighlightChange}
      PopperComponent={PlacedPopper}
      renderInput={(params) => (
        <TextField
          onKeyPress={handleKeyPress}
          {...params}
          required={required}
          inputRef={inputRef}
          label={inputLabel}
          name={inputName}
          className={inputClassName}
          variant={size == "small" ? "standard" : "outlined"}
          fullWidth
          multiline={maxRows == 1 ? false : true}
          maxRows={maxRows}
          onClick={() => {
            resetAutocomplete();
          }}
        />
      )}
      renderOption={(option) => {
        if (option.highlighted) {
          return <AutoCompleteSuggestion option={option} />;
        }
        return <AutoCompleteOption option={option} />;
      }}
    />
  );
};

export default compose(
  memo,
  withTaxonomy,
  withTypes,
  withAutocomplete
  // withSearchDefaults
  // dispatchLiveQuery
)(AutoCompleteInput);
