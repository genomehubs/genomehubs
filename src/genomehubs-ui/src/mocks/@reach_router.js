export const useNavigate = () => () => {};
export const useLocation = () => ({
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
});
export const Link = ({ to, children, ...props }) => {
  const { pathname, search, hash } = useLocation();
  const { basename } = props;
  if (basename) {
    to = to.replace(basename, "");
  }
  if (to && to.startsWith("http")) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  if (to) {
    to = basename + "/" + to + (props.plain ? "" : search + hash);
  }
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
};
export const Router = ({ children }) => <>{children}</>;
export const Route = ({ path, children }) => <>{children}</>;
export const Redirect = ({ to }) => {
  window.location = to;
  return null;
};
export const useParams = () => ({});
export const useMatch = () => ({
  params: {},
  pathname: "/",
  pattern: {},
  isExact: true,
  url: "/",
});
