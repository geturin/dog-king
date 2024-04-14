import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import ItemCard from "./item/itemCard";

const Update = () => {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedZo, setSelectedZo] = useState(new Set());
  const [selectedBu, setSelectedBu] = useState(new Set());
  const [selectedGet, setSelectedGet] = useState(new Set());
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    fetch("/output.json")
      .then((response) => response.json())
      .then((data) => {
        setAllItems(data);
        setFilteredItems(data);
      })
      .catch((error) => console.error("Error fetching data: ", error));
  }, []);

  useEffect(() => {
    const filtered = allItems.filter(
      (item) =>
        (selectedZo.size === 0 || selectedZo.has(`zo${item.details.zo}`)) &&
        (selectedBu.size === 0 || selectedBu.has(`bu${item.details.bu}`)) &&
        (selectedGet.size === 0 || selectedGet.has(`get${item.details.get}`))
    );
    setFilteredItems(filtered);
  }, [selectedZo, selectedBu, selectedGet, allItems]);

  const handleZoChange = (event) => {
    const value = event.target.value;
    setSelectedZo((prev) => toggleSet(prev, value));
  };

  const handleBuChange = (event) => {
    const value = event.target.value;
    setSelectedBu((prev) => toggleSet(prev, value));
  };

  const handleGetChange = (event) => {
    const value = event.target.value;
    setSelectedGet((prev) => toggleSet(prev, value));
  };

  const handleItemClick = (item) => {
    setSelectedKeys((prevKeys) => [...prevKeys, item.id]);
  };

  const selectedItems = selectedKeys.map((key) =>
    allItems.find((item) => item.id === key)
  );

  const handleItemRemove = (item) => {
    setSelectedKeys((prevKeys) => prevKeys.filter((key) => key !== item.id));
  };

  // 使用 useEffect 来监听 selectedKeys 的变化
  useEffect(() => {
    console.log("Selected Keys Updated:", selectedKeys);
  }, [selectedKeys]);

  return (
    <Container>
      <Row>
        <Col md={6}>
          <Form>
            <div className="mb-3">
              <strong>属性:</strong>{" "}
              {["火", "水", "土", "風", "光", "闇"].map((type, index) => (
                <Form.Check
                  inline
                  label={type}
                  type="checkbox"
                  id={`zo${index + 1}`}
                  value={`zo${index + 1}`}
                  onChange={handleZoChange}
                  key={index}
                />
              ))}
            </div>

            <div className="mb-3">
              <strong>武器种:</strong>{" "}
              {[
                "剣",
                "短剣",
                "槍",
                "斧",
                "杖",
                "銃",
                "格闘",
                "弓",
                "楽器",
                "刀",
              ].map((weapon, index) => (
                <Form.Check
                  inline
                  label={weapon}
                  type="checkbox"
                  id={`bu${index + 1}`}
                  value={`bu${index + 1}`}
                  onChange={handleBuChange}
                  key={index}
                />
              ))}
            </div>
            <div className="mb-3">
              <strong>召唤:</strong>{" "}
              {["普通", "贵族or季限"].map((weapon, index) => (
                <Form.Check
                  inline
                  label={weapon}
                  type="checkbox"
                  id={`get${index + 1}`}
                  value={`get${index + 1}`}
                  onChange={handleGetChange}
                  key={index}
                />
              ))}
            </div>
          </Form>
          <div className="item-card-container">
            <div className="title">已选择项目</div>
            <ItemCard items={selectedItems} onItemClick={handleItemRemove} />
          </div>
        </Col>
        <Col md={6}>
          <div className="item-card-container">
            <div className="title">筛选结果</div>
            <ItemCard items={filteredItems} onItemClick={handleItemClick} />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

function toggleSet(set, value) {
  const newSet = new Set(set);
  if (newSet.has(value)) {
    newSet.delete(value);
  } else {
    newSet.add(value);
  }
  return newSet;
}

export default Update;
