# Design Document: Revenue Analytics Visualization Enhancement

## Overview

This design enhances the Revenue Analytics page by transforming it from a basic card-based layout into a comprehensive, modern analytics dashboard. The enhancement introduces interactive charts (line, bar, donut), animated metric cards with gradients, smooth transitions, and professional visual design while maintaining all existing functionality including backend API integration and FeedService data merging.

The design leverages Recharts for data visualization, framer-motion for animations, and follows the existing application design patterns established in components like AnimatedCounter, ProfessionalCard, and GradientButton.

## Architecture

### Component Hierarchy

```
RevenueAnalytics (Main Container)
├── FilterSection
│   ├── DateRangeFilter
│   ├── MonthFilter
│   └── YearFilter
├── LoadingState (Skeleton)
├── ErrorDisplay
├── BestPerformingSection
├── MetricCardsGrid
│   ├── AnimatedMetricCard (Revenue Sources)
│   ├── AnimatedMetricCard (Expenses)
│   └── AnimatedMetricCard (Financial Summary)
├── ChartsGrid
│   ├── RevenueTrendLineChart
│   ├── IncomeVsExpensesBarChart
│   ├── ExpenseDistributionDonutChart
│   └── RevenueDistributionDonutChart
└── ChartLegend
```

### Data Flow

```
User Action (Filter Change)
    ↓
fetchRevenueData()
    ↓
Backend API (/api/admin/revenue-analytics) + FeedService (localStorage)
    ↓
Data Merging & Calculation
    ↓
State Update (setData)
    ↓
Component Re-render with Animations
    ↓
Charts Update with Transitions
```

## Components and Interfaces

### 1. AnimatedMetricCard Component

**Purpose**: Display key financial metrics with gradient backgrounds, animated counters, and trend indicators.

**Props Interface**:
```typescript
interface AnimatedMetricCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  delay?: number;
}
```

**Implementation**:
```javascript
const AnimatedMetricCard = ({ 
  title, amount, icon: Icon, gradientFrom, gradientTo, 
  subtitle, trend, delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend.direction === 'up' ? 'text-green-200' : 'text-red-200'}`}>
            {trend.direction === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-white/80 text-sm mb-2">{title}</p>
      <AnimatedCounter 
        end={amount} 
        duration={2000}
        prefix="₹"
        decimals={2}
        separator=","
        className="text-3xl font-bold"
      />
      {subtitle && <p className="text-white/70 text-xs mt-2">{subtitle}</p>}
    </motion.div>
  );
};
```

### 2. RevenueTrendLineChart Component

**Purpose**: Display revenue trends over time with multiple lines for different revenue sources.

**Props Interface**:
```typescript
interface RevenueTrendLineChartProps {
  data: Array<{
    date: string;
    transportedMilk: number;
    buyerPayments: number;
    feedSales: number;
  }>;
  loading?: boolean;
}
```

**Implementation**:
```javascript
const RevenueTrendLineChart = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trends Over Time</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
          />
          <Line 
            type="monotone" 
            dataKey="transportedMilk" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Transported Milk"
            animationDuration={1000}
          />
          <Line 
            type="monotone" 
            dataKey="buyerPayments" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Buyer Payments"
            animationDuration={1000}
          />
          <Line 
            type="monotone" 
            dataKey="feedSales" 
            stroke="#F59E0B" 
            strokeWidth={3}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Feed Sales"
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend items={[
        { color: '#3B82F6', label: 'Transported Milk' },
        { color: '#10B981', label: 'Buyer Payments' },
        { color: '#F59E0B', label: 'Feed Sales' }
      ]} />
    </motion.div>
  );
};
```

### 3. IncomeVsExpensesBarChart Component

**Purpose**: Compare income and expense categories side-by-side.

**Props Interface**:
```typescript
interface IncomeVsExpensesBarChartProps {
  data: {
    income: Array<{ category: string; amount: number }>;
    expenses: Array<{ category: string; amount: number }>;
  };
  loading?: boolean;
}
```

**Implementation**:
```javascript
const IncomeVsExpensesBarChart = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  // Transform data for grouped bar chart
  const chartData = [
    {
      category: 'Transported Milk',
      income: data.income.find(i => i.category === 'transportedMilk')?.amount || 0,
      type: 'income'
    },
    {
      category: 'Buyer Payments',
      income: data.income.find(i => i.category === 'buyerPayments')?.amount || 0,
      type: 'income'
    },
    {
      category: 'Feed Sales',
      income: data.income.find(i => i.category === 'feedSales')?.amount || 0,
      type: 'income'
    },
    {
      category: 'Farmer Payments',
      expense: data.expenses.find(e => e.category === 'farmerPayments')?.amount || 0,
      type: 'expense'
    },
    {
      category: 'Employee Salaries',
      expense: data.expenses.find(e => e.category === 'employeeSalaries')?.amount || 0,
      type: 'expense'
    },
    {
      category: 'Other Expenses',
      expense: data.expenses.find(e => e.category === 'otherExpenses')?.amount || 0,
      type: 'expense'
    },
    {
      category: 'Feed Purchases',
      expense: data.expenses.find(e => e.category === 'feedPurchases')?.amount || 0,
      type: 'expense'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Income vs Expenses Comparison</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="category" 
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
          />
          <Bar 
            dataKey="income" 
            fill="url(#incomeGradient)" 
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
          <Bar 
            dataKey="expense" 
            fill="url(#expenseGradient)" 
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
```

### 4. DonutChart Component (Reusable)

**Purpose**: Display distribution percentages for expenses or revenue sources.

**Props Interface**:
```typescript
interface DonutChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  centerLabel: string;
  centerValue: number;
  loading?: boolean;
  delay?: number;
}
```

**Implementation**:
```javascript
const DonutChart = ({ title, data, centerLabel, centerValue, loading, delay = 0 }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1000}
            animationBegin={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              `₹${value.toLocaleString('en-IN')} (${((value / total) * 100).toFixed(1)}%)`,
              name
            ]}
          />
          <text 
            x="50%" 
            y="45%" 
            textAnchor="middle" 
            dominantBaseline="middle"
            className="text-sm text-gray-600 font-medium"
          >
            {centerLabel}
          </text>
          <text 
            x="50%" 
            y="55%" 
            textAnchor="middle" 
            dominantBaseline="middle"
            className="text-2xl font-bold text-gray-800"
          >
            ₹{centerValue.toLocaleString('en-IN')}
          </text>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
