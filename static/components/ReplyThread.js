import Reply from "/static/component/Reply.js";

const { useState, useEffect } = React;

const ReplyThread = (props) => {
  const { threadId, closeThread, changeChannelToShow, redirectToLogin } = props;
  const [repliesData, setRepliesData] = useState([]);
  const [newReplyContent, setNewReplyContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parentMessage, setParentMessage] = useState({});
  const [parentLoaded, setParentLoaded] = useState(false);

  const onChangeReplyContent = (event) => {
    setNewReplyContent(event.target.value);
  };

  const postReply = async () => {
    let body = JSON.stringify({ content: newReplyContent });
    try {
      await fetch(`/api/replies/${threadId}`, {
        method: "POST",
        body: body,
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
    } catch (err) {
      console.error("Error in posting reply: %o", err);
    }
  };

  const fetchReplies = async () => {
    try {
      if (!parentLoaded) {
        let response = await fetch(`/api/message/${threadId}`, {
          method: "GET",
          headers: new Headers({
            "content-type": "application/json",
          }),
        });
        let data = await response.json();
        setParentMessage(data);
        setParentLoaded(true);
      }
      let response = await fetch(`/api/replies/${threadId}`, {
        method: "GET",
        headers: new Headers({
          "content-type": "application/json",
        }),
      });
      let data = await response.json();
      const { replies } = data;
      setRepliesData(replies);
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Something went wrong : %o", err);
      window.localStorage.clear();
      history.pushState({ channel_id: 0 }, "login page", "/");
      redirectToLogin();
    }
  };

  useEffect(() => {
    setParentLoaded(false);
    const interval = setInterval(fetchReplies, 1000);
    return () => {
      clearInterval(interval);
    };
  });

  if (isLoading) {
    return <div>Is loading...</div>;
  }

  return (
    <div>
      <h2>Reply for Message ID : {threadId}</h2>
      <button onClick={closeThread}>Close thread</button>
      <button
        onClick={() => {
          changeChannelToShow(parentMessage["channel_id"]);
        }}
      >
        Go back to message channel
      </button>
      <h4>
        {parentMessage["username"]} : {parentMessage["content"]}
      </h4>
      <div>
        {repliesData.map((reply) => {
          const { id, content, author } = reply;
          return (
            <Reply
              key={id.toString()}
              id={id}
              username={author}
              content={content}
            />
          );
        })}
      </div>
      <div>
        Post new reply:
        <textarea value={newReplyContent} onChange={onChangeReplyContent} />
        <button onClick={postReply}>Send Message</button>
      </div>
    </div>
  );
};

export default ReplyThread;
