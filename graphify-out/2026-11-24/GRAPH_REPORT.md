# Graph Report - auth-core-console  (2026-11-24)

## Corpus Check
- 236 files · ~108,574 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1445 nodes · 4313 edges · 81 communities (72 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36753daf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_PortalTenantDetailPage.tsx|PortalTenantDetailPage.tsx]]
- [[_COMMUNITY_isExternalBackendConfigured|isExternalBackendConfigured]]
- [[_COMMUNITY_routeTree.gen.ts|routeTree.gen.ts]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_README|README.md]]
- [[_COMMUNITY_mock-db.ts|mock-db.ts]]
- [[_COMMUNITY_useAuthConfigStore.ts|useAuthConfigStore.ts]]
- [[_COMMUNITY_cn|cn]]
- [[_COMMUNITY_tenant-context.ts|tenant-context.ts]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_AuthView.tsx|AuthView.tsx]]
- [[_COMMUNITY_TenantAuthPages.tsx|TenantAuthPages.tsx]]
- [[_COMMUNITY_use-toast.ts|use-toast.ts]]
- [[_COMMUNITY_ThemePreferencesCard.tsx|ThemePreferencesCard.tsx]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_sanitizeRelativeRedirect|sanitizeRelativeRedirect]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_components.json|components.json]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_ProfileCards.tsx|ProfileCards.tsx]]
- [[_COMMUNITY_console-shell.ts|console-shell.ts]]
- [[_COMMUNITY_auth-ui-provider.tsx|auth-ui-provider.tsx]]
- [[_COMMUNITY_useThemeStore.ts|useThemeStore.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_OrganizationSwitcher.tsx|OrganizationSwitcher.tsx]]
- [[_COMMUNITY_EmailOTPForm.tsx|EmailOTPForm.tsx]]
- [[_COMMUNITY__auth.tsx|_auth.tsx]]
- [[_COMMUNITY_Task 2 Report Fungsi murni shell console|Task 2 Report: Fungsi murni shell console]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_timeline.tsx|timeline.tsx]]
- [[_COMMUNITY_useAuthStore.ts|useAuthStore.ts]]
- [[_COMMUNITY_watermark.tsx|watermark.tsx]]
- [[_COMMUNITY__authenticated.tsx|_authenticated.tsx]]
- [[_COMMUNITY_carousel.tsx|carousel.tsx]]
- [[_COMMUNITY_menubar.tsx|menubar.tsx]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_AppSidebar.tsx|AppSidebar.tsx]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_schema.ts|schema.ts]]
- [[_COMMUNITY_form.tsx|form.tsx]]
- [[_COMMUNITY_pagination.tsx|pagination.tsx]]
- [[_COMMUNITY_slider.tsx|slider.tsx]]
- [[_COMMUNITY_steps.tsx|steps.tsx]]
- [[_COMMUNITY_Header.tsx|Header.tsx]]
- [[_COMMUNITY_admin-billing.tsx|admin-billing.tsx]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_drawer.tsx|drawer.tsx]]
- [[_COMMUNITY_navigation-menu.tsx|navigation-menu.tsx]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_AGENT|AGENT.md]]
- [[_COMMUNITY_routes.test.mjs|routes.test.mjs]]
- [[_COMMUNITY_progress.tsx|progress.tsx]]
- [[_COMMUNITY_package.json|package.json]]
- [[_COMMUNITY_AuthView|AuthView]]
- [[_COMMUNITY_AuthStageContext.tsx|AuthStageContext.tsx]]
- [[_COMMUNITY_main.tsx|main.tsx]]
- [[_COMMUNITY_accordion.tsx|accordion.tsx]]
- [[_COMMUNITY_calendar.tsx|calendar.tsx]]
- [[_COMMUNITY_rating.tsx|rating.tsx]]
- [[_COMMUNITY_affix.tsx|affix.tsx]]
- [[_COMMUNITY_task-2-console-shell-brief|task-2-console-shell-brief.md]]
- [[_COMMUNITY_task-3-console-shell-brief|task-3-console-shell-brief.md]]
- [[_COMMUNITY_toggle.tsx|toggle.tsx]]
- [[_COMMUNITY_account.tsx|account.tsx]]
- [[_COMMUNITY_task-4-console-shell-brief|task-4-console-shell-brief.md]]
- [[_COMMUNITY_tree.tsx|tree.tsx]]
- [[_COMMUNITY_time-picker.tsx|time-picker.tsx]]
- [[_COMMUNITY_rating.tsx|rating.tsx]]
- [[_COMMUNITY_account.tsx|account.tsx]]
- [[_COMMUNITY_task-5-console-shell-brief|task-5-console-shell-brief.md]]
- [[_COMMUNITY_hover-card.tsx|hover-card.tsx]]
- [[_COMMUNITY_task-6-console-shell-brief|task-6-console-shell-brief.md]]
- [[_COMMUNITY_task-7-console-shell-brief|task-7-console-shell-brief.md]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 102 edges
2. `isExternalBackendConfigured()` - 77 edges
3. `useAuthStore` - 70 edges
4. `apiRequest()` - 58 edges
5. `Button` - 53 edges
6. `FileRoutesByPath` - 53 edges
7. `readMockDb()` - 36 edges
8. `useAuthUI()` - 35 edges
9. `Badge()` - 32 edges
10. `Card` - 32 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --indirect_call--> `fetchDashboardMetrics()`  [INFERRED]
  src/features/dashboard/DashboardPage.tsx → src/api/auth-service.ts
- `CreateOrganizationDialog()` --indirect_call--> `createOrganization()`  [INFERRED]
  src/components/better-auth/organization/CreateOrganizationDialog.tsx → src/api/auth-service.ts
- `SessionsCard()` --indirect_call--> `revokeSession()`  [INFERRED]
  src/components/better-auth/account/SessionsAndKeysCards.tsx → src/api/auth-service.ts
- `ApiKeysCard()` --indirect_call--> `deleteApiKey()`  [INFERRED]
  src/components/better-auth/account/SessionsAndKeysCards.tsx → src/api/auth-service.ts
- `PortalTenantsPage()` --indirect_call--> `createMyTenant()`  [INFERRED]
  src/features/portal/PortalTenantsPage.tsx → src/api/tenant-service.ts

## Import Cycles
- 1-file cycle: `src/components/ui/sonner.tsx -> src/components/ui/sonner.tsx`
- 1-file cycle: `src/components/ui/input-otp.tsx -> src/components/ui/input-otp.tsx`

## Communities (81 total, 9 thin omitted)

### Community 0 - "PortalTenantDetailPage.tsx"
Cohesion: 0.11
Nodes (44): TENANT_TIER_OPTIONS, TenantRecord, TenantStatus, changePasswordSchema, updateOrgSchema, AccordionContent, AccordionItem, AccordionTrigger (+36 more)

### Community 1 - "isExternalBackendConfigured"
Cohesion: 0.16
Nodes (27): avatarSchema, changeEmailSchema, profileSchema, FeatureDisabledCard(), AlertTitle, Badge(), BadgeProps, badgeVariants (+19 more)

### Community 2 - "routeTree.gen.ts"
Cohesion: 0.03
Nodes (74): DashboardPage(), Route, Route, Route, Route, AuthAuthAcceptInvitationIndexRoute, AuthAuthAcceptInvitationInvitationIdRoute, AuthAuthAcceptInvitationRoute (+66 more)

### Community 3 - "dependencies"
Cohesion: 0.03
Nodes (59): dependencies, better-auth, @better-auth/api-key, @better-auth/oauth-provider, @better-auth/passkey, @better-auth/sso, class-variance-authority, clsx (+51 more)

### Community 4 - "README.md"
Cohesion: 0.04
Nodes (42): 1. Gambaran Umum Arsitektur, 2. Mode Operasi Hybrid (`VITE_API_URL`), 3. File-Based Routing & Route Guards, 4. State Management (`src/stores/`), 5. Sistem RBAC (`src/lib/rbac.ts`), 6. Kualitas Kode & Pengujian, Arsitektur Aplikasi — Auth Core, 1. Provider & Guards (+34 more)

### Community 5 - "mock-db.ts"
Cohesion: 0.10
Nodes (30): ApiKeyRecord, AuditCategory, AuditSeverity, buildInitialApiKeys(), buildInitialAuditLogs(), buildInitialOAuthClients(), buildInitialOrganizations(), buildInitialRoles() (+22 more)

### Community 6 - "useAuthConfigStore.ts"
Cohesion: 0.11
Nodes (27): FeatureDisabledCardProps, BETTER_AUTH_FEATURE_MAP, BetterAuthFeatureDefinition, BetterAuthFeatureId, buildDefaultFeatureConfigMap(), buildPresetFeatureConfigMap(), ConfigPresetId, FeatureRuntimeConfig (+19 more)

### Community 7 - "cn"
Cohesion: 0.14
Nodes (22): Autocomplete, AutocompleteContext, AutocompleteContextValue, AutocompleteItem, AutocompleteItemProps, AutocompleteProps, Command(), CommandDialog() (+14 more)

### Community 8 - "tenant-context.ts"
Cohesion: 0.07
Nodes (58): AcceptInvitationPage(), ConsentPage(), BaseTenantPageProps, buildTenantRoutePath(), hasSignedOAuthQuery(), navigateAfterAuth(), renderTenantShell(), TenantAcceptInvitationPage() (+50 more)

### Community 9 - "index.ts"
Cohesion: 0.17
Nodes (31): ACCOUNT_NAV_ITEMS, AccountViewProps, ChangeEmailCard(), UpdateAvatarCard(), UpdateNameCard(), ChangePasswordCard(), DeleteAccountCard(), PasskeysCard() (+23 more)

### Community 10 - "utils.ts"
Cohesion: 0.13
Nodes (16): DataTableProps, Input, InputProps, inputVariants, Skeleton(), Table, TableBody, TableCaption (+8 more)

### Community 11 - "AuthView.tsx"
Cohesion: 0.15
Nodes (14): ForgotPasswordForm(), SignInFormProps, forgotPasswordSchema, ForgotPasswordValues, loginEmailSchema, LoginEmailValues, magicLinkSchema, MagicLinkValues (+6 more)

### Community 12 - "TenantAuthPages.tsx"
Cohesion: 0.08
Nodes (19): Route, Route, Route, Route, Route, Route, Route, Route (+11 more)

### Community 13 - "use-toast.ts"
Cohesion: 0.12
Nodes (23): Toast, ToastAction, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants, ToastViewport (+15 more)

### Community 14 - "ThemePreferencesCard.tsx"
Cohesion: 0.12
Nodes (16): COLOR_SCHEME_OPTIONS, FOOTER_TYPE_OPTIONS, NAV_LAYOUT_OPTIONS, NAVBAR_TYPE_OPTIONS, RADIUS_OPTIONS, SIDEBAR_TYPE_OPTIONS, RadioGroup, RadioGroupItem (+8 more)

### Community 15 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+15 more)

### Community 16 - "sanitizeRelativeRedirect"
Cohesion: 0.29
Nodes (6): Concerns, Deferred (Task 4), Files changed, Status, Task 3 Report: Katalog menu dan label matriks, Tests

### Community 17 - "schema.ts"
Cohesion: 0.11
Nodes (26): UnauthorizedState(), AdminTenantsPage(), AuditLogsPage(), AuditLogsPageProps, AuditLogsSearchParams, auditLogsSearchSchema, AuthFeaturesSearchParams, authFeaturesSearchSchema (+18 more)

### Community 18 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 19 - "schema.ts"
Cohesion: 0.06
Nodes (110): fetchActorPermissions(), AuditLogPage, banOrUnbanUser(), buildQuery(), cancelOrganizationInvitation(), createApiKey(), createOAuthClient(), createOrganization() (+102 more)

### Community 20 - "ProfileCards.tsx"
Cohesion: 0.20
Nodes (11): OrganizationLogo(), OrganizationLogoProps, SIZE_CLASSES, SIZE_CLASSES, UserAvatar(), UserAvatarProps, Avatar, AvatarFallback (+3 more)

### Community 21 - "console-shell.ts"
Cohesion: 0.13
Nodes (24): AuthUserRecord, listMyTenants(), resolveAuthenticatedHome(), ConsoleMenuItem, filterNav(), isPlatformActor(), PLATFORM_EXACT, redirectLegacyPath() (+16 more)

### Community 22 - "auth-ui-provider.tsx"
Cohesion: 0.17
Nodes (14): AuthUIBasePaths, AuthUIContext, AuthUIContextValue, AuthUILocalization, AuthUIProvider(), AuthUIProviderProps, DEFAULT_BASE_PATHS, DEFAULT_LOCALIZATION (+6 more)

### Community 23 - "useThemeStore.ts"
Cohesion: 0.11
Nodes (16): ColorThemeDefinition, ColorThemeId, DEFAULT_PREFS, FooterType, getSystemTheme(), initialPrefs, initialResolved, initialTheme (+8 more)

### Community 24 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 25 - "OrganizationSwitcher.tsx"
Cohesion: 0.21
Nodes (13): CreateOrganizationDialog(), OrganizationSwitcherProps, UserButtonLink, UserButtonProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+5 more)

