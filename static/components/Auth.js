const { useState } = React;

const Auth = (props) => {
  const { setLoggedIn } = props;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onChangeUsername = (event) => {
    setUsername(event.target.value);
  };
  const onChangePassword = (event) => {
    setPassword(event.target.value);
  };

  const sendPostRequest = (route) => {
    let body = JSON.stringify({ username: username, password: password });
    return fetch(route, {
      method: "POST",
      body: body,
      headers: new Headers({
        "content-type": "application/json",
      }),
    });
  };

  const handleAuth = async (route) => {
    let response = await sendPostRequest(route);
    let data = await response.json();
    const { id, session_token, Error } = data;
    if (Error) {
      alert(Error);
      return;
    }
    window.localStorage.setItem("adamzhang22_session_token", session_token);
    window.localStorage.setItem("adamzhang22_current_user_id", id);
    window.localStorage.setItem("adamzhang22_loggedIn", true);
    setLoggedIn(true);
  };

  return (
    <div>
      <h1>Sign up or login to Belay! </h1>
      <div>
        Username:
        <input
          type="text"
          name="username"
          value={username}
          onChange={onChangeUsername}
        />
      </div>
      <div>
        Password:
        <input
          type="text"
          name="password"
          value={password}
          onChange={onChangePassword}
        />
      </div>
      <button
        onClick={() => {
          handleAuth("/api/signup");
        }}
      >
        Sign up
      </button>
      <button
        onClick={() => {
          handleAuth("/api/login");
        }}
      >
        Log in
      </button>
    </div>
  );
};

export default Auth;
