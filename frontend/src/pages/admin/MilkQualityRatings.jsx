import { useState, useEffect } from "react";
import { Star, Download } from "lucide-react";
import api from "../../services/api";

export default function MilkQualityRatings() {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/ratings", {
        params: { page, limit: 20 }
      });
      if (response.data.success) {
        setRatings(response.data.data.ratings);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/ratings/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.get("/api/admin/ratings/export", {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `milk-quality-ratings-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exporting ratings:", err);
      alert("Failed to export ratings");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchRatings();
    fetchStats();
  }, [page]);

  const renderStars = (rating) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );

  const getRatingColorClass = (rating) => {
    if (rating <= 2) return "bg-red-50 border-red-200";
    if (rating === 3) return "bg-yellow-50 border-yellow-200";
    return "bg-white border-gray-200";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Milk Quality Ratings</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-300"
        >
          <Download size={18} />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Average Rating</div>
            <div className="text-3xl font-bold text-blue-600">{stats.averageRating.toFixed(2)}</div>
            <div className="mt-2">{renderStars(Math.round(stats.averageRating))}</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Ratings</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalRatings}</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Low Ratings (Last 7 Days)</div>
            <div className="text-3xl font-bold text-red-600">{stats.lowRatingsLast7Days}</div>
          </div>
        </div>
      )}

      {/* Ratings Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : ratings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No ratings found
                  </td>
                </tr>
              ) : (
                ratings.map((rating) => (
                  <tr key={rating._id} className={getRatingColorClass(rating.rating)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{String(rating.orderId).slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rating.buyerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStars(rating.rating)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                      {rating.comments || <span className="text-gray-400 italic">No comments</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
