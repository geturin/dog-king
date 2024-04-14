import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Update from "./Update";
import ItemSCore from "./ItemSCore";
import logo from "./logo.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ItemSCore />} />
      </Routes>
    </Router>
  );
}

export default App;
