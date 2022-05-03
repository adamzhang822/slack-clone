import Auth from "/static/components/Auth.js";
import Belay from "/static/components/Belay.js";

const { useState, useEffect } = React;

const App = (props) => {
  const [loggedIn, setLoggedIn] = useState(false);

  // deal with refresh. Log in state should persist across url refresh. Also attach event listener so that local storage cleared after closing the window
  useEffect(() => {
    if (window.localStorage.getItem("adamzhang22_loggedIn")) {
      setLoggedIn(true);
    }
  }, []);

  const redirectToLogin = () => {
    setLoggedIn((loggedIn) => !loggedIn);
  };

  if (loggedIn) {
    return <Belay redirectToLogin={redirectToLogin} />;
  }
  return <Auth setLoggedIn={setLoggedIn} />;
};

export default App;
