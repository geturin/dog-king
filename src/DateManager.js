import React, { useEffect, useState } from "react";
import axios from "axios";

const DateManager = () => {
  const [dates, setDates] = useState({ scoreDate: "", openDate: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the dates when the component loads
    axios
      .get("https://api.kero.zone/dogking/getadtimes")
      .then((response) => {
        const fetchedDates = response.data.reduce((acc, item) => {
          if (item.id === 1) acc.scoreDate = item.date;
          if (item.id === 2) acc.openDate = item.date;
          return acc;
        }, {});
        setDates(fetchedDates);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching dates:", error);
        setError("Failed to load dates.");
        setLoading(false);
      });
  }, []);

  const updateDate = (id, newDate) => {
    axios
      .post(
        `https://api.kero.zone/dogking/updateAdTime/?id=${id}&date=${newDate}`
      )
      .then((response) => {
        const updatedDate = response.data.new_date;
        if (id === 1) setDates((prev) => ({ ...prev, scoreDate: updatedDate }));
        if (id === 2) setDates((prev) => ({ ...prev, openDate: updatedDate }));
      })
      .catch((error) => {
        console.error("Error updating date:", error);
        setError("Failed to update the date.");
      });
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error)
    return <div className="text-center mt-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">日期管理</h1>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          <span className="font-bold">计分日期</span> ※只能对这个日期提交分数
        </label>
        <input
          type="date"
          className="w-full p-2 border rounded focus:outline-none focus:ring"
          value={dates.scoreDate}
          onChange={(e) => updateDate(1, e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2">
          <span className="font-bold">开分日期</span>{" "}
          ※分数统计只统计这个日期以及之前的数据
        </label>
        <input
          type="date"
          className="w-full p-2 border rounded focus:outline-none focus:ring"
          value={dates.openDate}
          onChange={(e) => updateDate(2, e.target.value)}
        />
      </div>

      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
};

export default DateManager;
