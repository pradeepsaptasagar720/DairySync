# Requirements Document

## Introduction

Enhancement to the existing Advanced Rate Chart system to provide automatic row population based on range parameters. When users input start fat, end fat, base rate, and difference amount, the system should automatically calculate and fill all rows in both cow and buffalo milk rate tables.

## Glossary

- **Rate_Chart_System**: The existing advanced milk rate chart management interface
- **Auto_Fill_Engine**: The calculation engine that populates rows automatically
- **Fat_Range**: The percentage range from start fat to end fat
- **Rate_Progression**: The incremental rate calculation based on fat percentage increases
- **Row_Population**: The process of filling table rows with calculated values

## Requirements

### Requirement 1: Auto-Fill Trigger System

**User Story:** As an admin, I want the system to automatically fill all rate chart rows when I complete the range parameters, so that I don't have to manually enter each row's values.

#### Acceptance Criteria

1. WHEN all range parameters (start fat, end fat, base rate, difference) are entered, THE Auto_Fill_Engine SHALL automatically trigger row population
2. WHEN the "Apply to Cow" button is clicked, THE Rate_Chart_System SHALL populate all cow milk rows with calculated values
3. WHEN the "Apply to Buffalo" button is clicked, THE Rate_Chart_System SHALL populate all buffalo milk rows with calculated values
4. WHEN range parameters are incomplete, THE Rate_Chart_System SHALL display validation messages and prevent auto-fill

### Requirement 2: Dynamic Row Generation

**User Story:** As an admin, I want the system to create the optimal number of rows based on my fat range, so that I get comprehensive rate coverage.

#### Acceptance Criteria

1. WHEN fat range is defined, THE Auto_Fill_Engine SHALL calculate the optimal number of rows based on 0.1% fat increments
2. WHEN existing rows are fewer than needed, THE Rate_Chart_System SHALL automatically add new rows
3. WHEN existing rows are more than needed, THE Rate_Chart_System SHALL use existing rows and leave extras empty
4. THE Rate_Chart_System SHALL maintain a minimum of 1 row and maximum of 50 rows per milk type

### Requirement 3: Progressive Rate Calculation

**User Story:** As an admin, I want rates to be calculated progressively based on fat percentage increases, so that pricing reflects milk quality accurately.

#### Acceptance Criteria

1. WHEN calculating cow milk rates, THE Auto_Fill_Engine SHALL use the base rate and increment by the difference amount for each 0.1% fat increase
2. WHEN calculating buffalo milk rates, THE Auto_Fill_Engine SHALL apply a 15 rupee premium to the base rate and use 2.5 rupee increments
3. WHEN fat percentages are calculated, THE Auto_Fill_Engine SHALL distribute them evenly across the available rows
4. THE Auto_Fill_Engine SHALL round all calculated values to appropriate decimal places (fat: 1 decimal, rate: 2 decimals)

### Requirement 4: SNF Auto-Assignment

**User Story:** As an admin, I want SNF values to be automatically assigned based on milk type standards, so that I don't need to manually set SNF for each row.

#### Acceptance Criteria

1. WHEN populating cow milk rows, THE Auto_Fill_Engine SHALL assign SNF values starting from 8.5% with 0.1% increments
2. WHEN populating buffalo milk rows, THE Auto_Fill_Engine SHALL assign SNF values starting from 9.0% with 0.1% increments
3. WHEN SNF start value is manually specified in range settings, THE Auto_Fill_Engine SHALL use that as the starting point
4. THE Auto_Fill_Engine SHALL ensure SNF values progress logically with fat percentages

### Requirement 5: Real-time Preview and Validation

**User Story:** As an admin, I want to see a preview of calculated values before applying them, so that I can verify the calculations are correct.

#### Acceptance Criteria

1. WHEN range parameters change, THE Rate_Chart_System SHALL show a preview of the first and last calculated values
2. WHEN validation errors occur, THE Rate_Chart_System SHALL display specific error messages with guidance
3. WHEN calculations are complete, THE Rate_Chart_System SHALL highlight the populated rows temporarily
4. THE Rate_Chart_System SHALL provide an undo option to revert auto-filled values

### Requirement 6: Batch Operations Support

**User Story:** As an admin, I want to apply the same range calculations to multiple rate charts, so that I can maintain consistency across different dates.

#### Acceptance Criteria

1. WHEN auto-fill is applied, THE Rate_Chart_System SHALL save the range parameters with the rate chart
2. WHEN loading a saved rate chart, THE Rate_Chart_System SHALL restore the range parameters for reuse
3. WHEN creating new rate charts, THE Rate_Chart_System SHALL offer to copy range parameters from the last used settings
4. THE Rate_Chart_System SHALL provide a "Apply Same Range" option for quick replication

### Requirement 7: Error Handling and Edge Cases

**User Story:** As an admin, I want the system to handle invalid inputs gracefully, so that I get clear feedback when something goes wrong.

#### Acceptance Criteria

1. WHEN start fat is greater than end fat, THE Rate_Chart_System SHALL display an error and prevent auto-fill
2. WHEN base rate is zero or negative, THE Rate_Chart_System SHALL display a validation error
3. WHEN difference amount would result in negative rates, THE Rate_Chart_System SHALL warn the user and suggest adjustments
4. WHEN network errors occur during auto-fill, THE Rate_Chart_System SHALL preserve user inputs and allow retry

### Requirement 8: Performance and User Experience

**User Story:** As an admin, I want the auto-fill process to be fast and responsive, so that I can work efficiently with large rate charts.

#### Acceptance Criteria

1. WHEN auto-fill is triggered, THE Rate_Chart_System SHALL complete calculations within 500 milliseconds
2. WHEN populating many rows, THE Rate_Chart_System SHALL show a progress indicator
3. WHEN calculations are in progress, THE Rate_Chart_System SHALL disable form inputs to prevent conflicts
4. THE Rate_Chart_System SHALL provide visual feedback (animations/highlights) when rows are populated