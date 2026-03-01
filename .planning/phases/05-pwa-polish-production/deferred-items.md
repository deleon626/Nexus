# Deferred Items - Phase 05 Plan 02

Pre-existing TypeScript build errors discovered during execution. These are out of scope for this plan and should be addressed in future plans.

## Build Errors (Out of Scope)

### formFilling Module
- `src/features/formFilling/hooks/useVoiceInput.ts(214,41)`: Property 'api' does not exist on type 'ConvexReactClient'
- `src/features/formFilling/pages/FormFillingPage.tsx`: Unused imports, FormDataRecord not exported
- `src/features/formFilling/components/fields/voiceinputbutton.tsx`: Type mismatches

### reviewWorkflow Module
- `src/features/reviewWorkflow/components/ReviewDialog.tsx`: Property 'status' does not exist on ReactMutation
- `src/features/reviewWorkflow/components/WorkerStatusList.tsx`: Type 'string' not assignable to type 'SubmissionStatus'

### PWA Module (Other Plans)
- `src/features/pwa/hooks/useStorageMonitor.ts`: Cannot find module '../../constants'
- `src/features/pwa/utils/storageCleanup.ts`: Cannot find name 'cleanupExpiredDrafts'

### Routes
- `src/routes/admin/builder.tsx`: Unused variable, Property 'user' does not exist on type 'AuthState'
- `src/routes/reviewer/dashboard.tsx`: Module declares 'Submission' locally but not exported
- `src/routes/protected.tsx`: Unused destructured elements

### formBuilder Module
- Multiple unused variable warnings (TS6133)
- Type compatibility issues with field components

## Notes

These errors were present before Phase 05 Plan 02 execution and are not related to the ReloadPrompt component. Per deviation rules, only issues directly caused by current task changes should be fixed. These should be addressed in their respective phases/plans.
