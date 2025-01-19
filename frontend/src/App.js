import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import React from "react";
import SignMessage from "./components/SignMessage";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/sign" element={<SignMessage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
