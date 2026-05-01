# Implementation Plan: Dairy Session Time Display Fix

## Overview

This implementation plan addresses the critical bug in the DairyTimeStatus component where session detection fails to correctly identify active sessions. The fix focuses on ensuring robust timezone handling, accurate time comparisons, proper data validation, and comprehensive testing to prevent regression.

The implementation will be done incrementally, with each task building on the previous one, and includes both unit tests and property-based tests to ensure correctness.

## Tasks

- [x] 1. Enhance time utility functions with validation and error handling
  - Improve `timeToMinutes()` function with explicit validation for edge cases
  - Add `validateTimeFormat()` helper function for time string validation
  - Add `validateSession()` helper function for session configuration validation
  - Ensure `getCurrentISTTime()` handles timezone conversion consistently
  - Add detailed error logging for debugging
  - _Requirements: 4.1, 4.4, 5.3, 8.2, 8.5_

- [ ]* 1.1 Write property test for time format validation
  - **Property 11: Invalid Time Format Handling**
  - **Validates: Requirements 8.2, 8.5**

- [ ]* 1.2 Write unit tests for time utility functions
  - Test `timeToMinutes()` with valid formats, invalid formats, edge cases (00:00, 23:59)
  - Test `validateTimeFormat()` with various valid and invalid inputs
  - Test `validateSession()` with valid and invalid session configurations
  - Test `getCurrentISTTime()` returns IST time, not local time
  - _Requirements: 4.1, 4.4, 8.5_

- [x] 2. Fix session detection logic in getCurrentDairyStatus()
  - Add validation for dairyInfo existence at the start
  - Validate all session times before using them in calculations
  - Fix boundary condition: use `currentMinutes < closeMinutes` instead of `<=`
  - Add session validity checks before determining if time is in range
  - Ensure consistent use of IST time throughout the function
  - Add detailed logging for each decision point
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

- [ ]* 2.1 Write property test for session status detection
  - **Property 1: Session Status Detection**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 2.2 Write property test for session validation
  - **Property 7: Session Validation**
  - **Validates: Requirements 5.3, 7.5**

- [ ]* 2.3 Write unit tests for session detection
  - Test morning session active: 8:00 AM with session 6:00-10:00
  - Test evening session active: 7:00 PM with session 5:00-9:00
  - Test closed before morning: 5:00 AM with session 6:00-10:00
  - Test closed between sessions: 2:00 PM
  - Test closed after evening: 11:00 PM
  - Test invalid session times: open >= close
  - Test boundary conditions: exactly at open time, exactly at close time
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

- [ ] 3. Checkpoint - Ensure session detection tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement countdown calculation improvements
  - Ensure countdown calculation uses validated session times only
  - Fix calculation for same-day vs next-day sessions
  - Add seconds to countdown display for real-time updates
  - Implement urgent flag logic for < 15 minutes remaining
  - Ensure countdown format matches "Xh Ym Zs" pattern
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 7.4_

- [ ]* 4.1 Write property test for countdown calculation accuracy
  - **Property 3: Countdown Calculation Accuracy**
  - **Validates: Requirements 3.1, 3.2, 7.4**

- [ ]* 4.2 Write property test for urgent warning threshold
  - **Property 4: Urgent Warning Threshold**
  - **Validates: Requirements 3.4**

- [ ]* 4.3 Write property test for countdown format
  - **Property 5: Countdown Format**
  - **Validates: Requirements 3.5**

- [ ]* 4.4 Write unit tests for countdown calculations
  - Test countdown to close: 9:45 AM in session 6:00-10:00 → "15m"
  - Test countdown to next open: 11:00 AM with evening at 5:00 PM → "6h 0m"
  - Test urgent warning: < 15 minutes remaining
  - Test tomorrow calculation: After evening session
  - Test countdown format for various time differences
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 7.4_

- [ ] 5. Implement next session determination logic
  - Fix logic to determine next session based on current time
  - Handle case: before morning session → next is morning (today)
  - Handle case: between sessions → next is evening (today)
  - Handle case: after evening session → next is morning (tomorrow)
  - Skip invalid sessions when determining next session
  - Add proper "Tomorrow" label for next-day sessions
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ]* 5.1 Write property test for next session determination
  - **Property 10: Next Session Determination**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ]* 5.2 Write unit tests for next session logic
  - Test next session before morning: 5:00 AM → morning (today)
  - Test next session between sessions: 2:00 PM → evening (today)
  - Test next session after evening: 11:00 PM → morning (tomorrow)
  - Test skipping invalid sessions
  - Test "Tomorrow" label appears correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 6. Checkpoint - Ensure countdown and next session tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement time format conversion and display
  - Ensure `formatTime12Hour()` correctly converts 24-hour to 12-hour format
  - Handle noon (12:00) and midnight (00:00) edge cases
  - Display both morning and evening session hours in UI
  - Show current IST time for user verification
  - _Requirements: 2.1, 2.2, 2.3, 4.3_

