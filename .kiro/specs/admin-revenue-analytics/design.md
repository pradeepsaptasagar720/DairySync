# Design Document: Admin Revenue Analytics

## Overview

The Admin Revenue Analytics feature provides a comprehensive financial dashboard that aggregates data from multiple payment sources (transported milk, employee salaries, farmer payments, buyer payments, other expenses, feed sales to farmers, and feed stock purchases) to calculate profit/loss metrics and provide detailed financial insights. The system uses React for the frontend with Tailwind CSS for styling, and Node.js/Express with MongoDB for the backend.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Revenue Analytics                   │
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Filter     │  │   Summary    │  │    Trend     │     │
│  │   Controls   │  │    Cards     │  │    Chart     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Breakdown   │  │  Comparison  │  │    Export    │     │
│  │   Tables     │  │   Metrics    │  │   Controls   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Revenue Analytics Controller                  │  │
│  │  - Aggregate financial data from multiple sources    │  │
│  │  - Apply filters and date ranges                     │  │
│  │  - Calculate profit/loss metrics                     │  │
│  │  - Generate comparison data                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ Data Access
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (MongoDB)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Transport  │  │   Employee   │  │    Farmer    │     │
│  │  Collection  │  │   Payment    │  │   Payment    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Delivery   │  │    Other     │  │  Feed Sale   │     │
│  │  (Buyer Pay) │  │   Expenses   │  │  to Farmers  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐                                          │
│  │  Feed Stock  │                                          │
│  │  Purchases   │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. RevenueAnalytics (Main Component)
```typescript
interface RevenueAnalyticsProps {}

interface RevenueAnalyticsState {
  loading: boolean;
  error: string | null;
  data: RevenueData | null;
  filters: FilterState;
  comparisonData: ComparisonData | null;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  month: string;
  year: string;
  customPeriod: CustomPeriod | null;
}

interface CustomPeriod {
  startDate: string;
  endDate: string;
  label: string;
}
```

#### 2. FilterControls Component
```typescript
interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}
```

#### 3. SummaryCard Component
```typescript
interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'yellow' | 'purple';
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}
```

#### 4. TrendChart Component
```typescript
interface TrendChartProps {
  data: ChartDataPoint[];
  dateRange: { start: string; end: string };
}

interface ChartDataPoint {
  date: string;
  profitLoss: number;
  collected: number;
  paid: number;
}
```

#### 5. BreakdownTable Component
```typescript
interface BreakdownTableProps {
  title: string;
  data: TransactionRecord[];
  columns: ColumnDefinition[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

interface TransactionRecord {
  _id: string;
  date: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  status?: string;
}
```

#### 6. ExportControls Component
```typescript
interface ExportControlsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  loading: boolean;
}
```

### Backend API Endpoints

#### 1. Get Revenue Analytics Data
```
GET /api/admin/revenue-analytics

Query Parameters:
- dateFrom: string (ISO date)
- dateTo: string (ISO date)
- month: string (1-12)
- year: string (YYYY)

Response:
{
  success: boolean;
  data: {
    summary: {
      transportedMilkAmount: number;
      employeeSalariesPaid: number;
      farmerPaymentsTotal: number;
      buyerPaymentsReceived: number;
      otherExpensesTotal: number;
      feedSalesToFarmers: number;
      feedStockPurchases: number;
      netCollectedAmount: number;
      netPaidAmount: number;
      feedProfitLoss: number;
      profitLoss: number;
    };
    breakdown: {
      transportMilk: TransportRecord[];
      employeeSalaries: EmployeePaymentRecord[];
      farmerPayments: FarmerPaymentRecord[];
      buyerPayments: BuyerPaymentRecord[];
      otherExpenses: OtherExpenseRecord[];
      feedSales: FeedSaleRecord[];
      feedPurchases: FeedPurchaseRecord[];
    };
    chartData: ChartDataPoint[];
  };
  message: string;
}
```

#### 2. Get Comparison Data
```
GET /api/admin/revenue-analytics/comparison

Query Parameters:
- currentPeriodStart: string (ISO date)
- currentPeriodEnd: string (ISO date)

Response:
{
  success: boolean;
  data: {
    current: PeriodMetrics;
    previous: PeriodMetrics;
    changes: {
      profitLoss: { value: number; percentage: number };
      collected: { value: number; percentage: number };
      paid: { value: number; percentage: number };
    };
  };
  message: string;
}
```

#### 3. Export Revenue Report
```
POST /api/admin/revenue-analytics/export

Body:
{
  format: 'pdf' | 'excel';
  filters: FilterState;
  includeCharts: boolean;
  includeBreakdown: boolean;
}

Response:
{
  success: boolean;
  data: {
    downloadUrl: string;
    filename: string;
    expiresAt: string;
  };
  message: string;
}
```

