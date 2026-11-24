# Graph Report - auth-core-console  (2026-11-24)

## Corpus Check
- 242 files · ~110,190 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1470 nodes · 4417 edges · 81 communities (72 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e072a779`
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
- [[_COMMUNITY_Task 7 Report — Console permission gates|Task 7 Report — Console permission gates]]
- [[_COMMUNITY_main.tsx|main.tsx]]
- [[_COMMUNITY_accordion.tsx|accordion.tsx]]
- [[_COMMUNITY_tree.tsx|tree.tsx]]
- [[_COMMUNITY_rating.tsx|rating.tsx]]
- [[_COMMUNITY_affix.tsx|affix.tsx]]
- [[_COMMUNITY_task-2-console-shell-brief|task-2-console-shell-brief.md]]
- [[_COMMUNITY_task-3-console-shell-brief|task-3-console-shell-brief.md]]
- [[_COMMUNITY_kbd.tsx|kbd.tsx]]
- [[_COMMUNITY_account.tsx|account.tsx]]
- [[_COMMUNITY_task-4-console-shell-brief|task-4-console-shell-brief.md]]
- [[_COMMUNITY_toggle.tsx|toggle.tsx]]
- [[_COMMUNITY_cleave.tsx|cleave.tsx]]
- [[_COMMUNITY_OrganizationView.tsx|OrganizationView.tsx]]
- [[_COMMUNITY_rating.tsx|rating.tsx]]
- [[_COMMUNITY_account.tsx|account.tsx]]
- [[_COMMUNITY_task-5-console-shell-brief|task-5-console-shell-brief.md]]
- [[_COMMUNITY_task-6-console-shell-brief|task-6-console-shell-brief.md]]
- [[_COMMUNITY_task-7-console-shell-brief|task-7-console-shell-brief.md]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 102 edges
2. `isExternalBackendConfigured()` - 79 edges
3. `useAuthStore` - 72 edges
4. `apiRequest()` - 58 edges
5. `FileRoutesByPath` - 54 edges
6. `Button` - 53 edges
7. `readMockDb()` - 36 edges
8. `useAuthUI()` - 35 edges
9. `Badge()` - 32 edges
10. `Card` - 32 edges

## Surprising Connections (you probably didn't know these)
- `ConsoleSidebar()` --indirect_call--> `fetchActorPermissions()`  [INFERRED]
  src/components/layout/ConsoleSidebar.tsx → src/api/actor-permissions.ts
- `DashboardPage()` --indirect_call--> `fetchDashboardMetrics()`  [INFERRED]
  src/features/dashboard/DashboardPage.tsx → src/api/auth-service.ts
- `CreateOrganizationDialog()` --indirect_call--> `createOrganization()`  [INFERRED]
  src/components/better-auth/organization/CreateOrganizationDialog.tsx → src/api/auth-service.ts
- `SessionsCard()` --indirect_call--> `revokeSession()`  [INFERRED]
  src/components/better-auth/account/SessionsAndKeysCards.tsx → src/api/auth-service.ts
- `ApiKeysCard()` --indirect_call--> `deleteApiKey()`  [INFERRED]
  src/components/better-auth/account/SessionsAndKeysCards.tsx → src/api/auth-service.ts

## Import Cycles
- 1-file cycle: `src/components/ui/sonner.tsx -> src/components/ui/sonner.tsx`
- 1-file cycle: `src/components/ui/input-otp.tsx -> src/components/ui/input-otp.tsx`

## Communities (81 total, 9 thin omitted)

### Community 0 - "PortalTenantDetailPage.tsx"
Cohesion: 0.13
Nodes (26): BillingRecord, BillingRecordStatus, formatCurrency(), slugifyTenantName(), TENANT_TIER_OPTIONS, TenantBillingStatus, TenantRecord, TenantStatus (+18 more)

### Community 1 - "isExternalBackendConfigured"
Cohesion: 0.17
Nodes (25): avatarSchema, changeEmailSchema, profileSchema, KEY_SCOPES, Alert, AlertDescription, AlertProps, AlertTitle (+17 more)

### Community 2 - "routeTree.gen.ts"
Cohesion: 0.03
Nodes (73): Route, Route, Route, AuthAuthAcceptInvitationIndexRoute, AuthAuthAcceptInvitationInvitationIdRoute, AuthAuthAcceptInvitationRoute, AuthAuthAcceptInvitationRouteChildren, AuthAuthAcceptInvitationRouteWithChildren (+65 more)

### Community 3 - "dependencies"
Cohesion: 0.03
Nodes (59): dependencies, better-auth, @better-auth/api-key, @better-auth/oauth-provider, @better-auth/passkey, @better-auth/sso, class-variance-authority, clsx (+51 more)

### Community 4 - "README.md"
Cohesion: 0.04
Nodes (42): 1. Gambaran Umum Arsitektur, 2. Mode Operasi Hybrid (`VITE_API_URL`), 3. File-Based Routing & Route Guards, 4. State Management (`src/stores/`), 5. Sistem RBAC (`src/lib/rbac.ts`), 6. Kualitas Kode & Pengujian, Arsitektur Aplikasi — Auth Core, 1. Provider & Guards (+34 more)

### Community 5 - "mock-db.ts"
Cohesion: 0.20
Nodes (13): Checkbox, CheckboxProps, checkboxVariants, ApiKeysPageProps, AVAILABLE_API_SCOPES, ApiKeysSearchParams, apiKeysSearchSchema, createApiKeySchema (+5 more)

### Community 6 - "useAuthConfigStore.ts"
Cohesion: 0.07
Nodes (39): AdminFeatureRecord, AdminTierRecord, AuthFeatureAvailableSetting, AuthFeatureStatus, localFeatures, localTenantConfigs, localTiers, TenantFeatureConfigView (+31 more)

### Community 7 - "cn"
Cohesion: 0.15
Nodes (19): Autocomplete, AutocompleteContext, AutocompleteContextValue, AutocompleteItem, AutocompleteItemProps, AutocompleteProps, Command(), CommandDialog() (+11 more)

### Community 8 - "tenant-context.ts"
Cohesion: 0.14
Nodes (25): Separator, buildTenantRoutePath(), hasSignedOAuthQuery(), navigateAfterAuth(), renderTenantShell(), TenantAcceptInvitationPage(), TenantConsentPage(), TenantLoginPage() (+17 more)

### Community 9 - "index.ts"
Cohesion: 0.10
Nodes (38): ACCOUNT_NAV_ITEMS, AccountView(), AccountViewProps, AccountViewTab, ChangeEmailCard(), UpdateAvatarCard(), UpdateNameCard(), ChangePasswordCard() (+30 more)

### Community 10 - "utils.ts"
Cohesion: 0.14
Nodes (17): OrganizationRecord, CreateOrganizationDialogProps, Button, ButtonColor, ButtonProps, ButtonSize, ButtonVariant, Input (+9 more)

### Community 11 - "AuthView.tsx"
Cohesion: 0.10
Nodes (21): SignInFormProps, AuthUIBasePaths, AuthUIContext, AuthUILocalization, AuthUIProvider(), AuthUIProviderProps, DEFAULT_BASE_PATHS, DEFAULT_LOCALIZATION (+13 more)

### Community 12 - "TenantAuthPages.tsx"
Cohesion: 0.30
Nodes (9): ensureActorPermissions(), fetchActorPermissions(), adminGetTenant(), PortalTenantSupportActions(), ConsoleActor, resolveTenantMode(), isTenantNotFoundError(), loadTenantShell() (+1 more)

### Community 13 - "use-toast.ts"
Cohesion: 0.12
Nodes (23): Toast, ToastAction, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants, ToastViewport (+15 more)

### Community 14 - "ThemePreferencesCard.tsx"
Cohesion: 0.19
Nodes (19): DataTableProps, Select(), SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectTriggerProps (+11 more)

### Community 15 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+15 more)

### Community 16 - "sanitizeRelativeRedirect"
Cohesion: 0.29
Nodes (6): Concerns, Deferred (Task 4), Files changed, Status, Task 3 Report: Katalog menu dan label matriks, Tests

### Community 17 - "schema.ts"
Cohesion: 0.09
Nodes (34): PlatformShell(), UnauthorizedState(), AdminBillingPageProps, AdminBillingSearchParams, adminBillingSearchSchema, adminCreateBillingSchema, AdminCreateBillingValues, AuditLogsPageProps (+26 more)

### Community 18 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 19 - "schema.ts"
Cohesion: 0.05
Nodes (124): AuditLogPage, banOrUnbanUser(), buildQuery(), cancelOrganizationInvitation(), createApiKey(), createOAuthClient(), createOrganization(), createRole() (+116 more)

### Community 20 - "ProfileCards.tsx"
Cohesion: 0.23
Nodes (12): ACTOR_PERMISSIONS_QUERY_KEY, ConsoleSidebar(), platformRolesFromMatches(), tenantIdFromPath(), MenuItemProps, menusConfig, ownerPortalNav, platformNav (+4 more)

### Community 21 - "console-shell.ts"
Cohesion: 0.09
Nodes (39): AuthUserRecord, listMyTenants(), CreateOrganizationDialog(), OrganizationSwitcherProps, UserButtonLink, UserButtonProps, tenantIdFromPath(), WorkspaceSwitcher() (+31 more)

### Community 22 - "auth-ui-provider.tsx"
Cohesion: 0.16
Nodes (18): BaseTenantPageProps, createAuthPlugins(), createTenantAuthClient(), rawApiUrl, fetchTenantAuthConfig(), getPlatformHostEnv(), getTenantAuthConfigUrl(), getTenantBaseDomainEnv() (+10 more)

### Community 23 - "useThemeStore.ts"
Cohesion: 0.13
Nodes (13): ColorThemeDefinition, ColorThemeId, DEFAULT_PREFS, getSystemTheme(), initialPrefs, initialResolved, initialTheme, LEGACY_THEME_MAP (+5 more)

### Community 24 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+8 more)

### Community 25 - "OrganizationSwitcher.tsx"
Cohesion: 0.20
Nodes (11): OrganizationLogo(), OrganizationLogoProps, SIZE_CLASSES, SIZE_CLASSES, UserAvatar(), UserAvatarProps, Avatar, AvatarFallback (+3 more)

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
Cohesion: 0.06
Nodes (24): DashboardPage(), Route, Route, Route, Route, Route, Route, Route (+16 more)

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
Cohesion: 0.11
Nodes (23): getTierLabel(), FeatureDisabledCard(), SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+15 more)

### Community 38 - "AppSidebar.tsx"
Cohesion: 0.12
Nodes (15): isValidOAuthRedirectUri(), PortalTenantsPage(), PortalTenantsPageProps, createPortalApiKeySchema, CreatePortalApiKeyValues, createPortalOAuthClientSchema, CreatePortalOAuthClientValues, createPortalTenantSchema (+7 more)

### Community 39 - "schema.ts"
Cohesion: 0.24
Nodes (8): AdminTenantsPage(), AdminTenantsPageProps, adminCreateTenantSchema, AdminCreateTenantValues, AdminTenantsSearchParams, adminTenantsSearchSchema, Route, TenantsRouteComponent()

### Community 40 - "schema.ts"
Cohesion: 0.11
Nodes (17): COLOR_SCHEME_OPTIONS, FOOTER_TYPE_OPTIONS, NAV_LAYOUT_OPTIONS, NAVBAR_TYPE_OPTIONS, RADIUS_OPTIONS, SIDEBAR_TYPE_OPTIONS, RadioGroup, RadioGroupItem (+9 more)

### Community 41 - "form.tsx"
Cohesion: 0.20
Nodes (7): FormControl, FormDescription, FormFieldContext, FormItem, FormItemContext, FormLabel, FormMessage

### Community 42 - "pagination.tsx"
Cohesion: 0.22
Nodes (9): Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink(), PaginationLinkProps, PaginationNext(), PaginationPrevious() (+1 more)

### Community 43 - "slider.tsx"
Cohesion: 0.18
Nodes (11): SidebarMenuContent(), ScrollArea, ScrollBar, Slider, SliderMark, SliderProps, sliderVariants, TooltipContent (+3 more)

### Community 44 - "steps.tsx"
Cohesion: 0.20
Nodes (9): Step, StepDescription, StepLabel, Stepper, StepperProps, stepperVariants, StepProps, StepSharedProps (+1 more)

### Community 45 - "Header.tsx"
Cohesion: 0.17
Nodes (13): UserButton(), AppSidebar(), Header(), platformRolesFromMatches(), ROUTE_TITLES, BreadcrumbItem, BreadcrumbItemProps, breadcrumbItemsVariants (+5 more)

### Community 46 - "admin-billing.tsx"
Cohesion: 0.16
Nodes (30): changePasswordSchema, updateOrgSchema, AccordionContent, AccordionItem, AccordionTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent (+22 more)

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

### Community 56 - "Task 7 Report — Console permission gates"
Cohesion: 0.33
Nodes (5): Changes, Concerns, Status, Task 7 Report — Console permission gates, Verification

### Community 57 - "main.tsx"
Cohesion: 0.40
Nodes (4): queryClient, Register, router, routeTree

### Community 58 - "accordion.tsx"
Cohesion: 0.20
Nodes (10): buttonVariants, Calendar(), CalendarProps, DatePickerProps, DateRangePicker(), DateRangePickerProps, CustomPopover(), Popover() (+2 more)

### Community 59 - "tree.tsx"
Cohesion: 0.40
Nodes (3): TreeNode(), TreeNodeData, TreeNodeProps

### Community 60 - "rating.tsx"
Cohesion: 0.50
Nodes (3): InputGroup, InputGroupButton, InputGroupText

### Community 69 - "kbd.tsx"
Cohesion: 0.50
Nodes (3): Kbd, KbdProps, kbdVariants

### Community 70 - "account.tsx"
Cohesion: 0.08
Nodes (16): OrganizationSwitcher(), NotFoundState(), TenantShell(), PortalTenantApiKeysTab(), PortalTenantBillingTab(), PortalTenantOrgsTab(), PortalTenantUsersTab(), TenantShellMode (+8 more)

### Community 72 - "toggle.tsx"
Cohesion: 0.50
Nodes (3): Toggle, ToggleProps, toggleVariants

### Community 74 - "OrganizationView.tsx"
Cohesion: 0.08
Nodes (20): AuthView(), AcceptInvitationPage(), ConsentPage(), resolveTenantContext(), resolveTenantFromHostname(), AcceptInvitationIndexRoute(), Route, AcceptInvitationParamRoute() (+12 more)

### Community 75 - "rating.tsx"
Cohesion: 0.50
Nodes (3): Rating, RatingProps, ratingVariants

## Knowledge Gaps
- **550 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+545 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `PortalTenantDetailPage.tsx`, `isExternalBackendConfigured`, `mock-db.ts`, `tenant-context.ts`, `index.ts`, `utils.ts`, `use-toast.ts`, `ThemePreferencesCard.tsx`, `console-shell.ts`, `OrganizationSwitcher.tsx`, `EmailOTPForm.tsx`, `_auth.tsx`, `timeline.tsx`, `_authenticated.tsx`, `carousel.tsx`, `menubar.tsx`, `schema.ts`, `schema.ts`, `form.tsx`, `pagination.tsx`, `slider.tsx`, `steps.tsx`, `Header.tsx`, `admin-billing.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `progress.tsx`, `accordion.tsx`, `tree.tsx`, `rating.tsx`, `kbd.tsx`, `toggle.tsx`, `cleave.tsx`, `rating.tsx`, `utils.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `EmailOTPForm.tsx`, `package.json`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `sonner` connect `dependencies` to `isExternalBackendConfigured`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _550 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PortalTenantDetailPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13446969696969696 - nodes in this community are weakly interconnected._
- **Should `routeTree.gen.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.02664002664002664 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.03389830508474576 - nodes in this community are weakly interconnected._