### Community 26 - "EmailOTPForm.tsx"
Cohesion: 0.24
Nodes (12): input-otp, AuthMascot(), AuthMascotProps, useAuthStage(), EmailOTPForm(), EmailOTPFormProps, TwoFactorForm(), InputOTP (+4 more)

### Community 27 - "_auth.tsx"
Cohesion: 0.14
Nodes (15): AnimatedAuthBackground(), AuthStage, AuthStageContext, AuthStageContextValue, AuthStageProvider(), AppLogo(), AppLogoProps, SIZE_MAP (+7 more)

### Community 28 - "Task 2 Report: Fungsi murni shell console"
Cohesion: 0.13
Nodes (14): API publik, Catatan integrasi (Task berikutnya), Commit, Concerns, File yang diubah/dibuat, Functions, package.json, Ringkasan (+6 more)

### Community 29 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @tanstack/router-plugin, @types/node (+6 more)

### Community 30 - "timeline.tsx"
Cohesion: 0.14
Nodes (13): dotVariants, Timeline, TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineItemProps, timelineItemVariants (+5 more)

### Community 31 - "useAuthStore.ts"
Cohesion: 0.17
Nodes (12): AppSidebar(), SidebarMenuContent(), TenantShell(), TenantSwitcher(), ScrollArea, ScrollBar, MenuItemProps, menusConfig (+4 more)

