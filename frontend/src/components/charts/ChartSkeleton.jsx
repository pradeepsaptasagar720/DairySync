const ChartSkeleton = ({ height = 350 }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div 
        className="bg-gray-100 rounded" 
        style={{ height: `${height}px` }}
      ></div>
    </div>
  );
};

export default ChartSkeleton;
