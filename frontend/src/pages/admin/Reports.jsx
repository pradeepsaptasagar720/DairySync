import { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service";
import { Calendar, Download, FileText, BarChart3, TrendingUp, Users, Milk } from "lucide-react";

export default function Reports() {
  const [reportData, setReportData] = useState({
    today: null,
    yesterday: null,
    currentMonth: null,
    previousMonth: null,
    custom: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Remove the automatic data fetching on component mount
  // useEffect(() => {
  //   fetchReportData();
  // }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [today, yesterday, currentMonth, previousMonth] = await Promise.all([
        adminService.getTodayReports(),
        adminService.getYesterdayReports(),
        adminService.getCurrentMonthReports(),
        adminService.getPreviousMonthReports()
      ]);

      setReportData({
        today: today.data?.data || today.data,
        yesterday: yesterday.data?.data || yesterday.data,
        currentMonth: currentMonth.data?.data || currentMonth.data,
        previousMonth: previousMonth.data?.data || previousMonth.data,
        custom: null
      });
      setReportGenerated(true);
    } catch (err) {
      console.error('Report fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomReport = async () => {
    if (!customDateRange.startDate || !customDateRange.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.getCustomDateReports(customDateRange);
      setReportData(prev => ({
        ...prev,
        custom: response.data?.data || response.data
      }));
      setSelectedReport('custom');
      setReportGenerated(true);
    } catch (err) {
      console.error('Custom report fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch custom report');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (selectedReport === 'custom') {
      await fetchCustomReport();
    } else {
      await fetchReportData();
    }
  };

  const generatePDFReport = () => {
    const data = reportData[selectedReport];
    if (!data) {
      setError('No data available for the selected report period');
      return;
    }

    // Create a comprehensive report with detailed breakdown
    let reportContent = `DAIRY MANAGEMENT SYSTEM - DETAILED REPORT\n`;
    reportContent += `Report Period: ${getReportPeriodLabel()}\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n`;
    reportContent += `${'='.repeat(80)}\n\n`;
    
    // Summary Section
    reportContent += `SUMMARY\n`;
    reportContent += `${'-'.repeat(40)}\n`;
    reportContent += `Total Cow Milk: ${data.milkCollection?.cow?.liters || 0}L (₹${data.milkCollection?.cow?.amount || 0})\n`;
    reportContent += `Total Buffalo Milk: ${data.milkCollection?.buffalo?.liters || 0}L (₹${data.milkCollection?.buffalo?.amount || 0})\n`;
    reportContent += `Grand Total: ${data.milkCollection?.total?.liters || 0}L (₹${data.milkCollection?.total?.amount || 0})\n`;
    reportContent += `Active Farmers: ${data.activeParticipants?.farmers || 0}\n`;
    reportContent += `Active Buyers: ${data.activeParticipants?.buyers || 0}\n\n`;

    // Detailed Date-wise and Session-wise Breakdown
    if (data.detailedBreakdown && data.detailedBreakdown.length > 0) {
      reportContent += `DETAILED DATE-WISE & SESSION-WISE BREAKDOWN\n`;
      reportContent += `${'-'.repeat(80)}\n`;
      reportContent += `Date       | Session  | Cow Milk    | Buffalo Milk | Total       | Farmers | Entries\n`;
      reportContent += `${'-'.repeat(80)}\n`;
      
      let currentDate = '';
      data.detailedBreakdown.forEach(item => {
        const dateStr = item.date === currentDate ? '          ' : item.date;
        currentDate = item.date;
        
        const cowMilk = `${item.cow.liters}L (₹${item.cow.amount})`.padEnd(11);
        const buffaloMilk = `${item.buffalo.liters}L (₹${item.buffalo.amount})`.padEnd(12);
        const totalMilk = `${item.total.liters}L (₹${item.total.amount})`.padEnd(11);
        
        reportContent += `${dateStr.padEnd(10)} | ${item.session.padEnd(8)} | ${cowMilk} | ${buffaloMilk} | ${totalMilk} | ${item.farmerCount.toString().padEnd(7)} | ${item.entries}\n`;
      });
      reportContent += `${'-'.repeat(80)}\n\n`;
      
      // Daily Totals
      const dailyTotals = {};
      data.detailedBreakdown.forEach(item => {
        if (!dailyTotals[item.date]) {
          dailyTotals[item.date] = {
            cowLiters: 0, cowAmount: 0,
            buffaloLiters: 0, buffaloAmount: 0,
            totalLiters: 0, totalAmount: 0,
            entries: 0, farmers: new Set()
          };
        }
        dailyTotals[item.date].cowLiters += item.cow.liters;
        dailyTotals[item.date].cowAmount += item.cow.amount;
        dailyTotals[item.date].buffaloLiters += item.buffalo.liters;
        dailyTotals[item.date].buffaloAmount += item.buffalo.amount;
        dailyTotals[item.date].totalLiters += item.total.liters;
        dailyTotals[item.date].totalAmount += item.total.amount;
        dailyTotals[item.date].entries += item.entries;
        item.farmerNames.forEach(name => dailyTotals[item.date].farmers.add(name));
      });

      reportContent += `DAILY TOTALS\n`;
      reportContent += `${'-'.repeat(60)}\n`;
      Object.entries(dailyTotals).forEach(([date, totals]) => {
        reportContent += `${date}:\n`;
        reportContent += `  Cow Milk: ${totals.cowLiters}L (₹${totals.cowAmount})\n`;
        reportContent += `  Buffalo Milk: ${totals.buffaloLiters}L (₹${totals.buffaloAmount})\n`;
        reportContent += `  Total: ${totals.totalLiters}L (₹${totals.totalAmount})\n`;
        reportContent += `  Entries: ${totals.entries} | Farmers: ${totals.farmers.size}\n\n`;
      });
    }

    // Sales Summary (if available)
    if (data.sales) {
      reportContent += `SALES SUMMARY\n`;
      reportContent += `${'-'.repeat(40)}\n`;
      reportContent += `Cow Milk Sales: ${data.sales?.cow?.liters || 0}L (₹${data.sales?.cow?.amount || 0})\n`;
      reportContent += `Buffalo Milk Sales: ${data.sales?.buffalo?.liters || 0}L (₹${data.sales?.buffalo?.amount || 0})\n`;
      reportContent += `Total Sales: ${data.sales?.total?.liters || 0}L (₹${data.sales?.total?.amount || 0})\n\n`;
    }

    // Performance Metrics
    reportContent += `PERFORMANCE METRICS\n`;
    reportContent += `${'-'.repeat(40)}\n`;
    const totalCollection = data.milkCollection?.total?.amount || 0;
    const totalSales = data.sales?.total?.amount || 0;
    const profit = totalSales - totalCollection;
    reportContent += `Total Revenue: ₹${totalSales}\n`;
    reportContent += `Total Collection Cost: ₹${totalCollection}\n`;
    reportContent += `Net Profit: ₹${profit}\n`;
    reportContent += `Profit Margin: ${totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) : 0}%\n\n`;

    reportContent += `${'-'.repeat(80)}\n`;
    reportContent += `Report generated by Dairy Management System\n`;
    reportContent += `© ${new Date().getFullYear()} - All rights reserved\n`;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dairy-detailed-report-${selectedReport}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getReportPeriodLabel = () => {
    switch (selectedReport) {
      case 'today': return "Today's Report";
      case 'yesterday': return "Yesterday's Report";
      case 'currentMonth': return "Current Month Report";
      case 'previousMonth': return "Previous Month Report";
      case 'custom': return `Custom Period (${customDateRange.startDate} to ${customDateRange.endDate})`;
      default: return "Unknown Period";
    }
  };

  const exportCSV = () => {
    const data = reportData[selectedReport];
    if (!data) {
      setError('No data available for the selected report period');
      return;
    }

    let csvContent = "";
    
    // If detailed breakdown is available, create detailed CSV
    if (data.detailedBreakdown && data.detailedBreakdown.length > 0) {
      csvContent = "Date,Session,Cow_Liters,Cow_Amount,Buffalo_Liters,Buffalo_Amount,Total_Liters,Total_Amount,Entries,Farmer_Count\n";
      
      data.detailedBreakdown.forEach(item => {
        csvContent += `${item.date},${item.session},${item.cow.liters},${item.cow.amount},${item.buffalo.liters},${item.buffalo.amount},${item.total.liters},${item.total.amount},${item.entries},${item.farmerCount}\n`;
      });
      
      // Add summary row
      csvContent += "\n--- SUMMARY ---\n";
      csvContent += "Category,Type,Liters,Amount,Entries\n";
    } else {
      // Fallback to simple format
      csvContent = "Category,Type,Liters,Amount,Date\n";
    }
    
    const reportDate = new Date().toISOString().split('T')[0];
    
    // Add summary data
    csvContent += `Milk Collection,Cow,${data.milkCollection?.cow?.liters || 0},${data.milkCollection?.cow?.amount || 0},${reportDate}\n`;
    csvContent += `Milk Collection,Buffalo,${data.milkCollection?.buffalo?.liters || 0},${data.milkCollection?.buffalo?.amount || 0},${reportDate}\n`;
    csvContent += `Milk Collection,Total,${data.milkCollection?.total?.liters || 0},${data.milkCollection?.total?.amount || 0},${reportDate}\n`;
    
    // Sales Data (if available)
    if (data.sales) {
      csvContent += `Sales,Cow,${data.sales?.cow?.liters || 0},${data.sales?.cow?.amount || 0},${reportDate}\n`;
      csvContent += `Sales,Buffalo,${data.sales?.buffalo?.liters || 0},${data.sales?.buffalo?.amount || 0},${reportDate}\n`;
      csvContent += `Sales,Total,${data.sales?.total?.liters || 0},${data.sales?.total?.amount || 0},${reportDate}\n`;
    }

    // Active Participants
    csvContent += `Active Participants,Farmers,${data.activeParticipants?.farmers || 0},0,${reportDate}\n`;
    csvContent += `Active Participants,Buyers,${data.activeParticipants?.buyers || 0},0,${reportDate}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dairy-detailed-data-${selectedReport}-${reportDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleReportTypeChange = (reportType) => {
    setSelectedReport(reportType);
    setReportGenerated(false); // Reset report generation status
    if (reportType === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Reports & Analytics
              </h2>
              <p className="text-gray-600 mt-1">Generate and export comprehensive dairy reports</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating report...</span>
        </div>
      </div>
    );
  }

  if (error && !reportGenerated) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Reports & Analytics
              </h2>
              <p className="text-gray-600 mt-1">Generate and export comprehensive dairy reports</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error generating report</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={generateReport}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentData = reportData[selectedReport];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Reports & Analytics
            </h2>
            <p className="text-gray-600 mt-1">Generate and export comprehensive dairy reports</p>
          </div>
          <button 
            onClick={fetchReportData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Report Period
            </label>
            <select 
              value={selectedReport}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">📅 Today's Report</option>
              <option value="yesterday">📅 Yesterday's Report</option>
              <option value="currentMonth">📊 Current Month Report</option>
              <option value="previousMonth">📊 Previous Month Report</option>
              <option value="custom">🗓️ Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomDatePicker && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Custom Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Report Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={generateReport}
            disabled={loading || (selectedReport === 'custom' && (!customDateRange.startDate || !customDateRange.endDate))}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-3 font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Report...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error generating report</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={generateReport}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Report Preview - Only show when report is generated */}
      {reportGenerated && currentData && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Report Preview - {getReportPeriodLabel()}
            </h3>
            <div className="text-sm text-gray-500">
              Generated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Milk Collection Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  <Milk className="w-5 h-5" />
                  Milk Collection
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Cow:</span>
                  <span className="font-medium">{currentData.milkCollection?.cow?.liters || 0}L (₹{currentData.milkCollection?.cow?.amount || 0})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-blue-700">Buffalo:</span>
                  <span className="font-medium">{currentData.milkCollection?.buffalo?.liters || 0}L (₹{currentData.milkCollection?.buffalo?.amount || 0})</span>
                </div>
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between font-semibold text-blue-800">
                    <span>Total:</span>
                    <span>{currentData.milkCollection?.total?.liters || 0}L (₹{currentData.milkCollection?.total?.amount || 0})</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sales Card */}
            {currentData.sales && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sales
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Cow:</span>
                    <span className="font-medium">{currentData.sales?.cow?.liters || 0}L (₹{currentData.sales?.cow?.amount || 0})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Buffalo:</span>
                    <span className="font-medium">{currentData.sales?.buffalo?.liters || 0}L (₹{currentData.sales?.buffalo?.amount || 0})</span>
                  </div>
                  <div className="border-t border-green-200 pt-2">
                    <div className="flex justify-between font-semibold text-green-800">
                      <span>Total:</span>
                      <span>{currentData.sales?.total?.liters || 0}L (₹{currentData.sales?.total?.amount || 0})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Active Participants Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Participants
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Farmers:</span>
                  <span className="font-medium">{currentData.activeParticipants?.farmers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-purple-700">Buyers:</span>
                  <span className="font-medium">{currentData.activeParticipants?.buyers || 0}</span>
                </div>
                <div className="border-t border-purple-200 pt-2">
                  <div className="flex justify-between font-semibold text-purple-800">
                    <span>Total:</span>
                    <span>{(currentData.activeParticipants?.farmers || 0) + (currentData.activeParticipants?.buyers || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Date-wise and Session-wise Breakdown */}
          {currentData.detailedBreakdown && currentData.detailedBreakdown.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Date-wise & Session-wise Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cow Milk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buffalo Milk</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.detailedBreakdown.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.session === 'Morning' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.session}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.cow.liters}L (₹{item.cow.amount})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.buffalo.liters}L (₹{item.buffalo.amount})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.total.liters}L (₹{item.total.amount})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.farmerCount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Buttons - Only show when report is generated */}
      {reportGenerated && currentData && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Export Options
          </h3>
          
          <div className="flex gap-4">
            <button 
              onClick={generatePDFReport}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Detailed Report (TXT)
            </button>
            
            <button 
              onClick={exportCSV}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Detailed CSV
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>• Reports include comprehensive date-wise and session-wise breakdown</p>
            <p>• TXT format provides detailed formatted report with daily totals</p>
            <p>• CSV format provides structured data for analysis in spreadsheet applications</p>
            <p>• Custom date reports show morning and evening session details</p>
          </div>
        </div>
      )}

      {/* No Report Generated Message */}
      {!reportGenerated && !loading && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Generate Report</h3>
            <p className="text-gray-600 mb-4">
              Select a report period above and click "Generate Report" to view detailed analytics
            </p>
            <div className="text-sm text-gray-500">
              <p>• Choose from predefined periods or select custom date range</p>
              <p>• View comprehensive date-wise and session-wise breakdowns</p>
              <p>• Export detailed reports in TXT and CSV formats</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
