# Requirements Document

## Introduction

This specification outlines the removal of two specific functionalities from the admin module of the dairy management system:
1. The date-wise rate application functionality that allows applying milk rates across a date range
2. The mixed milk rate feature in the selling rate chart that allows setting rates for mixed (cow + buffalo) milk

Both features need to be completely removed from frontend and backend components.

## Glossary

- **Admin_Module**: The administrative interface for managing dairy operations
- **Datewise_Rate_Apply**: The functionality that allows applying milk rates to multiple dates in a range
- **Mixed_Milk_Rate**: The selling rate feature for mixed milk (combination of cow and buffalo milk)
- **Selling_Rate_Chart**: The interface for setting online buyer rates for different milk types
- **Rate_Chart**: Individual rate configurations for cow and buffalo milk
- **API_Endpoint**: Backend service endpoints for handling rate operations

## Requirements

### Requirement 1: Remove Frontend Date-wise Rate Interface

**User Story:** As a system maintainer, I want to remove the date-wise rate application interface from the admin module, so that administrators cannot access this functionality.

#### Acceptance Criteria

1. WHEN an administrator views the milk rate chart page, THE System SHALL NOT display the "Datewise Rate Apply" section
2. WHEN an administrator interacts with the rate chart interface, THE System SHALL NOT provide any date range selection controls for applying rates
3. WHEN the rate chart page loads, THE System SHALL NOT initialize any date range state variables
4. THE System SHALL remove all UI components related to date range selection (from/to date inputs)
5. THE System SHALL remove the "Datewise Rate Apply" button and its associated functionality

### Requirement 2: Remove Backend Date-wise Rate API

**User Story:** As a system maintainer, I want to remove the backend API endpoint for date-wise rate application, so that this functionality cannot be accessed programmatically.

#### Acceptance Criteria

1. WHEN a request is made to the apply-datewise-rates endpoint, THE System SHALL return a 404 Not Found error
2. THE System SHALL remove the applyDatewiseRates controller function from the admin controller
3. THE System SHALL remove the POST /apply-datewise-rates route from the admin routes
4. THE System SHALL remove all imports and references to the applyDatewiseRates function

### Requirement 3: Clean Up Related Code and State

**User Story:** As a system maintainer, I want to remove all code related to date-wise rate functionality, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. THE System SHALL remove all state variables related to date range management (dateRange state)
2. THE System SHALL remove all event handlers for date range inputs
3. THE System SHALL remove all validation logic specific to date range operations
4. THE System SHALL remove any error handling specific to date-wise rate application
5. THE System SHALL remove any success messages related to date-wise rate operations

### Requirement 4: Preserve Core Rate Chart Functionality

**User Story:** As an administrator, I want to continue using the core rate chart functionality for creating and managing individual rate charts, so that I can still manage milk rates effectively.

#### Acceptance Criteria

1. WHEN an administrator creates a rate chart, THE System SHALL continue to save cow and buffalo rates normally
2. WHEN an administrator loads a saved rate chart, THE System SHALL continue to populate the rate tables correctly
3. WHEN an administrator uses the auto-fill range functionality, THE System SHALL continue to generate rates based on parameters
4. THE System SHALL preserve all existing rate chart CRUD operations (Create, Read, Update, Delete)
5. THE System SHALL maintain the ability to save rate charts with names and dates

### Requirement 5: Update User Interface Layout

**User Story:** As an administrator, I want the rate chart interface to have a clean layout without the removed date-wise functionality, so that the interface remains user-friendly.

#### Acceptance Criteria

1. WHEN the date-wise rate section is removed, THE System SHALL adjust the grid layout to use available space efficiently
2. THE System SHALL ensure the remaining sections (saved rate charts) expand to fill the available space
3. THE System SHALL maintain proper spacing and visual hierarchy in the updated layout
4. THE System SHALL ensure no broken UI elements or empty spaces remain after removal

### Requirement 7: Remove Mixed Milk Rate from Selling Rate Chart

**User Story:** As a system maintainer, I want to remove the mixed milk rate functionality from the selling rate chart, so that only cow and buffalo milk rates are available for online buyers.

#### Acceptance Criteria

1. WHEN an administrator views the selling rate chart page, THE System SHALL NOT display any mixed milk rate section
2. WHEN an administrator sets selling rates, THE System SHALL only allow cow milk and buffalo milk rate configuration
3. THE System SHALL remove all UI components related to mixed milk rate (input fields, display cards, editing controls)
4. THE System SHALL remove mixed milk from the rate validation logic
5. THE System SHALL remove mixed milk from the "Save All Rates" functionality

### Requirement 8: Remove Mixed Milk from Backend Selling Rate API

**User Story:** As a system maintainer, I want to remove mixed milk support from the backend selling rate API, so that the system only handles cow and buffalo milk rates.

#### Acceptance Criteria

1. WHEN selling rates are saved, THE System SHALL only accept and store cow milk and buffalo milk rates
2. WHEN selling rates are retrieved, THE System SHALL only return cow milk and buffalo milk rates
3. THE System SHALL remove mixedMilk from all API request/response structures
4. THE System SHALL update validation logic to only check cow and buffalo milk rates
5. THE System SHALL remove mixed milk from rate history tracking

### Requirement 9: Update Selling Rate Data Model

**User Story:** As a system maintainer, I want to update the selling rate data model to exclude mixed milk, so that the database schema is clean and consistent.

#### Acceptance Criteria

1. THE System SHALL remove mixedMilk fields from the selling rate data structure
2. THE System SHALL update default selling rate initialization to only include cow and buffalo milk
3. THE System SHALL remove mixed milk from rate history records
4. THE System SHALL update any database queries that reference mixed milk rates
5. THE System SHALL ensure existing mixed milk data is ignored during rate operations

### Requirement 10: Update Selling Rate UI Layout

**User Story:** As an administrator, I want the selling rate interface to display only cow and buffalo milk options in a clean two-column layout, so that the interface is simplified and user-friendly.

#### Acceptance Criteria

1. WHEN the mixed milk section is removed, THE System SHALL adjust the grid layout from 3 columns to 2 columns
2. THE System SHALL ensure cow and buffalo milk sections are properly spaced and aligned
3. THE System SHALL update the "Active Rates" section to only show cow and buffalo milk cards
4. THE System SHALL update rate history display to only show cow and buffalo milk rates
5. THE System SHALL maintain responsive design for the updated 2-column layout

### Requirement 6: Remove Associated Documentation and Comments

**User Story:** As a system maintainer, I want to remove all documentation and comments related to both date-wise rate and mixed milk functionality, so that the code documentation remains accurate.

#### Acceptance Criteria

1. THE System SHALL remove all code comments referencing date-wise rate application
2. THE System SHALL remove all code comments referencing mixed milk rates
3. THE System SHALL remove any JSDoc or inline documentation for removed functions
4. THE System SHALL update any workflow instructions that mentioned removed functionalities
5. THE System SHALL ensure no misleading comments remain in the codebase