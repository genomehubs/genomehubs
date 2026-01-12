import LogoBoat from "./LogoBoat";
import LogoBtk from "./LogoBtk";
import LogoGoat from "./LogoGoat";
import LogoIsopoDB from "./LogoIsopoDB";
import LogoLepbase from "./LogoLepbase";
import LogoMolluscDB from "./LogoMolluscDB";

const logos = {
  goat: LogoGoat,
  boat: LogoBoat,
  molluscdb: LogoMolluscDB,
  lepbase: LogoLepbase,
  btk: LogoBtk,
  isopodb: LogoIsopoDB,
};

function getEnvLogoKey() {
  const env = typeof window !== "undefined" ? window.process?.ENV : undefined;
  // Infer solely from GH_SITENAME
  const site = (env?.GH_SITENAME || "").toString().toLowerCase();
  if (site.includes("goat")) return "goat";
  if (site.includes("boat")) return "boat";
  if (site.includes("mollusc")) return "molluscdb";
  if (site.includes("lepbase")) return "lepbase";
  if (site.includes("isopodb")) return "isopodb";
  if (site.includes("btk")) return "btk";
  return "goat"; // default
}

const Logo = logos[getEnvLogoKey()] || LogoGoat;

export default Logo;