```

### 5. BestPerformingSection Component

**Purpose**: Highlight the top revenue source.

**Props Interface**:
```typescript
interface BestPerformingSectionProps {
  source: {
    name: string;
    amount: number;
    percentage: number;
    icon: LucideIcon;
  };
}
```

**Implementation**:
```javascript
const BestPerformingSection = ({ source }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-xl shadow-2xl p-8 text-white mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <source.icon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-purple-200 text-sm font-medium">Best Performing Revenue Source</p>
            <h2 className="text-3xl font-bold mt-1">{source.name}</h2>
          </div>
        </div>
        <div className="text-right">
          <AnimatedCounter 
            end={source.amount}
            duration={2000}
            prefix="₹"
            decimals={2}
            separator=","
            className="text-4xl font-bold"
          />
          <p className="text-purple-200 text-sm mt-1">
            {source.percentage.toFixed(1)}% of total revenue
          </p>
        </div>
      </div>
    </motion.div>
  );
};
```

### 6. ChartSkeleton Component

**Purpose**: Display loading state for charts.

**Implementation**:
```javascript
const ChartSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-[350px] bg-gray-100 rounded"></div>
    </div>
  );
};
```

### 7. FilterSection Component

**Purpose**: Maintain existing filter functionality with enhanced styling.

**Implementation**: Keep existing filter logic but enhance with:
- Gradient buttons using GradientButton component
- Better spacing and visual hierarchy
- Smooth transitions on filter changes

## Data Models

### Revenue Data Structure

```typescript
interface RevenueData {
  summary: {
    // Revenue Sources
    transportedMilkAmount: number;
    buyerPaymentsReceived: number;
    feedSalesToFarmers: number;
    
    // Expenses
    farmerPaymentsTotal: number;
    employeeSalariesPaid: number;
    otherExpensesTotal: number;
    feedStockPurchases: number;
    
    // Totals
    netCollectedAmount: number;
    netPaidAmount: number;
    profitLoss: number;
    feedProfitLoss: number;
  };
  
  // Time-series data for charts (to be added to backend)
  trends?: {
    daily: Array<{
      date: string;
      transportedMilk: number;
      buyerPayments: number;
      feedSales: number;
    }>;
  };
}
```

### Chart Data Transformations

```javascript
// Transform summary data for donut charts
const transformToDonutData = (categories, colors) => {
  return categories.map((cat, index) => ({
    name: cat.name,
    value: cat.amount,
    color: colors[index]
  }));
};

// Transform for bar chart
const transformToBarData = (income, expenses) => {
  return [
    ...income.map(item => ({ ...item, type: 'income' })),
    ...expenses.map(item => ({ ...item, type: 'expense' }))
  ];
};

// Calculate best performing source
const calculateBestPerforming = (summary) => {
  const sources = [
    { 
      name: 'Transported Milk', 
      amount: summary.transportedMilkAmount,
      icon: Truck
    },
    { 
      name: 'Buyer Payments', 
      amount: summary.buyerPaymentsReceived,
      icon: ShoppingCart
    },
    { 
      name: 'Feed Sales', 
      amount: summary.feedSalesToFarmers,
      icon: Wheat
    }
  ];
  
  const best = sources.reduce((max, source) => 
    source.amount > max.amount ? source : max
  );
  
  const total = summary.netCollectedAmount;
  const percentage = (best.amount / total) * 100;
  
  return { ...best, percentage };
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

