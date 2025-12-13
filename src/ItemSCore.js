import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import ItemCard from "./item/itemCard";

const Update = () => {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedZo, setSelectedZo] = useState(new Set());
  const [selectedBu, setSelectedBu] = useState(new Set());
  const [selectedGet, setSelectedGet] = useState(new Set());
  const [data, setData] = useState({});
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState("15");
  const [isCustomItemChecked, setIsCustomItemChecked] = useState(false);

  const handleCustomItemChange = (event) => {
    setIsCustomItemChecked(event.target.checked);
  };

  useEffect(() => {
    fetch("https://api.kero.zone/dogking/getAllItems") // 从 API 加载数据
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
    fetch("https://api.kero.zone/dogking/scorelist")
      .then((response) => response.json())
      .then((data) => {
        setData(data);
        // 初始化selectedKeys为key=15的value
        setSelectedKeys(data["15"] ? data["15"].split(",") : []);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

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
    setSelectedKeys((prevKeys) => prevKeys.filter((key) => key !== item.id));
  };

  const handleSelectChange = (event) => {
    const key = event.target.value;
    // 根据选定的key更新selectedKeys
    setSelectedKey(key); // 更新当前选中的键
    setSelectedKeys(data[key] ? data[key].split(",") : []);
  };

  const [isExpanded, setIsExpanded] = useState(true);

  // 控制折叠/展开的处理函数
  const toggleExpand = () => {
    setIsExpanded((prevState) => !prevState);
  };

  // 使用 useEffect 来监听 selectedKeys 的变化
  useEffect(() => {
    console.log("Selected Keys Updated:", selectedKeys);
  }, [selectedKeys]);

  // post api 更新分数池
  const handleSubmit = () => {
    const payload = {
      key: selectedKey,
      value: selectedKeys.join(","),
    };

    // 发送数据到API
    fetch("https://api.kero.zone/dogking/scoreUpdate/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((updatedData) => {
        alert("提交成功！");
        setData(updatedData); // 使用返回的更新后的数据更新本地状态
        setSelectedKeys(
          updatedData[selectedKey] ? updatedData[selectedKey].split(",") : []
        ); // 更新selectedKeys以反映当前选中的key对应的最新值
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("提交失败，请稍后重试或联系管理员。");
      });
  };

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
            <div className="mb-3">
              <Form.Select
                aria-label="Select key"
                onChange={handleSelectChange}
                value={selectedKey}
              >
                {/* 动态生成选择项 */}
                {Object.keys(data).map((key) => (
                  <option key={key} value={key}>
                    分数 {key}
                  </option>
                ))}
              </Form.Select>
              <Button onClick={handleSubmit}>提交数据</Button>
              <span
                className="ml-3 text-danger"
                style={{ verticalAlign: "middle" }}
              >
                ※未分类武器=3分，未分类召唤=1分
              </span>
            </div>
            {/* <div className="title">选择分数的</div> */}
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
