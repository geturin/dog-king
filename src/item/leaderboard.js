import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Squares from "../components/Squares";
import ElectricBorder from "../components/ElectricBorder";

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Leaderboard = () => {
  const [scores, setScores] = useState([]);
  const [dailyScores, setDailyScores] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [userDailyItems, setUserDailyItems] = useState({});
  const [filterDate, setFilterDate] = useState(null);
  const lineTooltipRef = useRef(null);
  const barTooltipRef = useRef(null);

  useEffect(() => {
    // 获取总积分数据
    fetch("https://api.kero.zone/dogking/alluserscores")
      .then((response) => response.json())
      .then((data) => {
        // 按总分从大到小排序
        const sortedScores = data.sort((a, b) => b.total_score - a.total_score);
        setScores(sortedScores);
      })
      .catch((error) => console.error("Error fetching scores:", error));

    // 获取日常积分数据
    fetch("https://api.kero.zone/dogking/allDaliyScores/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setDailyScores(data);
      })
      .catch((error) => console.error("Error fetching daily scores:", error));
  }, []);

  const itemMap = useMemo(() => {
    return allItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [allItems]);

  useEffect(() => {
    if (!dailyScores.length || !Object.keys(itemMap).length) return;
    const uniqueUids = Array.from(
      new Set(dailyScores.map((score) => score.uid))
    );
    const pendingUids = uniqueUids.filter((uid) => !userDailyItems[uid]);
    if (!pendingUids.length) return;

    Promise.all(
      pendingUids.map((uid) =>
        fetch(
          `https://api.kero.zone/dogking/getuUserScoreGroupByDate?uid=${uid}`
        )
          .then((response) => response.json())
          .then((data) => ({ uid, data }))
          .catch((error) => {
            console.error(`Error fetching user daily items for ${uid}:`, error);
            return { uid, data: null };
          })
      )
    ).then((results) => {
      setUserDailyItems((prev) => {
        const updated = { ...prev };
        results.forEach(({ uid, data }) => {
          if (!data) return;
          updated[uid] = Object.entries(data).reduce((acc, [date, itemIds]) => {
            if (!itemIds) {
              acc[date] = [];
              return acc;
            }
            const items = itemIds
              .split(",")
              .map((id) => itemMap[id.trim()])
              .filter(Boolean);
            acc[date] = items;
            return acc;
          }, {});
        });
        return updated;
      });
    });
  }, [dailyScores, itemMap, userDailyItems]);

  const aggregatedUserItems = useMemo(() => {
    return Object.entries(userDailyItems).reduce((acc, [uid, dateMap]) => {
      const seen = new Set();
      const items = [];
      Object.entries(dateMap || {}).forEach(([date, itemList = []]) => {
        if (filterDate && date > filterDate) {
          return;
        }
        itemList.forEach((item) => {
          if (!item || seen.has(item.id)) return;
          seen.add(item.id);
          items.push(item);
        });
      });
      acc[uid] = items;
      return acc;
    }, {});
  }, [userDailyItems, filterDate]);

  useEffect(() => {
    return () => {
      if (lineTooltipRef.current) {
        lineTooltipRef.current.remove();
        lineTooltipRef.current = null;
      }
      if (barTooltipRef.current) {
        barTooltipRef.current.remove();
        barTooltipRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetch("https://api.kero.zone/dogking/getAllItems")
      .then((response) => response.json())
      .then((data) => setAllItems(data))
      .catch((error) => console.error("Error fetching all items:", error));
  }, []);

  useEffect(() => {
    fetch("https://api.kero.zone/dogking/getadtimes")
      .then((response) => response.json())
      .then((dates) => {
        const adminDate = dates.find((d) => d.id === 2)?.date || null;
        setFilterDate(adminDate);
      })
      .catch((error) => console.error("Error fetching admin dates:", error));
  }, []);

  // 准备总积分 Chart.js 数据
  const chartData = {
    labels: scores.map((user) => user.name),
    datasets: [
      {
        label: "总积分",
        data: scores.map((user) => user.total_score),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions = useMemo(() => {
    const externalTooltipHandler = (context) => {
      const { chart, tooltip } = context;
      let tooltipEl = barTooltipRef.current;

      if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.style.background = "rgba(17, 24, 39, 0.85)";
        tooltipEl.style.borderRadius = "8px";
        tooltipEl.style.color = "#fff";
        tooltipEl.style.pointerEvents = "none";
        tooltipEl.style.padding = "8px";
        tooltipEl.style.position = "absolute";
        tooltipEl.style.transform = "translate(-50%, 12px)";
        tooltipEl.style.zIndex = "1000";
        tooltipEl.style.minWidth = "180px";
        document.body.appendChild(tooltipEl);
        barTooltipRef.current = tooltipEl;
      }

      if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
      }

      if (tooltip.body?.length) {
        const dataPoint = tooltip.dataPoints[0];
        const user = scores[dataPoint.dataIndex];
        const items = aggregatedUserItems[user?.uid] || [];
        tooltipEl.innerHTML = "";

        const title = document.createElement("div");
        title.style.fontWeight = "600";
        title.style.marginBottom = "4px";
        title.textContent = `${user?.name ?? ""}`;
        tooltipEl.appendChild(title);

        const scoreLine = document.createElement("div");
        scoreLine.style.marginBottom = "4px";
        scoreLine.textContent = `总分：${user?.total_score ?? 0}`;
        tooltipEl.appendChild(scoreLine);

        if (items.length) {
          const itemsWrap = document.createElement("div");
          itemsWrap.style.display = "flex";
          itemsWrap.style.flexWrap = "wrap";
          itemsWrap.style.maxWidth = "260px";
          items.forEach((item) => {
            const img = document.createElement("img");
            img.src = item.img;
            img.alt = item.name;
            img.title = item.name;
            img.style.width = "40px";
            img.style.height = "40px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "4px";
            img.style.margin = "2px";
            itemsWrap.appendChild(img);
          });
          tooltipEl.appendChild(itemsWrap);
        } else {
          const empty = document.createElement("div");
          empty.style.color = "#d1d5db";
          empty.textContent = "暂无道具记录";
          tooltipEl.appendChild(empty);
        }
      }

      const { top, left } = chart.canvas.getBoundingClientRect();
      tooltipEl.style.opacity = 1;
      tooltipEl.style.left = `${left + window.pageXOffset + tooltip.caretX}px`;
      tooltipEl.style.top = `${top + window.pageYOffset + tooltip.caretY}px`;
    };

    return {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
        },
      },
    };
  }, [scores, aggregatedUserItems]);

  // 准备日常积分 Chart.js 数据
  const userEntries = Array.from(
    new Map(
      dailyScores.map((score) => [
        score.uid,
        { uid: score.uid, name: score.name },
      ])
    ).values()
  );
  const allDates = (() => {
    if (dailyScores.length === 0) return [];
    const sortedDates = Array.from(
      new Set(dailyScores.map((score) => score.date))
    ).sort((a, b) => new Date(a) - new Date(b));
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    const dates = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      dates.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  })();

  const dailyScoresByUser = userEntries.map((user) => {
    const userScores = dailyScores.filter((score) => score.uid === user.uid);
    const scoreMap = Object.fromEntries(
      userScores.map((score) => [score.date, score.daily_score])
    );
    let cumulative = 0;
    return allDates.map((date) => {
      cumulative += scoreMap[date] || 0;
      return cumulative;
    });
  });

  const uidToColor = (uid, index) => {
    const hash = Array.from(uid).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    const hue = (hash + index * 137) % 360; // 加入索引 `index` 增加差异
    const saturation = 70; // 固定饱和度
    const lightness = 50; // 固定亮度
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const dailyChartData = {
    labels: allDates,
    datasets: userEntries.map((user, idx) => {
      const userScore = dailyScores.find((score) => score.uid === user.uid);
      const userColor = userScore
        ? uidToColor(userScore.uid, idx)
        : `hsl(${
            userEntries.length ? (idx * 360) / userEntries.length : 0
          }, 70%, 50%)`;
      return {
        label: user.name,
        data: dailyScoresByUser[idx],
        fill: false,
        borderColor: userColor,
        backgroundColor: userColor,
        tension: 0.1,
      };
    }),
  };

  const lineOptions = useMemo(() => {
    const externalTooltipHandler = (context) => {
      const { chart, tooltip } = context;
      let tooltipEl = lineTooltipRef.current;

      if (!tooltipEl) {
        tooltipEl = document.createElement("div");
        tooltipEl.style.background = "rgba(17, 24, 39, 0.85)";
        tooltipEl.style.borderRadius = "8px";
        tooltipEl.style.color = "#fff";
        tooltipEl.style.pointerEvents = "none";
        tooltipEl.style.padding = "8px";
        tooltipEl.style.position = "absolute";
        tooltipEl.style.transform = "translate(-50%, 12px)";
        tooltipEl.style.zIndex = "1000";
        tooltipEl.style.minWidth = "180px";
        document.body.appendChild(tooltipEl);
        lineTooltipRef.current = tooltipEl;
      }

      if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
      }

      if (tooltip.body?.length) {
        const dataPoints = tooltip.dataPoints || [];
        if (!dataPoints.length) {
          tooltipEl.style.opacity = 0;
          return;
        }
        const date = allDates[dataPoints[0].dataIndex];
        tooltipEl.innerHTML = "";

        const dateTitle = document.createElement("div");
        dateTitle.style.fontWeight = "600";
        dateTitle.style.marginBottom = "6px";
        dateTitle.textContent = `${date}`;
        tooltipEl.appendChild(dateTitle);

        dataPoints.forEach((dataPoint, idx) => {
          const user = userEntries[dataPoint.datasetIndex];
          const cumulativeScore = dataPoint.raw;
          const items =
            (user &&
              userDailyItems[user.uid] &&
              userDailyItems[user.uid][date]) ||
            [];

          const section = document.createElement("div");
          section.style.marginBottom = idx === dataPoints.length - 1 ? "0" : "8px";

          const title = document.createElement("div");
          title.style.fontWeight = "500";
          title.style.marginBottom = "4px";
          title.textContent = `${user?.name ?? ""}：${cumulativeScore} 分`;
          section.appendChild(title);

          if (items.length) {
            const itemsWrap = document.createElement("div");
            itemsWrap.style.display = "flex";
            itemsWrap.style.flexWrap = "wrap";
            itemsWrap.style.maxWidth = "260px";
            items.forEach((item) => {
              const img = document.createElement("img");
              img.src = item.img;
              img.alt = item.name;
              img.title = item.name;
              img.style.width = "40px";
              img.style.height = "40px";
              img.style.objectFit = "cover";
              img.style.borderRadius = "4px";
              img.style.margin = "2px";
              itemsWrap.appendChild(img);
            });
            section.appendChild(itemsWrap);
          } else {
            const empty = document.createElement("div");
            empty.style.color = "#d1d5db";
            empty.textContent = "该日无道具记录";
            section.appendChild(empty);
          }

          tooltipEl.appendChild(section);
        });
      }

      const { top, left } = chart.canvas.getBoundingClientRect();
        tooltipEl.style.opacity = 1;
      tooltipEl.style.left = `${left + window.pageXOffset + tooltip.caretX}px`;
      tooltipEl.style.top = `${top + window.pageYOffset + tooltip.caretY}px`;
    };

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "日期",
          },
        },
        y: {
          title: {
            display: true,
            text: "累积积分",
          },
        },
      },
    };
  }, [allDates, userEntries, userDailyItems]);

  return (
    <div className="page-background leaderboard-background">
      <Squares
        className="page-squares"
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="rgba(255,255,255,0.2)"
        hoverFillColor="rgba(255,255,255,0.2)"
      />
      <div className="page-content">
        <div className="leaderboard-wrapper">
          <div className="leaderboard-grid">
            <div className="leaderboard-main">
              <ElectricBorder
                color="#7df9ff"
                speed={1}
                chaos={0.5}
                thickness={2}
                style={{ borderRadius: 20 }}
              >
                <div className="leaderboard-card leaderboard-chart-card">
                  <h3 className="leaderboard-card__title">累积总分曲线图</h3>
                  <div className="leaderboard-chart">
                    {dailyScores.length > 0 ? (
                      <Line data={dailyChartData} options={lineOptions} />
                    ) : (
                      <p className="leaderboard-card__muted">加载中...</p>
                    )}
                  </div>
                </div>
              </ElectricBorder>

              <ElectricBorder
                color="#7df9ff"
                speed={1}
                chaos={0.5}
                thickness={2}
                style={{ borderRadius: 20 }}
              >
                <div className="leaderboard-card">
                  <h2 className="leaderboard-card__title">总分排行榜</h2>
                  <div className="leaderboard-chart">
                    {scores.length > 0 ? (
                      <Bar data={chartData} options={barOptions} />
                    ) : (
                      <p className="leaderboard-card__muted">加载中...</p>
                    )}
                  </div>
                </div>
              </ElectricBorder>
            </div>

            <ElectricBorder
              color="#7df9ff"
              speed={1}
              chaos={0.5}
              thickness={2}
              style={{ borderRadius: 20 }}
            >
              <div className="leaderboard-card">
                <h2 className="leaderboard-card__title">个人列表</h2>
                <ul className="leaderboard-list">
                  {scores.map((user, index) => (
                    <li key={user.uid} className="leaderboard-list__item">
                      <Link
                        to={`/view?uid=${user.uid}`}
                        className="leaderboard-list__link"
                      >
                        <span className="leaderboard-list__rank">
                          {index + 1}
                        </span>
                        <span className="leaderboard-list__name">
                          {user.name}
                        </span>
                        <span className="leaderboard-list__score">
                          {user.total_score} 分
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </ElectricBorder>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
