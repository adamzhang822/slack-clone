import App from "/static/components/App.js";

class ModuleDemo extends React.Component {
  render() {
    return (
      <div className="ModuleDemo">
        <App />
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  React.createElement(ModuleDemo),
  document.getElementById("root")
);
