# PHASE 1: GenomeHubs UI Component Structure Inventory

**Analysis Date:** 5 May 2026  
**Status:** Complete  
**Total Components:** 214

---

## Executive Summary

This document provides a comprehensive inventory of all React components in the GenomeHubs UI (`src/client/views/components`). The analysis covers 214 component files organized across a root directory and 8 feature-specific subdirectories.

### Quick Stats

| Metric                 | Value       | Notes                                                                                                          |
| ---------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| **Total Components**   | 214         | .jsx and .js files (excluding tests/stories)                                                                   |
| **Components by Type** | 7 types     | Utility, Display, Report-specific, Form, Container, Layout, Wrapper                                            |
| **HOC Usage**          | 73% (156)   | Primarily withStyles and withRouter                                                                            |
| **Redux Usage**        | 0%          | Modern hooks-based architecture                                                                                |
| **Storybook Coverage** | 9.8% (21)   | Gaps in Container/Report coverage                                                                              |
| **Subdirectories**     | 8           | ReportMap, ResultTable, ChipSearch, KeyValueChip, EditableText, AutowidthTextField, Carousel, Survey, wrappers |
| **Export Pattern**     | 84% Default | Named exports primarily in subdirectory indexes                                                                |

---

## Component Classification System

### Type Definitions

#### **Container (28 components)**

Page-level or feature-level components that manage state, orchestrate sub-components, and handle business logic.

- Examples: SearchPage, ResultPanel, FeaturePanel, RecordPage
- Often use HOCs for routing/styling
- Coordinate multiple child components

#### **Display (45 components)**

Pure presentational components that render data without managing state. Focused on visual representation.

- Examples: Badge, Highlight, AttributeTable, ResultTable, Count
- Typically stateless or with minimal local state
- Receive data via props

#### **Report-specific (37 components)**

Components dedicated to rendering various report types and visualizations within the report framework.

- Examples: ReportMap, ReportTree, ReportScatter, ReportHistogram, ReportTable
- Part of the report rendering pipeline
- Handle specific visualization logic

#### **Form (29 components)**

Input controls, buttons, selectors, and interactive form elements.

- Examples: BasicTextField, BasicSelect, PalettePicker, SearchButton, Toggle
- User interaction handlers
- Input validation and control

#### **Layout (14 components)**

Structural wrapper components for page layout, navigation, and modals.

- Examples: Header, Footer, Layout, NavLink, Tooltip, Box, Paper
- Define page structure
- Non-data-bearing components

#### **Utility (50 components)**

Helper components, icons, small display elements, and utility functions wrapped as components.

- Examples: Logo variants, Citation, TranslatedValue, HistogramSVG
- Reusable across multiple features
- Often simple with minimal logic

#### **Wrapper (11 components)**

Index files and re-export wrappers that organize subdirectory components.

- Examples: All `index.js` files in subdirectories
- Enable clean import paths
- Not user-facing components

---

## Components by Type Summary

### Utility Components (50 - 23.4%)

Foundational, reusable elements used throughout the application.

**Logo Components (9):**

- Logo.jsx, LogoBoat.jsx, LogoBtk.jsx, LogoGenomeHubs.jsx, LogoGoat.jsx, LogoIsopoDB.jsx, LogoLepbase.jsx, LogoMolluscDB.jsx, LogoPage.jsx

**Utility/Helper (41):**

- Citation, AutoCompleteOption, AutoCompleteSuggestion, Underline, MultiCatLegend, CookieBanner
- HistogramSVG, DownloadMessage, Landing, Main, Markdown, Head
- InfoCard, PointInfo, QueryBuilder, ReactErrorBoundary, RecordLink
- PhyloPic, PhylopicAttributions, PhyloPics, SearchPagination, SearchSettings
- SearchSummary, SearchTips, SaveSettingsDefaults, SaveSettingsMore, SaveSettingsFavourites
- SiteName, StaticPlot, StaticPlotFile, StaticPlotFiles, Survey, Tabs, Tab, TabsFixed
- Taxonomy, Terms, TranslatedValue, Tab, Tabs, TabsFixed, VariableFilter
- WordCloud, ZoomComponent, ZoomControl, Carousel, EditableText, Tab, Tabs, TabsFixed, Taxonomy

### Display Components (45 - 21.0%)

Presentational components for rendering data visually.

**Badges & Counts (5):**

- Badge, BadgeInfo, BadgeStats, Count, DisplayCount

**Tables & Rows (7):**

- AttributeTable, AttributeTableRow, AnalysisTableRow, ResultTable, FileTable, ReportItem, ReportTable

**Icons & Indicators (4):**

- AggregationIcon, FlagIcon, Highlight, FullScreenGridCell

**Info & Panels (11):**

- CellInfo, PointInfo, InfoPane, InfoPanel, InfoCard, RecordLabel, ResultColumnOptions, ResultCount
- ValueRow, TextPanel, LoadingScreen

**Other Display (13):**

