import React from "react";
import { chromium } from "./release/app/node_modules/playwright";

const App: React.FC = () => {
  const onClick = () => {
    chromium.launch();
  };
  return (
    <div>
      <h1>React with Playwright Example</h1>
      <button
        onClick={() => {
          onClick();
        }}
      >
        Google 검색
      </button>
    </div>
  );
};

export default App;
