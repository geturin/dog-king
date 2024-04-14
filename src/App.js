import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Update from "./Update";
import ItemSCore from "./ItemSCore";
import logo from "./dog.png";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a className="App-link" href="/item_score" rel="noopener noreferrer">
          计分表管理
        </a>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/item_score" element={<ItemSCore />} />
      </Routes>
    </Router>
  );
}

export default App;
