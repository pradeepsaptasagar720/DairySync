export default function KpiCard({ title, value, icon, trend, trendValue, color = "blue", subtitle, image }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };

  return (
    <div className="bg-white rounded-xl shadow border p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]} relative`}>
          {icon}
          {image && (
            <div className="absolute -top-1 -right-1 text-lg">
              {image}
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                trend === 'up' ? 'bg-green-100 text-green-800' : 
                trend === 'down' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
