import React from 'react'
// import Header from './Header';
// import Main from './Main';
import styles from './App.scss';
import { CookiesProvider } from 'react-cookie';
import { withCookies } from 'react-cookie';


const Main = () => (
  <div><h1>Just a placeholder</h1></div>
)

class App extends React.Component {
  render() {
    return (
      <div className={styles.app}>
        <CookiesProvider>
          <Main className={styles.main} cookies={this.props.cookies}/>
        </CookiesProvider>
      </div>
    )
  }
}

export default withCookies(App);
