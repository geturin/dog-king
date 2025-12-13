import React, { useCallback, useEffect, useState } from "react";
import Login from "./item/login"; // 登录组件
import Update from "./Update"; // 更新内容组件

const LoginAndUpdate = () => {
  const [uid, setUid] = useState(() => localStorage.getItem("uid")); // 存储登录成功后的 uid
  const [checkingSession, setCheckingSession] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem("uid");
    localStorage.removeItem("dogkingCredential");
    setUid(null);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const storedUid = localStorage.getItem("uid");
      const storedCredential = localStorage.getItem("dogkingCredential");

      if (!storedUid || !storedCredential) {
        clearSession();
        setCheckingSession(false);
        return;
      }

      let credentialObj = null;
      try {
        credentialObj = JSON.parse(atob(storedCredential));
      } catch (error) {
        console.error("Failed to parse stored credential", error);
        clearSession();
        setCheckingSession(false);
        return;
      }

      const { username, password } = credentialObj || {};
      if (!username || !password) {
        clearSession();
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.kero.zone/dogking/login?name=${encodeURIComponent(
            username
          )}&psw=${encodeURIComponent(password)}`
        );
        const data = await response.json();
        if (data.uid && data.uid !== "0") {
          localStorage.setItem("uid", data.uid);
          setUid(data.uid);
        } else {
          clearSession();
        }
      } catch (error) {
        console.error("Error verifying session:", error);
        clearSession();
      } finally {
        setCheckingSession(false);
      }
    };

    verifySession();
  }, [clearSession]);

  // 登录成功后的回调
  const handleLoginSuccess = (newUid, credentials) => {
    localStorage.setItem("uid", newUid);
    if (credentials) {
      try {
        const encoded = btoa(JSON.stringify(credentials));
        localStorage.setItem("dogkingCredential", encoded);
      } catch (error) {
        console.error("Failed to persist credential", error);
      }
    }
    setUid(newUid); // 设置用户 uid
    setCheckingSession(false);
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        验证登录状态中...
      </div>
    );
  }

  return (
    <div>
      {uid ? (
        // 如果 uid 存在，渲染 Update 组件
        <Update uid={uid} />
      ) : (
        // 否则渲染 Login 组件
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default LoginAndUpdate;