### Backend Services

#### 1. RevenueAggregationService
```typescript
class RevenueAggregationService {
  // Aggregate all financial data for a given period
  async aggregateRevenueData(filters: FilterState): Promise<RevenueData>;
  
  // Get transported milk total amount
  async getTransportedMilkAmount(dateRange: DateRange): Promise<number>;
  
  // Get employee salaries paid
  async getEmployeeSalariesPaid(dateRange: DateRange): Promise<number>;
  
  // Get farmer payments total
  async getFarmerPaymentsTotal(dateRange: DateRange): Promise<number>;
  
  // Get buyer payments received
  async getBuyerPaymentsReceived(dateRange: DateRange): Promise<number>;
  
  // Get other expenses total
  async getOtherExpensesTotal(dateRange: DateRange): Promise<number>;
  
  // Get feed sales to farmers total
  async getFeedSalesToFarmers(dateRange: DateRange): Promise<number>;
  
  // Get feed stock purchases total
  async getFeedStockPurchases(dateRange: DateRange): Promise<number>;
  
  // Calculate net collected amount
  calculateNetCollected(transportAmount: number, buyerPayments: number, feedSales: number): number;
  
  // Calculate net paid amount
  calculateNetPaid(farmerPayments: number, employeeSalaries: number, otherExpenses: number, feedPurchases: number): number;
  
  // Calculate feed profit/loss
  calculateFeedProfitLoss(feedSales: number, feedPurchases: number): number;
  
  // Calculate overall profit/loss
  calculateProfitLoss(netCollected: number, netPaid: number): number;
}
```

#### 2. ComparisonService
```typescript
class ComparisonService {
  // Get comparison data for current vs previous period
  async getComparisonData(currentPeriod: DateRange): Promise<ComparisonData>;
  
  // Calculate previous period based on current period
  calculatePreviousPeriod(currentPeriod: DateRange): DateRange;
  
  // Calculate percentage change
  calculatePercentageChange(current: number, previous: number): number;
}
```

#### 3. ExportService
```typescript
class ExportService {
  // Generate PDF report
  async generatePDFReport(data: RevenueData, filters: FilterState): Promise<Buffer>;
  
  // Generate Excel report
  async generateExcelReport(data: RevenueData, filters: FilterState): Promise<Buffer>;
  
  // Save export file temporarily
  async saveExportFile(buffer: Buffer, format: string): Promise<string>;
}
```

## Data Models

### Existing Models (Used for Aggregation)

#### 1. Transport Model
```typescript
interface Transport {
  _id: ObjectId;
  date: Date;
  transportMilk: number;
  transportAmount: number;
  cowMilkTransported: number;
  buffaloMilkTransported: number;
  status: 'pending' | 'transported' | 'completed';
  completionDetails?: {
    totalAmount: number;
    cow: { quantity: number; fat: number; rate: number; amount: number };
    buffalo: { quantity: number; fat: number; rate: number; amount: number };
  };
}
```

#### 2. EmployeePayment Model
```typescript
interface EmployeePayment {
  _id: ObjectId;
  employee: ObjectId;
  employeeName: string;
  paymentDate: Date;
  netSalary: number;
  status: 'pending' | 'completed' | 'cancelled';
  billingPeriod: {
    month: number;
    year: number;
  };
}
```

#### 3. FarmerPayment Model
```typescript
interface FarmerPayment {
  _id: ObjectId;
  farmer: ObjectId;
  farmerName: string;
  amount: number;
  cowMilkAmount: number;
  buffaloMilkAmount: number;
  paymentType: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';
  paymentDate: Date;
  status: 'pending' | 'completed' | 'cancelled';
}
```

#### 4. Delivery Model (Buyer Payments)
```typescript
interface Delivery {
  _id: ObjectId;
  buyer: ObjectId;
  totalAmount: number;
  paymentCompleted: boolean;
  paymentDate?: Date;
  paymentMethod: 'cod' | 'upi' | 'card';
  status: 'Pending' | 'Approved' | 'Out for Delivery' | 'Completed';
  createdAt: Date;
}
```

#### 5. OtherExpense Model (To be created)
```typescript
interface OtherExpense {
  _id: ObjectId;
  description: string;
  category: 'utilities' | 'maintenance' | 'supplies' | 'transport' | 'equipment' | 'other';
  vendor: string;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  invoiceNumber: string;
  notes?: string;
  createdAt: Date;
}
```

#### 6. FeedSale Model (Feed Sales to Farmers)
```typescript
interface FeedSale {
  _id: ObjectId;
  farmer: ObjectId;
  farmerName: string;
  feedType: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  saleDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'credit' | 'other';
  paymentStatus: 'pending' | 'completed' | 'partial';
  notes?: string;
  createdAt: Date;
}
```