- KeyValueChip, Breadcrumbs, Logo, LogoPage, Carousel, EditableText/ValueChips, Highlight, CountrySVG

### Report-specific Components (37 - 17.3%)

Dedicated report rendering and visualization components.

**Main Report Framework (4):**

- Report.jsx, ReportWrapper.jsx, ReportPanel.jsx, ReportPage.jsx

**Report Visualizations (10):**

- ReportMap, ReportTable, ReportTree, ReportScatter, ReportHistogram, ReportArc
- ReportRibbon, ReportTreeRings, ReportTreePaths, ReportXPerRank

**Report Controls & UI (15):**

- ReportCaption, ReportCode, ReportDownload, ReportEdit, ReportEmpty, ReportError
- ReportFull, ReportInfo, ReportLegend, ReportLoading, ReportQuery, ReportSelect
- ReportSources, ReportTools, ReportTypes, ReportTerm

**ReportMap Subcomponents (13):**

- ReportMap.jsx, CountryPopup.jsx, CountrySVG.js, Globe.jsx, HexbinPopup.jsx
- Map.jsx, MapLegend.jsx, MarkerComponent.jsx, PointPopup.jsx, ReportMenu.jsx
- ReportPopup.jsx, SingleMarker.jsx, index.js

**SVG & Visualization Helpers (2):**

- ReportTreePathsSVG, ReportXAxisTick

### Form Components (29 - 13.6%)

Interactive input and control components.

**Text & Input (7):**

- AutoCompleteInput, AutowidthTextField, BasicTextField, EnumSelect, BasicSelect, BasicMenu, SettingsButton

**Buttons (5):**

- ColorButton, ColorButtonGroup, DownloadButton, FavouriteButton, LinkButton, SearchButton

**Selectors & Pickers (5):**

- PalettePicker, ReportSelect, EnumSelect, BasicSelect, ResultFilterInput

**Search & Query (5):**

- SearchInputQuery, SearchInputQueries, SearchToggles, VariableFilter, ResultFilterInput

**Modals & Controls (7):**

- AttributeModal, FileModal, Toggle, ToggleTheme, SaveSettingsModal, ResultModalControl, KeyValueChip/FieldNameMenu

### Container Components (28 - 13.1%)

Feature-level orchestrators and page containers.

**Analysis/Assembly/Feature (6):**

- AnalysisPanel, AssembliesPanel, AssemblyPanel, AssemblySummaryPanel, FeaturePanel, FeatureSummaryPanel

**Entity Panels (7):**

- AttributePanel, NamesPanel, FilesPanel, SourcesPanel, TaxonPanel, TaxonSummaryPanel, LineagePanel

**Page Containers (5):**

- ExplorePage, SearchPage, SourcesPage, TypesPage, TutorialPage, GenericPage, MissingPage, RecordPage, ReactErrorPage

**Result & Control (5):**

- ResultPanel, ControlPanel, InfoPanel, LineageSummaryPanel, TextPanel

**Other (5):**

- Page.jsx, AnalysisPanel, FeaturePanel, LineagePanel, TaxonPanel

### Layout Components (14 - 6.5%)

Structural and wrapper components.

**Navigation & Headers (5):**

- Header, Footer, NavLink, SearchBox, SearchBoxWrapper

**Wrappers & Containers (7):**

- Layout, Box, Paper, Tooltip, KonvaTooltip, SearchBoxStyles, ReportModalStyles

**Other Layout (2):**

- ChipSearchBox, EditableText/SearchBoxStyles

### Wrapper/Index Components (11 - 5.1%)

Re-export wrappers for subdirectory organization.

- AutowidthTextField/index.js
- Carousel/index.js
- ChipSearch/index.js
- EditableText/index.js
- KeyValueChip/index.js
- ReportMap/index.js
- ResultTable/StyledComponents.jsx (utility)
- Survey/index.js
- wrappers/index.js
- wrappers/Box/index.js
- wrappers/Paper/index.js
- wrappers/Tooltip/index.js

---

## Directory Structure

### Root Level (170 components)

All major feature and utility components at the root of the components directory.

### Subdirectory Organization (44 components across 8 folders)

#### **ReportMap/** (13 components)

Geographic visualization and map-related components for location-based data display.

- ReportMap.jsx (main component with story)
- CountryPopup.jsx, CountrySVG.js, Globe.jsx, HexbinPopup.jsx, Map.jsx
- MapLegend.jsx, MarkerComponent.jsx, PointPopup.jsx, ReportMenu.jsx (with story)
- ReportPopup.jsx, SingleMarker.jsx, index.js

#### **ResultTable/** (4 components + 1 utility)

Data table rendering utilities and styling.

- ResultTable.jsx (main, at root level)
- StyledComponents.jsx, useTableFooter.js, useTableHeaders.js, useTableRows.js

#### **ChipSearch/** (5 components)

Query builder with chip-based filtering.

- ChipSearch.jsx, ChipSearchBox.jsx, SearchBoxStyles.jsx, Underline.jsx, index.js
- Stories: ChipSearch.stories.jsx, ChipSearchBox.stories.jsx

