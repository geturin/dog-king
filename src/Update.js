import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import ItemCard from "./item/itemCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Update = ({ uid }) => {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedZo, setSelectedZo] = useState(new Set());
  const [selectedBu, setSelectedBu] = useState(new Set());
  const [selectedGet, setSelectedGet] = useState(new Set());
  const [data, setData] = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allowedDate, setAllowedDate] = useState(null); // 存储管理员指定的日期
  const [isCustomItemChecked, setIsCustomItemChecked] = useState(false);

  const handleCustomItemChange = (event) => {
    setIsCustomItemChecked(event.target.checked);
  };

  // 获取管理员指定日期
  useEffect(() => {
    fetch("https://api.kero.zone/dogking/getadtimes")
      .then((response) => response.json())
      .then((data) => {
        // 假设只取第一个日期作为允许日期
        const foundDate = data.find((item) => item.id === 1);
        if (foundDate) {
          setAllowedDate(foundDate.date);
          setSelectedDate(new Date(foundDate.date));
          console.log("Allowed date from API:", foundDate.date);
        }
      })
      .catch((error) => console.error("Error fetching allowed date:", error));
  }, []);

  useEffect(() => {
    fetch("https://api.kero.zone/dogking/getAllItems")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setAllItems(data);
        setFilteredItems(data);
      })
      .catch((error) => console.error("Error fetching data: ", error));
  }, []);

  useEffect(() => {
    if (!uid) return;
    fetch(`https://api.kero.zone/dogking/getuUserScoreGroupByDate?uid=${uid}`)
      .then((response) => response.json())
      .then((data) => {
        setData(data);
        const baseDate = allowedDate ? new Date(allowedDate) : new Date();
        const dateKey = formatDate(baseDate);
        setSelectedKeys(data[dateKey] ? data[dateKey].split(",") : []);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [uid, allowedDate]);

  useEffect(() => {
    const filtered = allItems.filter((item) => {
      if (isCustomItemChecked) {
        return item.dtype === 2; // 筛选出 dtype 为 2 的项目
      }
      return (
        (selectedZo.size === 0 || selectedZo.has(`zo${item.details.zo}`)) &&
        (selectedBu.size === 0 || selectedBu.has(`bu${item.details.bu}`)) &&
        (selectedGet.size === 0 || selectedGet.has(`get${item.details.get}`))
      );
    });
    setFilteredItems(filtered);
  }, [selectedZo, selectedBu, selectedGet, isCustomItemChecked, allItems]);

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
    setSelectedKeys((prevKeys) => {
      const index = prevKeys.indexOf(item.id);
      if (index !== -1) {
        const newKeys = [...prevKeys];
        newKeys.splice(index, 1);
        return newKeys;
      }
      return prevKeys;
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const key = formatDate(date);
    setSelectedKeys(data[key] ? data[key].split(",") : []);
  };

  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded((prevState) => !prevState);
  };

  useEffect(() => {
    console.log("Selected Keys Updated:", selectedKeys);
  }, [selectedKeys]);

  const handleSubmit = () => {
    const payload = {
      uid: String(uid),
      date: formatDate(selectedDate),
      value: selectedKeys.join(","),
    };

    fetch("https://api.kero.zone/dogking/updateUserScore/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((updatedData) => {
        alert("提交成功！");
        setData(updatedData);
        setSelectedKeys(
          updatedData[formatDate(selectedDate)]
            ? updatedData[formatDate(selectedDate)].split(",")
            : []
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("提交失败，请稍后重试或联系管理员。");
      });
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!uid) {
    return <div>Please login to access this page.</div>;
  }

  return (
    <Container>
      <Row>
        <Col md={6}>
          <Form>
            <div className="mb-3">
              <div>
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
              <div>
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
              <div>
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
              <div>
                <strong>自定义项目:</strong>{" "}
                <Form.Check
                  inline
                  label=""
                  type="checkbox"
                  id="customItem"
                  value="customItem"
                  onChange={handleCustomItemChange}
                />
              </div>
            </div>
          </Form>
          <div className="item-card-container">
            <button
              onClick={toggleExpand}
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
                {isExpanded ? "筛选结果▲" : "筛选结果▼"}
              </div>
            </button>
            <div style={{ display: isExpanded ? "block" : "none" }}>
              <ItemCard items={filteredItems} onItemClick={handleItemClick} />
            </div>
          </div>
        </Col>
        <Col md={6}>
          <div className="item-card-container">
            <div className="mb-1">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                className="form-control"
              />
            </div>
            <div className="mb-1">
              {formatDate(selectedDate) === allowedDate ? (
                <Button onClick={handleSubmit} className="mt-1">
                  提交数据
                </Button>
              ) : null}
            </div>
            <ItemCard items={selectedItems} onItemClick={handleItemRemove} />
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
