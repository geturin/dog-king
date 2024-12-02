import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allUsernames, setAllUsernames] = useState([]);

  useEffect(() => {
    // Fetch all registered usernames when component mounts
    const fetchUsernames = async () => {
      try {
        const response = await fetch(
          "https://api.kero.zone/dogking/allusername"
        );
        const data = await response.json();
        setAllUsernames(data.flat()); // Flattening the array
      } catch (error) {
        console.error("Failed to fetch usernames", error);
      }
    };

    fetchUsernames();
  }, []);

  const handleRegister = async () => {
    if (username.length > 10) {
      setError("用户名不能超过10个字符");
      return;
    }
    if (password.length > 4) {
      setError("密码不能超过4个字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (allUsernames.includes(username)) {
      setError("用户名已存在，请选择其他用户名");
      return;
    }
    setError("");

    try {
      const response = await fetch(
        `https://api.kero.zone/dogking/register?name=${username}&psw=${password}`
      );
      const data = await response.json();

      if (data.uid && data.uid !== 0) {
        window.location.href = "/update";
      } else {
        setError("注册失败，请重试");
      }
    } catch (error) {
      setError("网络错误,稍等重试或者联络管理员");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-green-500 to-teal-600">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-center text-2xl font-bold mb-4 text-gray-800">
          用户注册
        </h2>
        <form>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-gray-700 font-medium"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-300"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-300"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 font-medium"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-teal-300"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-3">{success}</p>}
          <button
            type="button"
            className="w-full bg-teal-500 text-white py-2 rounded hover:bg-teal-600 transition duration-200"
            onClick={handleRegister}
          >
            Register
          </button>
          <Link to="/Update">
            <button
              type="button"
              className="w-full bg-gray-500 text-white py-2 rounded mt-3 hover:bg-gray-600 transition duration-200"
            >
              返回登录
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Register;
