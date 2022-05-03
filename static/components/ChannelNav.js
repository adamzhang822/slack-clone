import ChannelButton from "/static/components/ChannelButton.js";

const { useState, useEffect } = React;

const ChannelNav = (props) => {
  const { changeChannel, redirectToLogin } = props;
  const [channelData, setChannelData] = useState([]);
  const [newChannelName, setNewChannelName] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const onChangeChannelNameInput = (event) => {
    setNewChannelName(event.target.value);
  };

  const createChannel = async () => {
    let body = JSON.stringify({ channel_name: newChannelName });
    await fetch("/api/channels", {
      method: "POST",
      body: body,
      headers: new Headers({
        "content-type": "application/json",
      }),
    });
  };

  const fetchChannelData = async () => {
    try {
      let response = await fetch("/api/channels", {
        method: "GET",
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
      let data = await response.json();
      const { channels } = data;
      setChannelData(channels);
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      // Clear obsolete cookies and redirect to login page
      window.localStorage.clear();
      history.pushState({ channel_id: 0 }, "login page", "/");
      console.error("Error in fetching channel data: %o", err);
      redirectToLogin();
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchChannelData, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return <div>Is loading...</div>;
  }

  return (
    <div>
      <h2>Channel List</h2>
      {channelData.map((channel) => {
        const { id, name, unread } = channel;
        return (
          <ChannelButton
            key={id.toString()}
            name={name}
            unread={unread}
            id={id}
            changeChannel={changeChannel}
          />
        );
      })}
      <div>
        New Channel Name:
        <input
          type="text"
          name="newChannelName"
          value={newChannelName}
          onChange={onChangeChannelNameInput}
        />
        <button onClick={createChannel}>Create New Channel!</button>
      </div>
    </div>
  );
};

export default ChannelNav;
