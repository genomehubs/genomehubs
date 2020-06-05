import { createAction, handleAction } from 'redux-actions'


export const setPanes = createAction('SET_PANES')
export const panes = handleAction(
  'SET_PANES',
  (state, action) => (
    action.payload
  ),
  [
    {id: 'assemblyPane', title: 'Browse Assemblies'},
    {id: 'toolPane', title: 'Browse Tools'},
    {id: 'searchPane', title: 'Advanced Search'},
    {id: 'treePane', title: 'Browse Trees'},
    {id: 'tutorialPane', title: 'View Tutorials'},
    {id: 'aboutPane', title: 'About GenomeHubs'},
  ]
)
export const getPanes = state => state.panes

export const choosePanes = (state, count=3, offset=0) => {
  let panes = getPanes(state)
  let paneSet = panes.slice(offset,offset+count)
  return paneSet
}

export const paneReducers = {
  panes
}
