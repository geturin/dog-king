import React, { useEffect, useState } from "react";
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

  const options = {
    indexAxis: "y", // 横向柱状图
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw} 分`,
        },
      },
    },
  };

  // 准备日常积分 Chart.js 数据
  const users = Array.from(new Set(dailyScores.map((score) => score.name)));
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

  const dailyScoresByUser = users.map((user) => {
    const userScores = dailyScores.filter((score) => score.name === user);
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
    datasets: users.map((user, idx) => {
      const userScore = dailyScores.find((score) => score.name === user);
      const userColor = userScore
        ? uidToColor(userScore.uid, idx)
        : `hsl(${(idx * 360) / users.length}, 70%, 50%)`;
      return {
        label: user,
        data: dailyScoresByUser[idx],
        fill: false,
        borderColor: userColor,
        backgroundColor: userColor,
        tension: 0.1,
      };
    }),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
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

  return (
    <div className="p-4 w-full">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="bg-white p-4 rounded shadow" style={{ height: "500px" }}>
            <h3 className="text-xl font-bold mb-4 text-center">累积总分曲线图</h3>
            {dailyScores.length > 0 ? (
              <Line data={dailyChartData} options={lineOptions} />
            ) : (
              <p className="text-gray-500 text-center">加载中...</p>
            )}
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-center">总分排行榜</h2>
            <div className="bg-white rounded">
              {scores.length > 0 ? (
                <Bar data={chartData} options={options} />
              ) : (
                <p className="text-gray-500 text-center">加载中...</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-center">个人列表</h2>
          <ul className="space-y-2">
            {scores.map((user, index) => (
              <li
                key={user.uid}
                className="flex justify-between items-center bg-gray-100 p-2 rounded"
              >
                <Link
                  to={`/view?uid=${user.uid}`}
                  className="flex w-full justify-between text-gray-500 hover:text-blue-500"
                >
                  <span className="font-bold text-gray-700">{index + 1}</span>
                  <span className="text-gray-700">{user.name}</span>
                  <span className="text-gray-500">{user.total_score} 分</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