### Community 32 - "watermark.tsx"
Cohesion: 0.18
Nodes (9): calcTextRenderedRect(), generateSvg(), Default, MultilineText, MultilineTextWithLineHeight, WatermarkStoryProps, Watermark(), WatermarkProps (+1 more)

### Community 33 - "_authenticated.tsx"
Cohesion: 0.32
Nodes (4): Footer(), ImpersonationBanner(), siteConfig, Route

### Community 34 - "carousel.tsx"
Cohesion: 0.18
Nodes (9): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselPrevious (+1 more)

### Community 35 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 36 - "schema.ts"
Cohesion: 0.29
Nodes (6): Commit, Delivered, Notes, Status, Task 4 Report: Platform shell & routes, Verification

### Community 37 - "schema.ts"
Cohesion: 0.10
Nodes (35): OrganizationRecord, CreateOrganizationDialogProps, OrganizationSettingsCards(), OrganizationView(), OrganizationViewProps, Select(), SelectContent, SelectItem (+27 more)

### Community 38 - "AppSidebar.tsx"
Cohesion: 0.10
Nodes (31): BillingRecord, BillingRecordStatus, formatCurrency(), getTierLabel(), isValidOAuthRedirectUri(), slugifyTenantName(), TenantBillingStatus, AdminBillingPage() (+23 more)

