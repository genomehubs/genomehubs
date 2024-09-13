import React, { useEffect, useState } from "react";

import Tooltip from "./Tooltip";
import fillValues from "../functions/fillValues";
import formats from "../functions/formats";

export const DisplayCount = ({
  description,
  values,
  handleClick,
  count,
  suffix,
  suffix_plural,
  label,
  unit,
  inline,
}) => {
  let formattedValue;
  try {
    if (inline) {
      formattedValue = (
        <Tooltip
          title={fillValues(description, values)}
          arrow
          placement={"top"}
        >
          <span style={{ cursor: "pointer" }} onClick={handleClick}>
            {label && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginRight: "0.25em",
                }}
              >
                {label}
              </span>
            )}
            <span
              style={{
                fontWeight: "bold",
                display: "inline-flex",
                alignItems: "center",
                opacity: count == "..." ? 0.5 : 1,
              }}
            >
              {Number.isNaN(count)
                ? count
                : formats(count, `${count}`.match(/\./) ? "float" : "integer")}
              {unit}
            </span>
            {suffix ||
              (suffix_plural && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginLeft: "0.25em",
                  }}
                >
                  {count == 1
                    ? fillValues(suffix, values)
                    : suffix_plural
                      ? fillValues(suffix_plural, values)
                      : fillValues(suffix, values)}
                </span>
              ))}
          </span>
        </Tooltip>
      );
    } else {
      formattedValue = (
        <div
          style={{ display: "flex", whiteSpace: "nowrap", maxHeight: "3em" }}
        >
          <Tooltip
            title={fillValues(description, values)}
            arrow
            placement={"top"}
          >
            <span style={{ cursor: "pointer" }} onClick={handleClick}>
              {label && (
                <span
                  style={{
                    fontSize: "1.5em",
                    minHeight: "2em",
                    display: "inline-flex",
                    alignItems: "center",
                    marginRight: "0.25em",
                  }}
                >
                  {label}
                </span>
              )}
              <span
                style={{
                  fontSize: "2em",
                  fontWeight: "bold",
                  display: "inline-flex",
                  alignItems: "center",
                  opacity: count == "..." ? 0.5 : 1,
                }}
              >
                {Number.isNaN(count)
                  ? count
                  : formats(
                      count,
                      `${count}`.match(/\./) ? "float" : "integer",
                    )}
                {unit}
              </span>
              <span
                style={{
                  fontSize: "1.5em",
                  minHeight: "2em",
                  display: "inline-flex",
                  alignItems: "center",
                  marginLeft: "0.25em",
                }}
              >
                {count == 1
                  ? fillValues(suffix, values)
                  : suffix_plural
                    ? fillValues(suffix_plural, values)
                    : fillValues(suffix, values)}
              </span>
            </span>
          </Tooltip>
        </div>
      );
    }
  } catch (err) {
    console.log(err);
    return null;
  }
  return formattedValue;
};

export default DisplayCount;
