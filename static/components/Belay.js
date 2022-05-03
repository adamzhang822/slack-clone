import ChannelNav from "/static/component/ChannelNav.js";
import MessageList from "/static/component/MessageList.js";
import ReplyThread from "/static/component/ReplyThread";

const { useState, useEffect } = React;

const Belay = (props) => {
  const { redirectToLogin } = props;
  const [channelId, setChannelId] = useState(0);
  const [showThread, setShowThread] = useState(false);
  const [threadId, setThreadId] = useState(0);
  const [elemToShowInNarrow, setElemToShowInNarrow] = useState("messageList");
  const [narrowMode, setNarrowMode] = useState(false);

  const changeChannelToShow = (newId) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const curThreadId = urlParams.get("thread_id");
    if (curThreadId) {
      history.pushState(
        {
          thread_id: curThreadId,
          channel_id: newId,
        },
        `In channel ${newId} and thread ${curThreadId}`,
        `?channel_id=${newId}&thread_id=${curThreadId}`
      );
    } else {
      history.pushState(
        {
          channel_id: newId,
        },
        `In channel ${newId}`,
        `?channel_id=${newId}`
      );
    }
    setChannelId(newId);
  };

  const changeThreadToShow = (newId) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const curChannelId = urlParams.get("channel_id");
    if (curChannelId) {
      history.pushState(
        {
          thread_id: newId,
          channel_id: curChannelId,
        },
        `In channel ${curChannelId} and thread ${newId}`,
        `?channel_id=${curChannelId}&thread_id=${newId}`
      );
    } else {
      history.pushState(
        { thread_id: newId },
        `In thread ${newId}`,
        `?thread_id=${newId}`
      );
    }
    if (!showThread) {
      setShowThread(true);
    }
    setThreadId(newId);
  };

  const closeThread = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const curChannelId = urlParams.get("channel_id");
    if (curChannelId) {
      history.pushState(
        {
          channel_id: curChannelId,
        },
        `In channel ${curChannelId}`,
        `?channel_id=${curChannelId}`
      );
    } else {
      history.pushState({ thread_id: 0 }, `Nothing`, `/`);
    }
    setShowThread(false);
  };

  const checkUrlParam = (props) => {
    const { redirectToLogin } = props;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const curId = urlParams.get("channel_id");
    const curThread = urlParams.get("thread_id");
    if (curId != null && curId != undefined && curId != channelId) {
      setChannelId(curId);
    }
    if (curThread != null && curThread != undefined && curThread != threadId) {
      setThreadId(curThread);
      if (!showThread) setShowThread(true);
    }
  };

  const revertNarrow = () => {
    setNarrowMode((narrowMode) => !narrowMode);
  };

  useEffect(() => {
    // Step 1: Check if there is any URL param right now
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const curId = urlParams.get("channel_id");
    const curThread = urlParams.get("thread_id");
    if (curId != null && curId != undefined && curId != channelId) {
      setChannelId(curId);
    }
    if (curThread != null && curThread != undefined && curThread != threadId) {
      setThreadId(curThread);
      if (!showThread) setShowThread(true);
    }
    // Step 2: Add event listener to listen in on any url changes
    window.addEventListener("popstate", checkUrlParam);

    // Step 3: Add event listener for media queries:
    window
      .matchMedia("(max-width:750px)")
      .addEventListener("change", revertNarrow);

    return () => {
      window.removeEventListener("popstate", checkUrlParam);
      window
        .matchMedia("(max-width:750px)")
        .removeEventListener("change", revertNarrow);
    };
  }, []);

  if (narrowMode) {
    return (
      <div>
        <div className="menuButtons">
          <button
            className="menuButton"
            onClick={() => setElemToShowInNarrow("channelNav")}
          >
            Show Channel List
          </button>
          <button
            className="menuButton"
            onClick={() => setElemToShowInNarrow("messageList")}
          >
            Show Channel Messages
          </button>
          {showThread && (
            <button
              className="menuButton"
              onClick={() => setElemToShowInNarrow("replyThread")}
            >
              Show Replies in Selected Thread
            </button>
          )}
        </div>
        {elemToShowInNarrow == "channelNav" && (
          <ChannelNav
            className="channelNav"
            changeChannel={changeChannelToShow}
            redirectToLogin={redirectToLogin}
          />
        )}
        {elemToShowInNarrow == "messageList" &&
          (channelId == 0 ? (
            <div>Select a channel!</div>
          ) : (
            <MessageList
              className="messageList"
              channelId={channelId}
              changeThreadToShow={changeThreadToShow}
              redirectToLogin={redirectToLogin}
            />
          ))}
        {elemToShowInNarrow == "replyThread" && showThread && (
          <ReplyThread
            className="replyThread"
            threadId={threadId}
            closeThread={closeThread}
            changeChannelToShow={changeChannelToShow}
            redirectToLogin={redirectToLogin}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="belay">
        <ChannelNav
          className="channelNav"
          changeChannel={changeChannelToShow}
          redirectToLogin={redirectToLogin}
        />
        {channelId == 0 ? (
          <div>Select a channel!</div>
        ) : (
          <MessageList
            className="messageList"
            channelId={channelId}
            changeThreadToShow={changeThreadToShow}
            redirectToLogin={redirectToLogin}
          />
        )}
        {showThread && (
          <ReplyThread
            className="replyThread"
            threadId={threadId}
            closeThread={closeThread}
            changeChannelToShow={changeChannelToShow}
            redirectToLogin={redirectToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default Belay;