### Community 39 - "schema.ts"
Cohesion: 0.15
Nodes (18): KEY_SCOPES, Checkbox, CheckboxProps, checkboxVariants, DatePicker(), DatePickerProps, DateRangePicker(), DateRangePickerProps (+10 more)

### Community 40 - "schema.ts"
Cohesion: 0.25
Nodes (7): banUserSchema, BanUserValues, userFormSchema, UserFormValues, UsersSearchParams, usersSearchSchema, UsersPageProps

### Community 41 - "form.tsx"
Cohesion: 0.20
Nodes (7): FormControl, FormDescription, FormFieldContext, FormItem, FormItemContext, FormLabel, FormMessage

### Community 42 - "pagination.tsx"
Cohesion: 0.22
Nodes (9): Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious() (+1 more)

### Community 43 - "slider.tsx"
Cohesion: 0.24
Nodes (8): Slider, SliderMark, SliderProps, sliderVariants, TooltipContent, TooltipContentProps, TooltipProvider(), tooltipVariants

### Community 44 - "steps.tsx"
Cohesion: 0.20
Nodes (9): Step, StepDescription, StepLabel, Stepper, StepperProps, stepperVariants, StepProps, StepSharedProps (+1 more)

### Community 45 - "Header.tsx"
Cohesion: 0.19
Nodes (13): Header(), platformRolesFromMatches(), ROUTE_TITLES, filterMenuItems(), filterPlatformNavItems(), PlatformShell(), BreadcrumbItem, BreadcrumbItemProps (+5 more)

