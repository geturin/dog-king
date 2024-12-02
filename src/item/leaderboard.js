import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Leaderboard = () => {
  const [scores, setScores] = useState([]);

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
  }, []);

  // 准备 Chart.js 数据
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

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">总分排行榜</h2>
      <div className="bg-white p-4 rounded shadow">
        {scores.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <p className="text-gray-500 text-center">加载中...</p>
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {scores.map((user, index) => (
          <li
            key={user.uid}
            className="flex justify-between items-center bg-gray-100 p-2 rounded"
          >
            <span className="font-bold text-gray-700">{index + 1}</span>
            <span className="text-gray-700">{user.name}</span>
            <span className="text-gray-500">{user.total_score} 分</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
