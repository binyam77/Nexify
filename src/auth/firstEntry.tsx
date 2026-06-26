import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // የሎጎህን መገኛ መንገድ እዚህ ጋር ማስተካከል ትችላለህ
const firstEntry: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const user = localStorage.getItem("user");

      if (user) {
        navigate("../pages/home");
      } else {
        navigate("/createAccount");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white overflow-hidden select-none">
      <div className="flex items-center justify-center">
        <img
          src={logo}
          alt="Nexify Logo"
          className="w-[130px] h-[130px] rounded-[25px] object-contain max-[600px]:w-[100px] max-[600px]:h-[100px]"
        />
      </div>
    </div>
  );
};

export default firstEntry;
