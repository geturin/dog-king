import React, { useEffect, useState } from "react";
import Login from "./item/login"; // 登录组件
import Update from "./Update"; // 更新内容组件

const LoginAndUpdate = () => {
  const [uid, setUid] = useState(() => localStorage.getItem("uid")); // 存储登录成功后的 uid

  useEffect(() => {
    const storedUid = localStorage.getItem("uid");
    if (storedUid && storedUid !== uid) {
      setUid(storedUid);
    }
  }, [uid]);

  // 登录成功后的回调
  const handleLoginSuccess = (newUid) => {
    localStorage.setItem("uid", newUid);
    setUid(newUid); // 设置用户 uid
  };

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
