# Requirements Document

## Introduction

Fix the dairy information API access issue where the `useDairyInfo` hook is incorrectly trying to access the admin-protected dairy info endpoint instead of the public endpoint, causing 403 Forbidden errors for non-admin users.

## Glossary

- **useDairyInfo Hook**: React hook that provides dairy information context to components
- **Public API**: API endpoints accessible without authentication
- **Admin API**: API endpoints that require admin authentication
- **DairyTimeStatus Component**: Component that displays dairy operating hours and status
- **API Consistency**: Ensuring all components use the appropriate API endpoints

## Requirements

### Requirement 1: Fix API Endpoint Access

**User Story:** As a user (farmer, buyer, employee), I want to see dairy information without authentication errors, so that the dairy time status and other dairy info displays work properly.

#### Acceptance Criteria

1. WHEN the useDairyInfo hook fetches dairy information, THE System SHALL use the public API endpoint `/api/public/dairy-info`
2. WHEN a non-admin user accesses pages with dairy information, THE System SHALL NOT return 403 Forbidden errors
3. WHEN the dairy information is fetched, THE System SHALL handle both successful responses and null data gracefully
4. WHEN the public API is called, THE System SHALL return the same data structure as the admin API

### Requirement 2: Maintain API Consistency

**User Story:** As a developer, I want consistent API usage across components, so that dairy information access is reliable and predictable.

#### Acceptance Criteria

1. WHEN components need dairy information for display purposes, THE System SHALL use the public API endpoint
2. WHEN components need dairy information for administrative purposes, THE System SHALL use the admin API endpoint
3. WHEN the DairyTimeStatus component fetches data, THE System SHALL continue using the public endpoint (already correct)
4. WHEN the useDairyInfo hook is used, THE System SHALL provide the same interface regardless of the underlying API endpoint

### Requirement 3: Error Handling and User Experience

**User Story:** As a user, I want dairy information to load without errors, so that I can see operating hours and dairy details properly.

#### Acceptance Criteria

1. WHEN the dairy info API call fails, THE System SHALL handle the error gracefully without breaking the UI
2. WHEN no dairy information exists, THE System SHALL display appropriate fallback content
3. WHEN the API returns successfully, THE System SHALL update all dependent components with the new data
4. WHEN the page loads, THE System SHALL not show 403 Forbidden errors in the browser console

### Requirement 4: Backward Compatibility

**User Story:** As a developer, I want the fix to maintain existing functionality, so that no existing features are broken.

#### Acceptance Criteria

1. WHEN the useDairyInfo hook is updated, THE System SHALL maintain the same public interface
2. WHEN components use the useDairyInfo hook, THE System SHALL continue to provide the same data structure
3. WHEN the dairy information is refreshed, THE System SHALL continue to work with the existing refresh mechanism
4. WHEN admin users access dairy info, THE System SHALL continue to work for administrative functions