import { useState, useEffect } from "react";
import ProfessionalNavigation from "../components/landing/ProfessionalNavigation";
import HeroSection from "../components/landing/HeroSection";
import RoleShowcase from "../components/landing/RoleShowcase";
import api from "../services/api";

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLandingStats();
  }, []);

  const fetchLandingStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/public/landing-stats");
      setStats(response.data.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching landing stats:", error);
      setError("Failed to load system statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Professional Navigation */}
      <ProfessionalNavigation stats={stats} loading={loading} />
      
      {/* Hero Section with Live Dashboard */}
      <HeroSection stats={stats} loading={loading} />
      
      {/* Role-based Feature Showcase */}
      <RoleShowcase stats={stats} loading={loading} />
    
    </div>
  );
}
