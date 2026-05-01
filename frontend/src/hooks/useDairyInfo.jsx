import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const DairyInfoContext = createContext();

export const DairyInfoProvider = ({ children }) => {
  const [dairyInfo, setDairyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDairyInfo = async () => {
    try {
      const res = await api.get("/api/public/dairy-info");
      const data = res.data.data;
      setDairyInfo(data); // Can be null if no dairy info exists
    } catch (err) {
      console.error("Error fetching dairy info:", err);
      setDairyInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDairyInfo();
  }, []);

  const refreshDairyInfo = () => {
    setLoading(true);
    fetchDairyInfo();
  };

  const getDairyDisplayName = () => {
    if (!dairyInfo || !dairyInfo.dairyName) {
      return "Dairy Management System";
    }
    return dairyInfo.dairyName;
  };

  const getDairyLocation = () => {
    if (!dairyInfo || !dairyInfo.place) {
      return "Please add dairy information";
    }
    const parts = [dairyInfo.place, dairyInfo.taluka, dairyInfo.district].filter(Boolean);
    return parts.join(", ");
  };

  const getDairyContact = () => {
    if (!dairyInfo) return "";
    return dairyInfo.mobileNo || "";
  };

  const value = {
    dairyInfo,
    loading,
    refreshDairyInfo,
    getDairyDisplayName,
    getDairyLocation,
    getDairyContact
  };

  return (
    <DairyInfoContext.Provider value={value}>
      {children}
    </DairyInfoContext.Provider>
  );
};

export const useDairyInfo = () => {
  const context = useContext(DairyInfoContext);
  if (!context) {
    throw new Error("useDairyInfo must be used within a DairyInfoProvider");
  }
  return context;
};