#### 7. FeedPurchase Model (Feed Stock Purchases by Employees)
```typescript
interface FeedPurchase {
  _id: ObjectId;
  employee: ObjectId;
  employeeName: string;
  vendor: string;
  feedType: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  purchaseDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';
  paymentStatus: 'pending' | 'completed';
  invoiceNumber?: string;
  notes?: string;
  createdAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

- Properties 1.1-1.5 (data fetching from different sources) can be combined into one comprehensive property about data aggregation
- Properties 2.4-2.6 (color coding for profit/loss) can be combined into one property about conditional styling
- Properties 3.1, 3.2, 3.3, and 3.4 are all testing date filtering and can be combined
- Properties 4.1-4.8 (displaying various summary cards) should be combined into one property
- Properties 7.3-7.4 (comparison display styling) can be combined

### Core Correctness Properties

**Property 1: Data Aggregation Completeness**
*For any* time period, the revenue analytics data should include totals from all seven data sources: transported milk, employee salaries, farmer payments, buyer payments, other expenses, feed sales to farmers, and feed stock purchases, with each source contributing its correct sum to the overall totals.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

**Property 2: Net Collected Calculation**
*For any* transported milk amount T, buyer payments amount B, and feed sales amount F, the net collected amount should equal T + B + F.
**Validates: Requirements 2.1**

**Property 3: Net Paid Calculation**
*For any* farmer payments F, employee salaries E, other expenses O, and feed purchases P, the net paid amount should equal F + E + O + P.
**Validates: Requirements 2.2**

**Property 4: Profit/Loss Calculation**
*For any* net collected amount C and net paid amount P, the profit/loss should equal C - P.
**Validates: Requirements 2.3**

**Property 5: Feed Profit/Loss Calculation**
*For any* feed sales amount S and feed purchases amount P, the feed profit/loss should equal S - P.
**Validates: Requirements 2.4**

**Property 6: Profit/Loss Color Coding**
*For any* profit/loss value, the display color should be green when positive, red when negative, and neutral when zero.
**Validates: Requirements 2.5, 2.6, 2.7**

**Property 7: Date Range Filtering**
*For any* valid date range (start date, end date) where start ≤ end, all returned financial records should have dates within that range (inclusive).
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 8: Invalid Date Range Rejection**
*For any* date range where end date is before start date, the system should reject the filter and display an error message without executing the query.
**Validates: Requirements 3.6**

**Property 9: Summary Cards Completeness**
*For any* revenue analytics page load, the system should display all eleven required summary cards: Transported Milk, Employee Salaries, Farmer Payments, Buyer Payments, Other Expenses, Feed Sales to Farmers, Feed Stock Purchases, Net Collected, Net Paid, Feed Profit/Loss, and Overall Profit/Loss.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11**

**Property 10: Currency Formatting**
*For any* currency value displayed in summary cards or tables, the formatted string should include the currency symbol (₹) and exactly two decimal places.
**Validates: Requirements 4.12**

**Property 11: Chart Data Point Color Coding**
*For any* data point in the trend chart, the color should be green if profit/loss is positive and red if profit/loss is negative.
**Validates: Requirements 5.2**

**Property 12: Breakdown Table Field Completeness**
*For any* transaction record displayed in a breakdown table, the row should include all required fields: date, description, amount, and payment method (if applicable).
**Validates: Requirements 6.8**

**Property 13: Pagination Consistency**
*For any* breakdown table with more than the page size limit of records, the total number of records across all pages should equal the total count, and no record should appear on multiple pages.
**Validates: Requirements 6.9**

**Property 14: Previous Period Calculation**
*For any* current period date range, the previous equivalent period should have the same duration and end exactly one period length before the current period starts.
**Validates: Requirements 7.1**

**Property 15: Percentage Change Calculation**
*For any* current value C and previous value P where P ≠ 0, the percentage change should equal ((C - P) / P) × 100.
**Validates: Requirements 7.2**

**Property 16: Comparison Display Styling**
*For any* percentage change value, the display should include an upward arrow and green color when positive, or a downward arrow and red color when negative.
**Validates: Requirements 7.3, 7.4**

**Property 17: Export Metadata Inclusion**
*For any* generated export (PDF or Excel), the file should include both the selected filter criteria and the generation timestamp in the report header.
**Validates: Requirements 8.3, 8.4**

**Property 18: Access Control**
*For any* user attempting to access /admin/revenue-analytics, access should be granted only if the user has admin role, otherwise they should be redirected to an unauthorized page.
**Validates: Requirements 9.3**

**Property 19: Filter Change Data Refresh**
*For any* filter change, the system should trigger a new data fetch and update all displayed components (summary cards, calculations, charts, tables) with the new data.
**Validates: Requirements 10.1, 10.3**

**Property 20: Loading State Display**
*For any* data fetch operation in progress, the system should display loading indicators on all components that will be updated with the fetched data.
**Validates: Requirements 10.2**

**Property 21: Error Handling with Data Retention**
*For any* data fetch that fails, the system should display an error message and retain the previously displayed data without clearing the UI.
**Validates: Requirements 10.4**

**Property 22: Request Debouncing**
*For any* sequence of N filter changes occurring within a debounce window (e.g., 500ms), the system should make fewer than N API requests, ideally only one request after the last change.
**Validates: Requirements 10.5**

**Property 23: Graceful Error Handling**
*For any* data source that fails to load or is unavailable, the system should display zero for that category's total and continue displaying data from other available sources.
**Validates: Requirements 1.8**

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Display user-friendly error messages when API calls fail
2. **Invalid Filter Input**: Validate date ranges before sending requests
3. **Empty Data States**: Show appropriate messages when no data is available
4. **Export Failures**: Notify users if export generation fails
5. **Loading States**: Show loading indicators during data fetches

### Backend Error Handling

1. **Database Connection Errors**: Return graceful error responses with appropriate HTTP status codes
2. **Invalid Query Parameters**: Validate and sanitize all input parameters
3. **Data Aggregation Errors**: Handle missing or corrupted data gracefully
4. **Export Generation Errors**: Catch and log errors during PDF/Excel generation
5. **Authentication Errors**: Verify admin role before allowing access

## Testing Strategy

### Unit Testing

Unit tests should focus on:
- Individual calculation functions (net collected, net paid, profit/loss)
- Date range validation logic
- Currency formatting functions
- Percentage change calculations
- Filter state management
- Error handling for specific edge cases

### Property-Based Testing

Property-based tests should verify the correctness properties defined above. Each property test should:
- Run a minimum of 100 iterations with randomized inputs
- Tag tests with the format: **Feature: admin-revenue-analytics, Property {number}: {property_text}**
- Use a property-based testing library appropriate for the language (e.g., fast-check for JavaScript/TypeScript)

**Example Property Test Structure**:
```javascript
// Feature: admin-revenue-analytics, Property 2: Net Collected Calculation
test('Property 2: Net collected equals transported milk + buyer payments', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 1000000 }), // transported milk amount
      fc.float({ min: 0, max: 1000000 }), // buyer payments amount
      (transportAmount, buyerPayments) => {
        const netCollected = calculateNetCollected(transportAmount, buyerPayments);
        return Math.abs(netCollected - (transportAmount + buyerPayments)) < 0.01;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests should verify:
- API endpoint responses with real database queries
- Data aggregation across multiple collections
- Filter application and query building
- Export generation with actual data
- Authentication and authorization flows

### End-to-End Testing

E2E tests should verify:
- Complete user workflows (load page → apply filters → view data → export)
- UI component rendering and interactions
- Navigation between pages
- Real-time data updates

## Implementation Notes

### Technology Stack

**Frontend**:
- React 18+ with functional components and hooks
- Tailwind CSS for styling
- Recharts or Chart.js for trend visualization
- jsPDF for PDF generation
- xlsx library for Excel generation
- Axios for API calls

**Backend**:
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- Express middleware for authorization

### Performance Considerations

1. **Database Indexing**: Ensure all date fields used in queries are indexed
2. **Aggregation Pipeline**: Use MongoDB aggregation pipelines for efficient data summarization
3. **Caching**: Consider caching frequently accessed data (e.g., current day's summary)
4. **Pagination**: Implement cursor-based pagination for large datasets
5. **Debouncing**: Debounce filter changes to reduce API calls (500ms delay)

### Security Considerations

1. **Authentication**: Verify JWT token on all API requests
2. **Authorization**: Check admin role before allowing access
3. **Input Validation**: Sanitize and validate all query parameters
4. **Rate Limiting**: Implement rate limiting on export endpoints
5. **SQL Injection Prevention**: Use parameterized queries (Mongoose handles this)

### Accessibility

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Screen Reader Support**: Add appropriate ARIA labels to charts and tables
3. **Color Contrast**: Ensure sufficient contrast for profit/loss color coding
4. **Focus Indicators**: Provide clear focus indicators for all interactive elements

### Responsive Design

1. **Mobile Layout**: Stack summary cards vertically on small screens
2. **Table Scrolling**: Make breakdown tables horizontally scrollable on mobile
3. **Chart Responsiveness**: Ensure charts resize appropriately
4. **Touch Targets**: Ensure buttons and controls are large enough for touch interaction
