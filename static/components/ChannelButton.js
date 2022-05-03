const { useState } = React;

const ChannelButton = (props) => {
  const { id, name, unread, changeChannel } = props;
  return (
    <div>
      {name}: unread({unread})
      <button
        onClick={() => {
          changeChannel(id);
        }}
      >
        Get in
      </button>
    </div>
  );
};

export default ChannelButton;
