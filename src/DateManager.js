import React, { useEffect, useState } from "react";
import axios from "axios";

const DateManager = () => {
  const [dates, setDates] = useState({ scoreDate: "", openDate: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missingUsers, setMissingUsers] = useState([]);
  const [checkingMissing, setCheckingMissing] = useState(false);
  const [missingError, setMissingError] = useState(null);

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

  useEffect(() => {
    if (!dates.scoreDate) return;

    let canceled = false;
    const fetchMissingUsers = async () => {
      setCheckingMissing(true);
      setMissingError(null);
      try {
        const usersRes = await axios.get(
          "https://api.kero.zone/dogking/alluserscores"
        );
        const users = usersRes.data || [];

        const results = await Promise.all(
          users.map(async (user) => {
            try {
              const res = await axios.get(
                `https://api.kero.zone/dogking/getuUserScoreGroupByDate?uid=${user.uid}`
              );
              const records = res.data || {};
              const hasSubmission = Object.prototype.hasOwnProperty.call(
                records,
                dates.scoreDate
              );
              return { user, hasSubmission };
            } catch (err) {
              console.error(
                `Error fetching submissions for UID ${user.uid}:`,
                err
              );
              return { user, hasSubmission: false, error: true };
            }
          })
        );

        if (canceled) return;

        if (results.some((r) => r.error)) {
          setMissingError("部分用户数据无法获取，结果可能不完整。");
        }

        const missingList = results
          .filter((result) => !result.hasSubmission)
          .map((result) => result.user.name || `UID ${result.user.uid}`);

        setMissingUsers(missingList);
      } catch (err) {
        if (canceled) return;
        console.error("Error fetching missing submissions:", err);
        setMissingError("无法获取未提交名单。");
        setMissingUsers([]);
      } finally {
        if (!canceled) {
          setCheckingMissing(false);
        }
      }
    };

    fetchMissingUsers();

    return () => {
      canceled = true;
    };
  }, [dates.scoreDate]);

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

      <div className="mt-6 p-4 bg-gray-50 border rounded">
        <h2 className="text-xl font-semibold mb-2">计分日期未提交名单</h2>
        <p className="text-sm text-gray-600 mb-3">
          当前计分日期：{dates.scoreDate || "未设置"}
        </p>
        {checkingMissing ? (
          <p className="text-gray-500">检查中...</p>
        ) : missingError ? (
          <p className="text-red-500">{missingError}</p>
        ) : missingUsers.length === 0 ? (
          <p className="text-green-600">所有用户都已提交该日期的数据。</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {missingUsers.map((name, idx) => (
              <li key={`${name}-${idx}`}>{name}</li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
};

export default DateManager;