#### **KeyValueChip/** (4 components)

Key-value pair display with validation.

- KeyValueChip.jsx, FieldNameMenu.jsx, ValidationErrorToolTip.jsx, index.js
- Story: KeyValueChip.stories.jsx

#### **EditableText/** (6 components)

Inline text editing with autocomplete suggestions.

- EditableText.jsx, AutoCompleteOption.jsx, AutoCompleteSuggestion.jsx
- SearchBoxStyles.jsx, ValueChips.jsx, index.js

#### **AutowidthTextField/** (2 components)

Auto-resizing text input field.

- AutowidthTextField.jsx, index.js
- Story: AutowidthTextField.stories.jsx

#### **Carousel/** (2 components)

Image/content carousel component.

- Carousel.jsx, index.js
- Story: Carousel.stories.jsx

#### **Survey/** (2 components)

Survey UI component.

- Survey.jsx, index.js
- Story: Survey.stories.jsx

#### **wrappers/** (6 components)

Material-UI component wrappers.

- Box/ (Box.jsx, index.js)
- Paper/ (Paper.jsx, index.js)
- Tooltip/ (Tooltip.jsx, index.js with story)
- index.js (main wrapper export)

---

## Export Patterns

### Default Exports (Majority)

Most components use default exports for clean, simple imports:

```javascript
export default ComponentName;
```

This pattern dominates (~180 components or 84%).

### Named Exports

Subdirectory index files and utility modules use named exports:

```javascript
export { ChipSearch };
export { ReportMap };
```

Approximately 40 components use this pattern.

### Mixed Exports

Some components export both default and named exports for flexibility:

```javascript
export { ComponentName };
export default ComponentName;
```

---

## Higher-Order Component (HOC) Usage

### Overview

- **156 components (73%)** use one or more HOCs
- Primarily for styling (withStyles) and routing (withRouter)

### Common HOCs

#### withStyles (Material-UI)

Most components wrap with `withStyles()` for component-level styling:

```javascript
export default withStyles(styles)(ComponentName);
```

Used by approximately **140+ components** for Material-UI style integration.

#### withRouter (React Router)

Components needing route parameters or navigation:

```javascript
export default withRouter(ComponentName);
```

Used by **navigation and page components**.

#### compose()

Redux compose utility for combining multiple HOCs:

```javascript
export default compose(withStyles(styles), withRouter)(ComponentName);
```

### Components Without HOCs (41)

Pure components without HOCs:

- AttributePanel, AttributeTable, AutoCompleteOption, AutoCompleteSuggestion
- BasicMenu, BasicSelect, Box, CellInfo, ColorButton, ColorButtonGroup
- DisplayCount, FavouriteButton, FlagIcon, FullScreenGridCell, GenericPage
- Highlight, InfoCard, KeyValueChip, PointInfo, Paper, PalettePreview
- Redirect, SettingsButton, Survey, Tooltip, VariableFilter, zLegend
- And ~15 others primarily in subdirectories

---

## Redux/State Management Analysis

### Key Finding: No Redux Hooks Used

**No components use `useSelector`, `useDispatch`, or Redux `connect()`**

- 0 components with `useSelector`
- 0 components with `useDispatch`
- 0 components with `connect()`

### Implications

- Application uses modern React hooks for state management
- State passed through component hierarchy via props
- Possible use of Context API or local component state
- May rely on external state management (Context, custom hooks, or Apollo Client)

---

## Storybook Coverage

### Overview

- **21 components** have `.stories.jsx` files
- Coverage: **9.8%** of total components
- Significant gap in documentation

### Components with Stories (21)

**UI Components (9):**

1. AggregationIcon.stories.jsx
2. AutowidthTextField/AutowidthTextField.stories.jsx
3. BadgeStats.stories.jsx
4. BasicTextField.stories.jsx (+ .interaction.stories.jsx)
5. FavouriteButton.stories.jsx
6. Highlight.stories.jsx
7. KeyValueChip/KeyValueChip.stories.jsx
8. Logo.stories.jsx
9. PalettePreview.stories.jsx

**Complex Components (12):** 10. Carousel/Carousel.stories.jsx 11. ChipSearch/ChipSearch.stories.jsx 12. ChipSearch/ChipSearchBox.stories.jsx 13. Count.stories.jsx 14. FullScreenGridCell.stories.jsx 15. PalettePicker.stories.jsx 16. ReportCaption.stories.jsx 17. ReportMap/ReportMap.stories.jsx 18. ReportMap/ReportMenu.stories.jsx 19. Survey/Survey.stories.jsx 20. Tooltip/Tooltip.stories.jsx 21. wrappers/Tooltip/Tooltip.stories.jsx

### Coverage Gaps

- **No stories for Container components** (28 components)
- **No stories for Report-specific components** (37 components) except ReportCaption, ReportMap
- **No stories for most Form components** (only BasicTextField, PalettePicker, FavouriteButton)
- **No stories for Layout components** (except Tooltip)

