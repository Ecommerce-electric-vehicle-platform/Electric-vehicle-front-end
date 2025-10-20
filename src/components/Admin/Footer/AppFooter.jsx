import React from "react";
import { CFooter } from "@coreui/react";

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <span className="ms-1">EV Second-hand Platform</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Powered by</span>
        <a href="#">CoreUI</a>
      </div>
    </CFooter>
  );
};

export default AppFooter;
