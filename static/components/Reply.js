const { useState } = React;

const Reply = (props) => {
  const { id, username, content } = props;
  return (
    <div>
      {username} : {content}
    </div>
  );
};

export default Reply;