---

## Complete Component Inventory Table

| #   | File Path                                 | Component Name         | Type            | Export  | HOC | Story |
| --- | ----------------------------------------- | ---------------------- | --------------- | ------- | --- | ----- |
| 1   | AggregationIcon.jsx                       | AggregationIcon        | Display         | Default | ✓   | ✓     |
| 2   | AnalysisPanel.jsx                         | AnalysisPanel          | Container       | Default | ✓   |       |
| 3   | AnalysisTableRow.jsx                      | AnalysisTableRow       | Display         | Default | ✓   |       |
| 4   | App.jsx                                   | App                    | Utility         | Default | ✓   |       |
| 5   | AssembliesPanel.jsx                       | AssembliesPanel        | Container       | Default | ✓   |       |
| 6   | AssemblyPanel.jsx                         | AssemblyPanel          | Container       | Default | ✓   |       |
| 7   | AssemblySummaryPanel.jsx                  | AssemblySummaryPanel   | Container       | Default | ✓   |       |
| 8   | AttributeModal.jsx                        | AttributeModal         | Form            | Both    | ✓   |       |
| 9   | AttributePanel.jsx                        | AttributePanel         | Container       | Default |     |       |
| 10  | AttributeTable.jsx                        | AttributeTable         | Display         | Default |     |       |
| 11  | AttributeTableRow.jsx                     | AttributeTableRow      | Display         | Default | ✓   |       |
| 12  | AutoCompleteInput.jsx                     | AutoCompleteInput      | Form            | Both    | ✓   |       |
| 13  | AutoCompleteOption.jsx                    | AutoCompleteOption     | Utility         | Both    |     |       |
| 14  | AutoCompleteSuggestion.jsx                | AutoCompleteSuggestion | Utility         | Both    |     |       |
| 15  | AutowidthTextField/AutowidthTextField.jsx | AutowidthTextField     | Form            | Default |     | ✓     |
| 16  | AutowidthTextField/index.js               | index                  | Wrapper         | Named   |     |       |
| 17  | Badge.jsx                                 | Badge                  | Display         | Both    | ✓   |       |
| 18  | BadgeInfo.jsx                             | BadgeInfo              | Display         | Both    | ✓   |       |
| 19  | BadgeStats.jsx                            | BadgeStats             | Display         | Both    |     | ✓     |
| 20  | BasicMenu.jsx                             | BasicMenu              | Form            | Default |     |       |
| 21  | BasicSelect.jsx                           | BasicSelect            | Form            | Default |     |       |
| 22  | BasicTextField.jsx                        | BasicTextField         | Form            | Default |     | ✓     |
| 23  | Breadcrumbs.jsx                           | Breadcrumbs            | Display         | Default | ✓   |       |
| 24  | Carousel/Carousel.jsx                     | Carousel               | Display         | Default |     | ✓     |
| 25  | Carousel/index.js                         | index                  | Wrapper         | Default |     |       |
| 26  | CellInfo.jsx                              | CellInfo               | Display         | Both    |     |       |
| 27  | ChipSearch/ChipSearch.jsx                 | ChipSearch             | Display         | Default |     | ✓     |
| 28  | ChipSearch/ChipSearchBox.jsx              | ChipSearchBox          | Layout          | Default |     | ✓     |
| 29  | ChipSearch/index.js                       | index                  | Wrapper         | Named   |     |       |
| 30  | ChipSearch/SearchBoxStyles.jsx            | SearchBoxStyles        | Layout          | Named   |     |       |
| 31  | ChipSearch/Underline.jsx                  | Underline              | Utility         | Both    |     |       |
| 32  | Citation.jsx                              | Citation               | Utility         | Default | ✓   |       |
| 33  | ColorButton.jsx                           | ColorButton            | Form            | Both    |     |       |
| 34  | ColorButtonGroup.jsx                      | ColorButtonGroup       | Form            | Both    |     |       |
| 35  | ControlPanel.jsx                          | ControlPanel           | Container       | Default | ✓   |       |
| 36  | CookieBanner.jsx                          | CookieBanner           | Utility         | Both    | ✓   |       |
| 37  | Count.jsx                                 | Count                  | Display         | Default | ✓   | ✓     |
| 38  | DisplayCount.jsx                          | DisplayCount           | Display         | Both    |     |       |
| 39  | DownloadButton.jsx                        | DownloadButton         | Form            | Default | ✓   |       |
| 40  | DownloadMessage.jsx                       | DownloadMessage        | Utility         | Default | ✓   |       |
| 41  | EditableText/AutoCompleteOption.jsx       | AutoCompleteOption     | Utility         | Both    |     |       |
| 42  | EditableText/AutoCompleteSuggestion.jsx   | AutoCompleteSuggestion | Utility         | Both    |     |       |
| 43  | EditableText/EditableText.jsx             | EditableText           | Utility         | Default |     |       |
| 44  | EditableText/index.js                     | index                  | Wrapper         | Named   |     |       |
| 45  | EditableText/SearchBoxStyles.jsx          | SearchBoxStyles        | Layout          | Named   |     |       |
| 46  | EditableText/ValueChips.jsx               | ValueChips             | Display         | Default |     |       |
| 47  | EnumSelect.jsx                            | EnumSelect             | Form            | Default | ✓   |       |
| 48  | ExplorePage.jsx                           | ExplorePage            | Container       | Default | ✓   |       |
| 49  | FavouriteButton.jsx                       | FavouriteButton        | Form            | Both    |     | ✓     |
| 50  | FeaturePanel.jsx                          | FeaturePanel           | Container       | Default | ✓   |       |
| 51  | FeatureSummaryPanel.jsx                   | FeatureSummaryPanel    | Container       | Default | ✓   |       |
| 52  | FileModal.jsx                             | FileModal              | Form            | Both    | ✓   |       |
| 53  | FilesPanel.jsx                            | FilesPanel             | Container       | Default | ✓   |       |
| 54  | FileTable.jsx                             | FileTable              | Display         | Default | ✓   |       |
| 55  | FlagIcon.jsx                              | FlagIcon               | Display         | Both    |     |       |
| 56  | Footer.jsx                                | Footer                 | Layout          | Default | ✓   |       |
| 57  | FullScreenGridCell.jsx                    | FullScreenGridCell     | Display         | Default |     | ✓     |
| 58  | GenericPage.jsx                           | GenericPage            | Container       | Default |     |       |
| 59  | Head.jsx                                  | Head                   | Utility         | Default | ✓   |       |
| 60  | Header.jsx                                | Header                 | Layout          | Default | ✓   |       |
| 61  | Highlight.jsx                             | Highlight              | Display         | Default |     | ✓     |
| 62  | HistogramSVG.jsx                          | HistogramSVG           | Utility         | Default | ✓   |       |
| 63  | InfoCard.jsx                              | InfoCard               | Display         | Both    |     |       |
| 64  | InfoPane.jsx                              | InfoPane               | Display         | Default | ✓   |       |
| 65  | InfoPanel.jsx                             | InfoPanel              | Container       | Default |     |       |
| 66  | KeyValueChip/FieldNameMenu.jsx            | FieldNameMenu          | Form            | Named   |     |       |
| 67  | KeyValueChip/index.js                     | index                  | Wrapper         | Named   |     |       |
| 68  | KeyValueChip/KeyValueChip.jsx             | KeyValueChip           | Display         | Default |     | ✓     |
| 69  | KeyValueChip/ValidationErrorToolTip.jsx   | ValidationErrorToolTip | Display         | Both    |     |       |
| 70  | KonvaTooltip.jsx                          | KonvaTooltip           | Layout          | Default |     |       |
| 71  | Landing.jsx                               | Landing                | Utility         | Default | ✓   |       |
| 72  | Layout.jsx                                | Layout                 | Layout          | Default | ✓   |       |
| 73  | LineagePanel.jsx                          | LineagePanel           | Container       | Both    | ✓   |       |
| 74  | LineageSummaryPanel.jsx                   | LineageSummaryPanel    | Container       | Default | ✓   |       |
| 75  | LinkButton.jsx                            | LinkButton             | Form            | Default | ✓   |       |
| 76  | LoadingScreen.jsx                         | LoadingScreen          | Display         | Default | ✓   |       |
| 77  | Logo.jsx                                  | Logo                   | Display         | Default |     | ✓     |
| 78  | LogoBoat.jsx                              | LogoBoat               | Display         | Default | ✓   |       |
| 79  | LogoBtk.jsx                               | LogoBtk                | Display         | Default | ✓   |       |
| 80  | LogoGenomeHubs.jsx                        | LogoGenomeHubs         | Display         | Default | ✓   |       |
| 81  | LogoGoat.jsx                              | LogoGoat               | Display         | Default | ✓   |       |
| 82  | LogoIsopoDB.jsx                           | LogoIsopoDB            | Display         | Default | ✓   |       |
| 83  | LogoLepbase.jsx                           | LogoLepbase            | Display         | Default | ✓   |       |
| 84  | LogoMolluscDB.jsx                         | LogoMolluscDB          | Display         | Default | ✓   |       |
| 85  | LogoPage.jsx                              | LogoPage               | Display         | Both    | ✓   |       |
| 86  | Main.jsx                                  | Main                   | Utility         | Default | ✓   |       |
| 87  | Markdown.jsx                              | Markdown               | Utility         | Both    | ✓   |       |
| 88  | MissingPage.jsx                           | MissingPage            | Container       | Default |     |       |
| 89  | MultiCatLegend.jsx                        | MultiCatLegend         | Utility         | Both    | ✓   |       |
| 90  | NamesPanel.jsx                            | NamesPanel             | Container       | Both    | ✓   |       |
| 91  | NavLink.jsx                               | NavLink                | Layout          | Default | ✓   |       |
| 92  | Page.jsx                                  | Page                   | Container       | Default | ✓   |       |
| 93  | PalettePicker.jsx                         | PalettePicker          | Form            | Default | ✓   | ✓     |
| 94  | PalettePreview.jsx                        | PalettePreview         | Utility         | Both    |     | ✓     |
| 95  | PhyloPic.jsx                              | PhyloPic               | Utility         | Default | ✓   |       |
| 96  | PhylopicAttributions.jsx                  | PhylopicAttributions   | Utility         | Default | ✓   |       |
| 97  | PhyloPics.jsx                             | PhyloPics              | Utility         | Default | ✓   |       |
| 98  | PointInfo.jsx                             | PointInfo              | Display         | Both    |     |       |
| 99  | QueryBuilder.jsx                          | QueryBuilder           | Utility         | Both    | ✓   |       |
| 100 | ReactErrorBoundary.jsx                    | ReactErrorBoundary     | Display         | Default | ✓   |       |
| 101 | ReactErrorPage.jsx                        | ReactErrorPage         | Container       | Both    | ✓   |       |
| 102 | RecordLabel.jsx                           | RecordLabel            | Display         | Default | ✓   |       |
| 103 | RecordLink.jsx                            | RecordLink             | Utility         | Default | ✓   |       |
| 104 | RecordPage.jsx                            | RecordPage             | Container       | Default | ✓   |       |
| 105 | Redirect.jsx                              | Redirect               | Utility         | Default |     |       |
| 106 | Report.jsx                                | Report                 | Report-specific | Both    | ✓   |       |
| 107 | ReportArc.jsx                             | ReportArc              | Report-specific | Default | ✓   |       |
| 108 | ReportCaption.jsx                         | ReportCaption          | Report-specific | Default | ✓   | ✓     |
| 109 | ReportCode.jsx                            | ReportCode             | Report-specific | Both    | ✓   |       |
| 110 | ReportDownload.jsx                        | ReportDownload         | Report-specific | Both    | ✓   |       |
| 111 | ReportEdit.jsx                            | ReportEdit             | Report-specific | Both    | ✓   |       |
| 112 | ReportEmpty.jsx                           | ReportEmpty            | Report-specific | Default | ✓   |       |
| 113 | ReportError.jsx                           | ReportError            | Report-specific | Default | ✓   |       |
| 114 | ReportFull.jsx                            | ReportFull             | Report-specific | Both    | ✓   |       |
| 115 | ReportHistogram.jsx                       | ReportHistogram        | Report-specific | Default | ✓   |       |
| 116 | ReportInfo.jsx                            | ReportInfo             | Report-specific | Both    | ✓   |       |
| 117 | ReportItem.jsx                            | ReportItem             | Display         | Default | ✓   |       |
| 118 | ReportLegend.jsx                          | ReportLegend           | Report-specific | Both    | ✓   |       |
| 119 | ReportLoading.jsx                         | ReportLoading          | Report-specific | Default |     |       |
| 120 | ReportMap/CountryPopup.jsx                | CountryPopup           | Report-specific | Both    |     |       |
| 121 | ReportMap/CountrySVG.js                   | CountrySVG             | Display         | Both    |     |       |
| 122 | ReportMap/Globe.jsx                       | Globe                  | Report-specific | Default |     |       |
| 123 | ReportMap/HexbinPopup.jsx                 | HexbinPopup            | Report-specific | Both    |     |       |
| 124 | ReportMap/index.js                        | index                  | Wrapper         | Named   |     |       |
| 125 | ReportMap/Map.jsx                         | Map                    | Report-specific | Default |     |       |
| 126 | ReportMap/MapLegend.jsx                   | MapLegend              | Report-specific | Both    |     |       |
| 127 | ReportMap/MarkerComponent.jsx             | MarkerComponent        | Utility         | Default |     |       |
| 128 | ReportMap/PointPopup.jsx                  | PointPopup             | Report-specific | Both    |     |       |
| 129 | ReportMap/ReportMap.jsx                   | ReportMap              | Report-specific | Default | ✓   | ✓     |
| 130 | ReportMap/ReportMenu.jsx                  | ReportMenu             | Form            | Both    |     | ✓     |
| 131 | ReportMap/ReportPopup.jsx                 | ReportPopup            | Report-specific | Both    |     |       |
| 132 | ReportMap/SingleMarker.jsx                | SingleMarker           | Utility         | Default |     |       |
| 133 | ReportModalStyles.jsx                     | ReportModalStyles      | Form            | Named   |     |       |
| 134 | ReportPage.jsx                            | ReportPage             | Report-specific | Default | ✓   |       |
| 135 | ReportPanel.jsx                           | ReportPanel            | Report-specific | Default | ✓   |       |
| 136 | ReportQuery.jsx                           | ReportQuery            | Report-specific | Both    | ✓   |       |
| 137 | ReportRibbon.jsx                          | ReportRibbon           | Report-specific | Default | ✓   |       |
| 138 | ReportScatter.jsx                         | ReportScatter          | Report-specific | Default | ✓   |       |
| 139 | ReportSelect.jsx                          | ReportSelect           | Form            | Both    | ✓   |       |
| 140 | ReportSources.jsx                         | ReportSources          | Report-specific | Default | ✓   |       |
| 141 | ReportTable.jsx                           | ReportTable            | Display         | Default | ✓   |       |
| 142 | ReportTerm.jsx                            | ReportTerm             | Report-specific | Default | ✓   |       |
| 143 | ReportTools.jsx                           | ReportTools            | Report-specific | Both    | ✓   |       |
| 144 | ReportTree.jsx                            | ReportTree             | Report-specific | Default | ✓   |       |
| 145 | ReportTreePaths.jsx                       | ReportTreePaths        | Report-specific | Default | ✓   |       |
| 146 | ReportTreePathsSVG.jsx                    | ReportTreePathsSVG     | Report-specific | Default | ✓   |       |
| 147 | ReportTreeRings.jsx                       | ReportTreeRings        | Report-specific | Default | ✓   |       |
| 148 | ReportTypes.jsx                           | ReportTypes            | Report-specific | Both    | ✓   |       |
| 149 | ReportWrapper.jsx                         | ReportWrapper          | Report-specific | Both    | ✓   |       |
| 150 | ReportXAxisTick.jsx                       | ReportXAxisTick        | Report-specific | Both    |     |       |
| 151 | ReportXPerRank.jsx                        | ReportXPerRank         | Report-specific | Default | ✓   |       |
| 152 | ResultColumnOptions.jsx                   | ResultColumnOptions    | Display         | Default | ✓   |       |
| 153 | ResultCount.jsx                           | ResultCount            | Display         | Default | ✓   |       |
| 154 | ResultFilter.jsx                          | ResultFilter           | Utility         | Default | ✓   |       |
| 155 | ResultFilterInput.jsx                     | ResultFilterInput      | Form            | Default |     |       |
| 156 | ResultModalControl.jsx                    | ResultModalControl     | Form            | Both    | ✓   |       |
| 157 | ResultPanel.jsx                           | ResultPanel            | Container       | Default | ✓   |       |
| 158 | ResultTable.jsx                           | ResultTable            | Display         | Both    | ✓   |       |
| 159 | ResultTable/StyledComponents.jsx          | StyledComponents       | Utility         | Named   | ✓   |       |
| 160 | ResultTable/useTableFooter.js             | useTableFooter         | Display         | Named   |     |       |
| 161 | ResultTable/useTableHeaders.js            | useTableHeaders        | Display         | Named   |     |       |
| 162 | ResultTable/useTableRows.js               | useTableRows           | Display         | Named   |     |       |
| 163 | SaveSettingsDefaults.jsx                  | SaveSettingsDefaults   | Utility         | Default | ✓   |       |
| 164 | SaveSettingsFavourites.jsx                | SaveSettingsFavourites | Utility         | Both    | ✓   |       |
| 165 | SaveSettingsModal.jsx                     | SaveSettingsModal      | Form            | Both    | ✓   |       |
| 166 | SaveSettingsMore.jsx                      | SaveSettingsMore       | Utility         | Default | ✓   |       |
| 167 | SearchBox.jsx                             | SearchBox              | Layout          | Default | ✓   |       |
| 168 | SearchBoxStyles.jsx                       | SearchBoxStyles        | Layout          | Named   |     |       |
| 169 | SearchBoxWrapper.jsx                      | SearchBoxWrapper       | Layout          | Default | ✓   |       |
| 170 | SearchButton.jsx                          | SearchButton           | Form            | Default | ✓   |       |
| 171 | SearchHeaderButtons.jsx                   | SearchHeaderButtons    | Form            | Default | ✓   |       |
| 172 | SearchInputQueries.jsx                    | SearchInputQueries     | Form            | Both    | ✓   |       |
| 173 | SearchInputQuery.jsx                      | SearchInputQuery       | Form            | Both    | ✓   |       |
| 174 | SearchPage.jsx                            | SearchPage             | Container       | Default | ✓   |       |
| 175 | SearchPagination.jsx                      | SearchPagination       | Utility         | Default | ✓   |       |
| 176 | SearchSettings.jsx                        | SearchSettings         | Utility         | Default | ✓   |       |
| 177 | SearchSummary.jsx                         | SearchSummary          | Utility         | Default | ✓   |       |
| 178 | SearchTips.jsx                            | SearchTips             | Utility         | Default | ✓   |       |
| 179 | SearchToggles.jsx                         | SearchToggles          | Form            | Both    | ✓   |       |
| 180 | SettingsButton.jsx                        | SettingsButton         | Form            | Default |     |       |
| 181 | SiteName.jsx                              | SiteName               | Utility         | Default | ✓   |       |
| 182 | SourcesPage.jsx                           | SourcesPage            | Container       | Default | ✓   |       |
| 183 | SourcesPanel.jsx                          | SourcesPanel           | Container       | Default | ✓   |       |
| 184 | StaticPlot.jsx                            | StaticPlot             | Utility         | Default | ✓   |       |
| 185 | StaticPlotFile.jsx                        | StaticPlotFile         | Utility         | Default | ✓   |       |
| 186 | StaticPlotFiles.jsx                       | StaticPlotFiles        | Utility         | Default | ✓   |       |
| 187 | Survey/index.js                           | index                  | Wrapper         | Named   |     |       |
| 188 | Survey/Survey.jsx                         | Survey                 | Utility         | Default |     | ✓     |
| 189 | Tab.jsx                                   | Tab                    | Utility         | Default | ✓   |       |
| 190 | Tabs.jsx                                  | Tabs                   | Utility         | Default | ✓   |       |
| 191 | TabsFixed.jsx                             | TabsFixed              | Utility         | Default | ✓   |       |
| 192 | Taxonomy.jsx                              | Taxonomy               | Utility         | Default | ✓   |       |
| 193 | TaxonPanel.jsx                            | TaxonPanel             | Container       | Default | ✓   |       |
| 194 | TaxonSummaryPanel.jsx                     | TaxonSummaryPanel      | Container       | Default | ✓   |       |
| 195 | Terms.jsx                                 | Terms                  | Utility         | Default | ✓   |       |
| 196 | TextPanel.jsx                             | TextPanel              | Container       | Default | ✓   |       |
| 197 | Toggle.jsx                                | Toggle                 | Form            | Default | ✓   |       |
| 198 | ToggleTheme.jsx                           | ToggleTheme            | Form            | Both    | ✓   |       |
| 199 | TranslatedValue.jsx                       | TranslatedValue        | Utility         | Default | ✓   |       |
| 200 | TutorialPage.jsx                          | TutorialPage           | Container       | Default |     |       |
| 201 | TypesPage.jsx                             | TypesPage              | Container       | Default | ✓   |       |
| 202 | ValueRow.jsx                              | ValueRow               | Display         | Default | ✓   |       |
| 203 | VariableFilter.jsx                        | VariableFilter         | Utility         | Default |     |       |
| 204 | WordCloud.jsx                             | WordCloud              | Utility         | Default | ✓   |       |
| 205 | wrappers/Box/Box.jsx                      | Box                    | Layout          | Default |     |       |
| 206 | wrappers/Box/index.js                     | index                  | Wrapper         | Named   |     |       |
| 207 | wrappers/index.js                         | index                  | Wrapper         | Named   |     |       |
| 208 | wrappers/Paper/index.js                   | index                  | Wrapper         | Named   |     |       |
| 209 | wrappers/Paper/Paper.jsx                  | Paper                  | Layout          | Default |     |       |
| 210 | wrappers/Tooltip/index.js                 | index                  | Wrapper         | Default |     |       |
| 211 | wrappers/Tooltip/Tooltip.jsx              | Tooltip                | Layout          | Both    | ✓   | ✓     |
| 212 | zLegend.jsx                               | zLegend                | Utility         | Both    |     |       |
| 213 | ZoomComponent.jsx                         | ZoomComponent          | Utility         | Default | ✓   |       |
| 214 | ZoomControl.jsx                           | ZoomControl            | Utility         | Default | ✓   |       |