- [ ]* 7.1 Write property test for time format conversion
  - **Property 2: Time Format Conversion**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 7.2 Write unit tests for time formatting
  - Test AM/PM conversion for various times
  - Test noon: "12:00" → "12:00 PM"
  - Test midnight: "00:00" → "12:00 AM"
  - Test morning: "06:30" → "6:30 AM"
  - Test evening: "18:30" → "6:30 PM"
  - _Requirements: 2.1, 2.2_

- [ ] 8. Implement visual indicators and status mapping
  - Ensure correct emoji display: "🟢" for open, "🔴" for closed
  - Implement color mapping: green for open, red for closed, orange for urgent
  - Add background color classes based on status
  - Implement pulse animation for urgent state (< 15 minutes)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 8.1 Write property test for status-to-visual mapping
  - **Property 8: Status-to-Visual Mapping**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ]* 8.2 Write property test for background color mapping
  - **Property 9: Background Color Mapping**
  - **Validates: Requirements 6.5**

- [ ]* 8.3 Write unit tests for visual indicators
  - Test green indicator for open morning session
  - Test green indicator for open evening session
  - Test red indicator for closed status
  - Test orange background for urgent state
  - Test pulse animation class applied when urgent
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Implement error handling and edge cases
  - Handle null dairyInfo: display "Dairy time not set" message
  - Handle invalid session times: skip invalid sessions
  - Handle both sessions invalid: display "Dairy Times Not Configured"
  - Handle API fetch failure: keep loading state, log error
  - Handle invalid current time: display "Invalid current time" message
  - Add structured error logging for all error cases
  - _Requirements: 2.4, 5.4, 8.1, 8.3, 8.4_

- [ ]* 9.1 Write unit tests for error handling
  - Test null dairyInfo displays correct message
  - Test invalid session times are skipped
  - Test both sessions invalid displays correct message
  - Test API failure handling
  - Test invalid current time handling
  - Test error logging format
  - _Requirements: 2.4, 5.4, 8.1, 8.3, 8.4_

- [ ] 10. Implement timezone consistency improvements
  - Ensure all time comparisons use IST from `getCurrentISTTime()`
  - Remove any direct `new Date()` calls that don't convert to IST
  - Add timezone conversion tests to verify no off-by-hour errors
  - Display current IST time in UI for user verification
  - _Requirements: 4.1, 4.2, 4.4_

- [ ]* 10.1 Write property test for timezone conversion consistency
  - **Property 6: Timezone Conversion Consistency**
  - **Validates: Requirements 4.4**

- [ ]* 10.2 Write unit tests for timezone handling
  - Test `getCurrentISTTime()` returns IST, not local time
  - Test time comparisons use IST consistently
  - Test no off-by-hour errors in calculations
  - Test IST time display in UI
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration testing and manual verification
  - [ ] 12.1 Test component mounts and fetches dairy info correctly
    - Verify API call is made on mount
    - Verify loading state is displayed during fetch
    - Verify dairy info is stored in state after fetch
    - _Requirements: 2.5_
  
  - [ ] 12.2 Test timer updates every second
    - Verify currentTime state updates every second
    - Verify countdown display updates in real-time
    - Verify status changes when crossing session boundary
    - _Requirements: 1.5, 3.3_
  
  - [ ] 12.3 Test UI renders correctly for all states
    - Verify correct colors and emojis for each status
    - Verify operating hours display correctly
    - Verify countdown displays and updates
    - Verify current IST time is shown
    - _Requirements: 2.3, 4.3, 6.1, 6.2, 6.3, 6.5_
  
  - [ ] 12.4 Manual testing with different times
    - Test during morning session hours
    - Test during evening session hours
    - Test between sessions
    - Test before morning session
    - Test after evening session
    - Verify countdown accuracy by waiting and observing
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_

- [ ] 13. Final checkpoint - Verify bug is fixed
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the original bug (showing "Closed" incorrectly) is fixed
  - Verify session detection works correctly at all times of day
  - Verify countdown timers are accurate and update in real-time

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify the component works correctly in the React environment
- The implementation focuses on fixing the core bug while maintaining backward compatibility
- All time calculations must use IST timezone consistently
- Validation should happen before any calculations to prevent errors
- Error messages should be clear and actionable for users and administrators
