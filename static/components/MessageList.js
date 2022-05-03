import Message from "/static/component/Message.js";

const { useState, useEffect } = React;

const MessageList = (props) => {
  const { channelId, changeThreadToShow, redirectToLogin } = props;
  const [messagesData, setMessagesData] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const onChangeMessageContent = (event) => {
    setNewMessageContent(event.target.value);
  };

  const postMessage = async () => {
    try {
      let body = JSON.stringify({ content: newMessageContent });
      await fetch(`/api/messages/${channelId}`, {
        method: "POST",
        body: body,
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateRead = async (latest) => {
    try {
      let body = JSON.stringify({
        channel_id: channelId,
        last_message_id: latest,
      });
      await fetch(`/api/last_seen`, {
        method: "POST",
        body: body,
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      let response = await fetch(`/api/messages/${channelId}`, {
        method: "GET",
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
      let data = await response.json();
      const { messages } = data;
      setMessagesData(messages);
      if (isLoading) {
        setIsLoading(false);
      }
      if (messages && messages.length > 0) {
        await updateRead(messages[messages.length - 1]["id"]);
      }
    } catch (err) {
      window.localStorage.clear();
      history.pushState({ channel_id: 0 }, "login page", "/");
      console.error("Error in fetching channel data: %o", err);
      redirectToLogin();
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchMessages, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [props.channelId]);

  if (isLoading) {
    return <div>Is loading...</div>;
  }

  return (
    <div>
      <h2>Messages in Channel {channelId}</h2>
      {messagesData.map((message) => {
        const { id, content, username, num_reply } = message;
        return (
          <Message
            key={id.toString()}
            id={id}
            username={username}
            content={content}
            numReply={num_reply}
            changeThreadToShow={changeThreadToShow}
          />
        );
      })}
      <div>
        Send new message:
        <textarea value={newMessageContent} onChange={onChangeMessageContent} />
        <button onClick={postMessage}>Send Message</button>
      </div>
    </div>
  );
};

export default MessageList;