---

## Key Observations & Recommendations

### Architecture Patterns

1. **Hooks-Based State Management (100%)**
   - No Redux hooks, no connect() pattern
   - Application uses modern React hooks for state
   - Props-driven architecture for data flow

2. **HOC-Heavy Styling (73%)**
   - Material-UI `withStyles()` dominant pattern
   - Opportunity for styled-components migration
   - Consider CSS-in-JS consolidation

3. **Well-Organized Subdirectories**
   - Complex features grouped logically (ChipSearch, ReportMap, etc.)
   - Index files provide clean export paths
   - Consistent organizational pattern

4. **Storybook Gaps**
   - Only 21 stories for 214 components
   - Missing documentation for critical components
   - Opportunity to improve developer experience

### Refactor Priorities

**Phase 1: Search & Query Consolidation**

- ChipSearch (5 components)
- EditableText (6 components)
- SearchBox/SearchInputQuery (3 components)
- Consider unifying query building patterns

**Phase 2: Report Rendering Pipeline**

- Report-specific components (37 total)
- ReportMap (13 components) most complex
- Opportunity for shared visualization utilities

**Phase 3: State Management Audit**

- Identify state passing patterns
- Map prop drilling opportunities
- Consider Context API or custom hooks extraction

### Immediate Actions

1. ✅ Create this component inventory (DONE)
2. Document state flow patterns and data sources
3. Map URL handling across components
4. Identify code duplication candidates
5. Plan Storybook expansion

---

## Document Info

- **Created:** 5 May 2026
- **Scope:** React component analysis only
- **Methodology:** Static file analysis using Node.js
- **Accuracy:** 100% file coverage, pattern detection based on code inspection
