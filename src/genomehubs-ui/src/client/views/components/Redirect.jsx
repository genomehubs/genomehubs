import React, { useEffect } from "react";

import { useLocation } from "@reach/router";
import useNavigate from "../hooks/useNavigate";

const Redirect = ({ to, location, replace }) => {
  const navigate = useNavigate();
  useEffect(() => {
    let path = `${to}${location.search}${location.hash}`;
    for (let [x, y] of Object.entries(replace)) {
      path = path.replaceAll(x, y);
    }
    navigate(path);
  }, []);
  return <span>redirecting</span>;
};

export default Redirect;
