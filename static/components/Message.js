const { useState, useEffect } = React;

const Message = (props) => {
  const { id, username, content, numReply, changeThreadToShow } = props;
  const [image, setImage] = useState("");

  useEffect(() => {
    let urlRegex = /(https?:\/\/[^ ]*)/;
    let url = content.match(urlRegex);
    if (url) {
      setImage(url[1]);
    }
  }, []);

  return (
    <div>
      {username} : {content} - ({numReply} replies)
      {image != "" && (
        <img
          src={image}
          alt="messageImg"
          style={{ width: "500px", height: "600px" }}
        />
      )}
      <button onClick={() => changeThreadToShow(id)}>Check replies!</button>
    </div>
  );
};

export default Message;
