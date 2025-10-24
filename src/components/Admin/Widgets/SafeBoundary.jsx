import React from "react";

export default class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Render error" };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Admin widget error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger" role="alert">
          Failed to render widget: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}
