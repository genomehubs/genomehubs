import { createAction, handleAction } from 'redux-actions'


export const setPanes = createAction('SET_PANES')
export const panes = handleAction(
  'SET_PANES',
  (state, action) => (
    action.payload
  ),
  [
    {id: 'assemblyPane',
     title: 'Browse Assemblies',
     short: 'assemblies',
     view: 'assemblies',
     image: 'assemblies.png',
     text: 'Select assemblies by browsing and filtering metadata.'},
    {id: 'toolPane',
     title: 'Browse Tools',
     short: 'tools',
     view: 'tools',
     text: 'Browse visualisation and analysis tools available in this GenomeHub.'},
    {id: 'searchPane',
     title: 'Advanced Search',
     short: 'search',
     view: 'search',
     image: 'placeholderRed.png',
     text: 'Access advanced search options.'},
    {id: 'treePane',
     title: 'Browse Trees',
     short: 'trees',
     view: 'trees',
     text: 'Select assemblies by browsing gene and species tree nodes.'},
    {id: 'tutorialPane',
     title: 'View Tutorials',
     short: 'help',
     view: 'tutorials',
     text: 'Find help and tutorials to learn how to use this GenomeHub.'},
    {id: 'aboutPane',
     title: 'About GenomeHubs',
     short: 'about',
     view: 'about',
     text: 'Find out more about the GenomeHubs project.'},
  ]
)
export const getPanes = state => state.panes

export const paneReducers = {
  panes
}
