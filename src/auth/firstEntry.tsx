import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../routes";
import logo from "../assets/logo.png";

const FirstEntry: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) return;
      if (isLoggedIn) {
        navigate(ROUTES.home);
      } else {
        navigate("/createAccount");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, isLoggedIn, isLoading]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bodey-bg overflow-hidden select-none">
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

export default FirstEntry;
