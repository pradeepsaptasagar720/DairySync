# Requirements Document

## Introduction

This specification addresses the dairy session time display issue in the farmer dashboard where the status incorrectly shows "Closed" regardless of the current time, and does not properly detect and display the active session (morning or evening) based on the actual time of day.

The system currently has a DairyTimeStatus component that fetches dairy operating hours from the backend and should display real-time session status with countdown timers. However, the time-based session detection logic is not working correctly, leading to incorrect status displays and confusing timing information.

## Glossary

- **DairyTimeStatus**: React component that displays the current dairy session status and operating hours
- **Session**: A time period when the dairy is open for milk collection (morning or evening)
- **IST**: Indian Standard Time (Asia/Kolkata timezone)
- **DairyInfo**: MongoDB model storing dairy operating hours and configuration
- **Session_Detection**: Logic that determines which session is currently active based on current time
- **Countdown_Timer**: Real-time display showing time remaining until session closes or opens

## Requirements

### Requirement 1: Accurate Session Detection

**User Story:** As a farmer, I want to see the correct dairy session status based on the current time, so that I know when I can deliver milk.

#### Acceptance Criteria

1. WHEN the current time is within morning session hours (morningOpenTime to morningCloseTime), THE DairyTimeStatus SHALL display "Morning Session Open"
2. WHEN the current time is within evening session hours (eveningOpenTime to eveningCloseTime), THE DairyTimeStatus SHALL display "Evening Session Open"
3. WHEN the current time is outside both session hours, THE DairyTimeStatus SHALL display "Closed" status
4. THE Session_Detection SHALL use IST timezone for all time comparisons
5. THE Session_Detection SHALL update automatically every second to reflect real-time status changes

### Requirement 2: Correct Operating Hours Display

**User Story:** As a farmer, I want to see the correct operating hours for both sessions, so that I can plan my milk delivery schedule.

#### Acceptance Criteria

1. WHEN dairy info is loaded, THE DairyTimeStatus SHALL display morning session hours in 12-hour format with AM/PM
2. WHEN dairy info is loaded, THE DairyTimeStatus SHALL display evening session hours in 12-hour format with AM/PM
3. THE DairyTimeStatus SHALL show both morning and evening sessions simultaneously
4. WHEN session times are not configured in the database, THE DairyTimeStatus SHALL display a clear message indicating times need to be set
5. THE DairyTimeStatus SHALL use the morningOpenTime, morningCloseTime, eveningOpenTime, and eveningCloseTime fields from DairyInfo model

### Requirement 3: Real-Time Countdown Display

**User Story:** As a farmer, I want to see how much time is left until the session closes or opens, so that I can manage my time effectively.

#### Acceptance Criteria

1. WHEN a session is currently open, THE Countdown_Timer SHALL display time remaining until that session closes
2. WHEN the dairy is closed, THE Countdown_Timer SHALL display time remaining until the next session opens
3. THE Countdown_Timer SHALL update every second to show accurate real-time countdown
4. WHEN less than 15 minutes remain in an open session, THE Countdown_Timer SHALL display an urgent warning with visual emphasis
5. THE Countdown_Timer SHALL display time in format "Xh Ym Zs" for hours, minutes, and seconds

### Requirement 4: Timezone Handling

**User Story:** As a system administrator, I want all time calculations to use IST consistently, so that the dairy status is accurate for users in India.

#### Acceptance Criteria

1. THE Session_Detection SHALL convert current time to IST using "Asia/Kolkata" timezone
2. THE Session_Detection SHALL compare IST time against session hours stored in 24-hour format
3. THE DairyTimeStatus SHALL display current IST time to users for verification
4. WHEN performing time calculations, THE Session_Detection SHALL handle timezone conversions correctly to avoid off-by-hours errors
5. THE Session_Detection SHALL update IST time every second for real-time accuracy

### Requirement 5: Session Boundary Handling

**User Story:** As a farmer, I want the system to correctly handle session boundaries, so that I know exactly when sessions start and end.

#### Acceptance Criteria

1. WHEN current time equals session open time, THE Session_Detection SHALL mark the session as open
2. WHEN current time equals session close time, THE Session_Detection SHALL mark the session as closed
3. THE Session_Detection SHALL validate that open time is before close time for each session
4. WHEN session times are invalid (open >= close), THE Session_Detection SHALL display an error message
5. THE Session_Detection SHALL handle midnight boundary correctly for sessions that span across days

### Requirement 6: Visual Status Indicators

**User Story:** As a farmer, I want clear visual indicators of the dairy status, so that I can quickly understand if the dairy is open or closed.

#### Acceptance Criteria

1. WHEN morning session is open, THE DairyTimeStatus SHALL display a green indicator with "🟢" emoji
2. WHEN evening session is open, THE DairyTimeStatus SHALL display a green indicator with "🟢" emoji
3. WHEN dairy is closed, THE DairyTimeStatus SHALL display a red indicator with "🔴" emoji
4. WHEN less than 15 minutes remain in a session, THE DairyTimeStatus SHALL display an animated pulse effect
5. THE DairyTimeStatus SHALL use distinct background colors for open (green), closed (red), and urgent (orange) states

### Requirement 7: Next Session Calculation

**User Story:** As a farmer, I want to know when the next session opens when the dairy is closed, so that I can plan my next delivery.

#### Acceptance Criteria

1. WHEN current time is before morning session, THE DairyTimeStatus SHALL show countdown to morning session opening
2. WHEN current time is between morning and evening sessions, THE DairyTimeStatus SHALL show countdown to evening session opening
3. WHEN current time is after evening session, THE DairyTimeStatus SHALL show countdown to next day's morning session with "Tomorrow" label
4. THE DairyTimeStatus SHALL calculate countdown time accurately accounting for same-day vs next-day sessions
5. WHEN calculating next session, THE Session_Detection SHALL skip invalid sessions (where open time >= close time)

### Requirement 8: Data Validation and Error Handling

**User Story:** As a system administrator, I want the system to handle invalid or missing dairy time data gracefully, so that users see helpful error messages instead of crashes.

#### Acceptance Criteria

1. WHEN dairy info is not found in database, THE DairyTimeStatus SHALL display "Dairy time not set" message
2. WHEN session times are invalid format, THE Session_Detection SHALL treat them as null and skip that session
3. WHEN both sessions are invalid, THE DairyTimeStatus SHALL display "Dairy Times Not Configured" message
4. WHEN API call fails, THE DairyTimeStatus SHALL display loading state and log error to console
5. THE Session_Detection SHALL validate time format as "HH:MM" with hours 0-23 and minutes 0-59
