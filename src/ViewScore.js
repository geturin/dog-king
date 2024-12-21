import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import ItemCard from "./item/itemCard";

const ViewScores = () => {
  const location = useLocation();
  const [data, setData] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [isExpanded, setIsExpanded] = useState({});
  const queryParams = new URLSearchParams(location.search);
  const uid = queryParams.get("uid");
  const dateParam = queryParams.get("date");

  // 获取所有道具详细信息
  useEffect(() => {
    fetch("https://api.kero.zone/dogking/getAllItems")
      .then((response) => response.json())
      .then((data) => setAllItems(data))
      .catch((error) => console.error("Error fetching all items:", error));
  }, []);

  // 获取用户得分数据
  useEffect(() => {
    if (!uid) return;

    fetch(`https://api.kero.zone/dogking/getuUserScoreGroupByDate?uid=${uid}`)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) =>
        console.error("Error fetching user score data:", error)
      );
  }, [uid]);

  const toggleExpand = (date) => {
    setIsExpanded((prevState) => ({
      ...prevState,
      [date]: !prevState[date],
    }));
  };

  const renderItemCard = (date, itemIds) => {
    const items = itemIds
      .split(",")
      .map((id) => allItems.find((item) => item.id === id)) // 匹配道具详细信息
      .filter((item) => item); // 过滤掉未找到的道具
    return (
      <div key={date} className="item-card-container">
        <button
          onClick={() => toggleExpand(date)}
          className="toggle-button"
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            border: "none",
            background: "none",
            fontSize: "16px",
          }}
        >
          <div className="title">
            {isExpanded[date] ? `${date} ▲` : `${date} ▼`}
          </div>
        </button>
        <div style={{ display: isExpanded[date] ? "block" : "none" }}>
          <ItemCard items={items} onItemClick={() => {}} />{" "}
          {/* 渲染道具详细信息 */}
        </div>
      </div>
    );
  };

  if (!uid) {
    return <div>Please provide a valid UID to access this page.</div>;
  }

  if (dateParam) {
    const itemsForDate = data[dateParam] || "";
    return (
      <Container>
        <Row>
          <Col md={12}>{renderItemCard(dateParam, itemsForDate)}</Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row>
        <Col md={12}>
          {Object.entries(data).map(([date, itemIds]) =>
            renderItemCard(date, itemIds)
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ViewScores;
