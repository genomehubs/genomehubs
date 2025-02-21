export const themeFromContext = (context) => {
  return context.theme || context.parameters.theme || context.globals.theme;
};