### Community 46 - "admin-billing.tsx"
Cohesion: 0.28
Nodes (7): AdminBillingPageProps, AdminBillingSearchParams, adminBillingSearchSchema, adminCreateBillingSchema, AdminCreateBillingValues, BillingRouteComponent(), Route

### Community 47 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, format, lint, preview, test:routes, typecheck

### Community 48 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 49 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 50 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, baseUrl, paths, strict, files, @/*, references

### Community 51 - "AGENT.md"
Cohesion: 0.29
Nodes (6): 1. ATURAN WAJIB: Gunakan Komponen yang Sudah Ada di `src/components/ui`, 2. Kepatuhan Design System (`DESIGN.MD`), 3. Konvensi React 19, Vite, TanStack Router, & Menu, 4. Checklist Verifikasi Sebelum Selesai, Daftar Komponen Tersedia di `src/components/ui/`, Learned User Preferences

### Community 52 - "routes.test.mjs"
Cohesion: 0.29
Nodes (5): extractPlatformNavHrefs(), extractSection(), platformRoutes, ROOT, tenantChildRoutes

### Community 53 - "progress.tsx"
Cohesion: 0.29
Nodes (6): circleVariants, CircularProgress, CircularProgressProps, Progress, ProgressProps, progressVariants

### Community 54 - "package.json"
Cohesion: 0.33
Nodes (5): name, packageManager, private, type, version

### Community 55 - "AuthView"
Cohesion: 0.33
Nodes (5): Commits, Concerns, Status, Task 5 — Console tenant shell — Report, Tests

### Community 56 - "AuthStageContext.tsx"
Cohesion: 0.40
Nodes (3): PortalTenantsPage(), portalTenantsSearchSchema, Route

### Community 57 - "main.tsx"
Cohesion: 0.40
Nodes (4): queryClient, Register, router, routeTree

### Community 58 - "accordion.tsx"
Cohesion: 0.67
Nodes (3): buttonVariants, Calendar(), CalendarProps

### Community 59 - "calendar.tsx"
Cohesion: 0.50
Nodes (3): Kbd, KbdProps, kbdVariants

### Community 60 - "rating.tsx"
Cohesion: 0.50
Nodes (3): InputGroup, InputGroupButton, InputGroupText

### Community 69 - "toggle.tsx"
Cohesion: 0.50
Nodes (3): Toggle, ToggleProps, toggleVariants

### Community 70 - "account.tsx"
Cohesion: 0.08
Nodes (15): NotFoundState(), PortalTenantApiKeysTab(), PortalTenantBillingTab(), PortalTenantOrgsTab(), PortalTenantSupportActions(), PortalTenantUsersTab(), Route, Route (+7 more)

### Community 73 - "tree.tsx"
Cohesion: 0.40
Nodes (3): TreeNode(), TreeNodeData, TreeNodeProps

### Community 75 - "rating.tsx"
Cohesion: 0.50
Nodes (3): Rating, RatingProps, ratingVariants

### Community 76 - "account.tsx"
Cohesion: 0.22
Nodes (6): AccountView(), AccountViewTab, accountSearchSchema, Route, accountSearchSchema, Route

## Knowledge Gaps
- **545 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+540 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `EmailOTPForm.tsx`, `package.json`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `PortalTenantDetailPage.tsx`, `isExternalBackendConfigured`, `index.ts`, `utils.ts`, `use-toast.ts`, `ThemePreferencesCard.tsx`, `ProfileCards.tsx`, `OrganizationSwitcher.tsx`, `EmailOTPForm.tsx`, `_auth.tsx`, `timeline.tsx`, `useAuthStore.ts`, `_authenticated.tsx`, `carousel.tsx`, `menubar.tsx`, `schema.ts`, `schema.ts`, `form.tsx`, `pagination.tsx`, `slider.tsx`, `steps.tsx`, `Header.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `progress.tsx`, `accordion.tsx`, `calendar.tsx`, `rating.tsx`, `toggle.tsx`, `tree.tsx`, `time-picker.tsx`, `rating.tsx`, `hover-card.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `sonner` connect `dependencies` to `PortalTenantDetailPage.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _545 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PortalTenantDetailPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1080389144905274 - nodes in this community are weakly interconnected._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.026265822784810128 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._