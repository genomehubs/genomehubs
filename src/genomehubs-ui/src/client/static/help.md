# Help

Add text for the help page to help.md.

This page should be replaced with user-oriented help text. This example page provides a technical guide to using the available markdown syntax.

Use standard markdown syntax and GenomeHubs directives:

## `:hub`

```
Loads the `GH_SITENAME` environment variable to define the site name as :hub.
```

Loads the `GH_SITENAME` environment variable to define the site name as :hub.

## `:span`

```
Use :span to wrap text and optionally apply styles. Available styles are :span[direct]{.direct}, :span[descendant]{.descendant} and :span[ancestor]{.ancestor}.
```

Use :span to wrap text and optionally apply styles. Available styles are :span[direct]{.direct}, :span[descendant]{.descendant} and :span[ancestor]{.ancestor}.

## `:tooltip`

```
Display a tooltip around :tooltip[any text]{title="first tooltip"} or component :tooltip[:span[like this]]{title="second tooltip" arrow placement="right"}.
```

Display a tooltip around :tooltip[any text]{arrow title="first tooltip"} or component :tooltip[:span[like this]{.direct}]{title="second tooltip" arrow placement=right}.

## `:::grid` and `::item`

```
:::grid{container direction="row"}

::item[Control layout using `:::grid` and `::item` to specify [MUI grid](https://mui.com/components/grid/) options.]{xs=6}

::item[Page width is divided into 12 units so a 2 column layout can be achieved using `::item[content]{xs=6}` inside a `:::grid`]{xs=6}

:::
```

:::grid{container direction="row"}

::item[Control layout using `:::grid` and `::item` to specify [MUI grid](https://mui.com/components/grid/) options.]{xs=6}

::item[Page width is divided into 12 units so a 2 column layout can be achieved using `::item[content]{xs=6}` inside a `:::grid`]{xs=6}

:::

## `::report`

Use `::report` to embed histograms, scatterplots, trees and more report types. These are dependent on the data in a GenomeHubs so please refer to [goat-ui](https://github.com/genomehubs.goat-ui) for some examples, and see the live reports at [goat.genomehubs.org](https://goat.genomehubs.org).
