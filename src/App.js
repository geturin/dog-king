import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Spinner, Alert } from "react-bootstrap";
import Update from "./Update";
import ItemSCore from "./ItemSCore";
import logo from "./dog.png";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {
  const [status, setStatus] = useState(null); // 状态：null, "loading", "success", "error"

  const handleUpdateItems = async () => {
    setStatus("loading"); // 设置为“更新中”
    try {
      const response = await fetch(
        "https://api.kero.zone/dogking/updateItem/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setStatus("success"); // 设置为“更新成功”
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      setStatus("error"); // 设置为“更新失败”
    } finally {
      // 定时器：5秒后将状态重置为 null
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a className="App-link" href="/item_score" rel="noopener noreferrer">
          计分表管理
        </a>
        <a className="App-link" href="#" onClick={handleUpdateItems}>
          从GameWith获取最新数据
        </a>

        {status === "loading" && (
          <div className="mt-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
        {status === "success" && (
          <Alert variant="success" className="mt-3">
            更新完毕！
          </Alert>
        )}
        {status === "error" && (
          <Alert variant="danger" className="mt-3">
            更新失败，请稍后再试。
          </Alert>
        )}
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
