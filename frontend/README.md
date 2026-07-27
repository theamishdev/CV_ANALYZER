# 📁 CV Analyzer - Frontend Section Documentation

This documentation provides detailed line-by-line or block-by-block explanations for all source files in the Angular frontend application. The application utilizes **Angular v20**, structured with a reactive paradigm utilizing **Angular Signals**, **Reactive Forms**, and lazy-loaded routing components.

---

## 🛠️ Table of Contents
1. [Application Configuration & Root](#1-application-configuration--root)
   - [src/main.ts](#srcmaints)
   - [src/index.html](#srcindexhtml)
   - [src/app/app.config.ts](#srcappappconfigts)
   - [src/app/app.component.ts](#srcappappcomponentts)
   - [src/app/app.html](#srcappapphtml)
   - [src/app/app.routes.ts](#srcappapproutests)
2. [Core Layer (Guards, Interceptors, & Services)](#2-core-layer-guards-interceptors--services)
   - [src/app/core/guards/auth.guard.ts](#srcappcoreguardsauthguardts)
   - [src/app/core/interceptors/auth.interceptor.ts](#srcappcoreinterceptorsauthinterceptorts)
   - [src/app/core/services/auth.service.ts](#srcappcoreservicesauthservicets)
   - [src/app/core/services/toast.service.ts](#srcappcoreservicestoastservicets)
3. [Shared Layer (Models & Components)](#3-shared-layer-models--components)
   - [src/app/shared/models/user.model.ts](#srcappsharedmodelsusermodelts)
   - [src/app/shared/components/toast/toast.component.ts](#srcappsharedcomponentstoasttoastcomponentts)
   - [src/app/shared/components/toast/toast.component.html](#srcappsharedcomponentstoasttoastcomponenthtml)
4. [Features Layer (Authentication Pages)](#4-features-layer-authentication-pages)
   - [src/app/features/auth/login/login.component.ts](#srcappfeaturesauthloginlogincomponentts)
   - [src/app/features/auth/login/login.component.html](#srcappfeaturesauthloginlogincomponenthtml)
   - [src/app/features/auth/signup/signup.component.ts](#srcappfeaturesauthsignupsignupcomponentts)
   - [src/app/features/auth/signup/signup.component.html](#srcappfeaturesauthsignupsignupcomponenthtml)
5. [Pages Layer (Home Dashboard Component)](#5-pages-layer-home-dashboard-component)
   - [src/app/pages/home/home.component.ts](#srcapppageshomehomecomponentts)
   - [src/app/pages/home/home.component.html](#srcapppageshomehomecomponenthtml)

---

## 1. Application Configuration & Root

### 🚀 src/main.ts
This is the starting file that bootstraps the Angular framework on the web browser client.

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

#### Line-by-Line Explanation
| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `import { bootstrapApplication } from '@angular/platform-browser';` | Imports Angular's standalone application bootstrapping engine helper. |
| **2** | `import { appConfig } from './app/app.config';` | Imports global configuration settings provider array objects. |
| **3** | `import { AppComponent } from './app/app.component';` | Imports the root Component template of the application. |
| **4** | *(empty)* | Left blank for readability. |
| **5** | `bootstrapApplication(AppComponent, appConfig)` | Starts application rendering using `AppComponent` as root node. |
| **6** | `  .catch((err) => console.error(err));` | Logs any initialization errors into browser developer tools console. |

---

### 🚀 src/index.html
The root template HTML document page layout loaded inside the client browser.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CV Analyzer</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  
  <!-- Premium Google Fonts: Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Google Material Icons -->
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

#### Line-by-Line Explanation
- **Lines 1-3:** Standard HTML document declaration tags.
- **Line 4:** Character set configuration setting (UTF-8).
- **Line 5:** Page title text header displaying: `CV Analyzer`.
- **Line 6:** Router base address parameter set to standard `/`.
- **Line 7:** Viewport scale configurations ensuring responsiveness on portable mobile viewports.
- **Line 8:** Maps shortcut favicon image file.
- **Lines 11-13:** Configures and loads Google Fonts (using the premium **Inter** font family).
- **Line 16:** Imports Material Icon classes library for layout glyph icons.
- **Line 19:** Embeds `<app-root>`, the selector target where Angular hooks root application views.

---

### 🚀 src/app/app.config.ts
This configures application providers, router paths, and HttpClient modules.

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

#### Line-by-Line Explanation
| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `import { ApplicationConfig, ... } from '@angular/core';` | Imports types and Zone.js change detection optimization configuration options. |
| **2** | `import { provideRouter } from '@angular/router';` | Imports router providers configuration setup utility. |
| **3** | `import { provideHttpClient } from '@angular/common/http';` | Imports HTTP network client fetch capability provider helper. |
| **4** | `import { routes } from './app.routes';` | Imports the routing maps array configuration object. |
| **5** | *(empty)* | Left blank for readability. |
| **6** | `export const appConfig: ApplicationConfig = {` | Declares and exports the global configuration object metadata wrapper. |
| **7** | `  providers: [` | Opens system-wide provider configuration listings array. |
| **8** | `    provideZoneChangeDetection({ eventCoalescing: true }),` | Boosts performance by coalescing multiple change micro-ticks. |
| **9** | `    provideRouter(routes),` | Initializes paths using routing structure configurations array. |
| **10** | `    provideHttpClient()` | Configures HTTP clients used for making API requests. |
| **11** | `  ]` | Closes providers array wrapper. |
| **12** | `};` | Ends application configuration constants declaration. |

---

### 🚀 src/app/app.component.ts
This defines the behavior metadata for the root shell Component.

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'cv-analyzer-auth';
}
```

#### Line-by-Line Explanation
| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `import { Component } from '@angular/core';` | Imports Component decorator used to configure Angular component metadata. |
| **2** | `import { RouterOutlet } from '@angular/router';` | Imports rendering viewport router outlet component module. |
| **3** | `import { ToastComponent } from './shared/components/toast/toast.component';` | Imports global toast system notification UI component. |
| **4** | *(empty)* | Left blank for readability. |
| **5** | `@Component({` | Begins root metadata configuration constructor definitions. |
| **6** | `  selector: 'app-root',` | Maps CSS selector identifier HTML hook to `<app-root>`. |
| **7** | `  standalone: true,` | Declares component as standalone (no external module declaration needed). |
| **8** | `  imports: [RouterOutlet, ToastComponent],` | Lists dependency child components imported for rendering purposes. |
| **9** | `  templateUrl: './app.html',` | Points to root HTML file. |
| **10** | `  styleUrl: './app.scss'` | Points to component styling sheet file. |
| **11** | `})` | Closes `@Component` constructor setup configuration. |
| **12** | `export class AppComponent {` | Declares class `AppComponent`. |
| **13** | `  title = 'cv-analyzer-auth';` | Title attribute metadata variable parameters set. |
| **14** | `}` | Closes class `AppComponent` definition. |

---

### 🚀 src/app/app.html
Displays the root container layout template.

```html
<!-- Global Toast Notification System -->
<app-toast></app-toast>

<!-- Main Router Navigation -->
<router-outlet></router-outlet>
```

#### Explanation
- **Line 2:** `<app-toast></app-toast>` renders the global overlay component list showing transient status update alerts.
- **Line 5:** `<router-outlet></router-outlet>` acts as dynamic component injection viewport showing login, register, or home pages.

---

### 🚀 src/app/app.routes.ts
This manages application pages map paths.

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup.component').then(c => c.SignupComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
```

#### Explanation
- **Lines 5-9:** Standard empty landing address redirect instruction pointing directly to `/login`.
- **Lines 10-13:** Maps dynamic lazy loaded layout imports for `/login` pointing to `LoginComponent`.
- **Lines 14-17:** Maps dynamic lazy loaded layout imports for `/signup` pointing to `SignupComponent`.
- **Lines 18-22:** Maps dynamic lazy loaded layout imports for `/home` page component protected by security activation route guards `authGuard`.
- **Lines 23-26:** Intercepts invalid routes redirecting users to `/login`.

---

## 2. Core Layer (Guards, Interceptors, & Services)

### 🚀 src/app/core/guards/auth.guard.ts
Restricts unauthorized views of pages requiring security logins (e.g. `/home`).

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login if not authenticated
  router.navigate(['/login']);
  return false;
};
```

#### Line-by-Line Explanation
| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1** | `import { inject } from '@angular/core';` | Imports Angular functional injection utility hook. |
| **2** | `import { CanActivateFn, Router } from '@angular/router';` | Imports route authorization Types and Router navigator helpers. |
| **3** | `import { AuthService } from '../services/auth.service';` | Imports authentication service tracking login state metrics. |
| **4** | *(empty)* | Left blank for readability. |
| **5** | `export const authGuard: CanActivateFn = (route, state) => {` | Declares and exports the functional security router guard closure. |
| **6** | `  const authService = inject(AuthService);` | Injects authentication service runtime reference. |
| **7** | `  const router = inject(Router);` | Injects routing utility controls reference. |
| **8** | *(empty)* | Left blank for readability. |
| **9** | `  if (authService.isAuthenticated()) {` | Checks validation state using reactive computed Signal from AuthService. |
| **10** | `    return true;` | Grants access rendering the target path component page view. |
| **11** | `  }` | Closes verification conditional branch. |
| **12** | *(empty)* | Left blank for readability. |
| **13** | `  // Redirect to login if not authenticated` | Code comment explaining unauthorized user handling steps. |
| **14** | `  router.navigate(['/login']);` | Instructs application routing engine to navigate to `/login`. |
| **15** | `  return false;` | Rejects current transition processing step. |
| **16** | `};` | Closes guard execution handler. |

---

### 🚀 src/app/core/interceptors/auth.interceptor.ts
This interceptor intercepts all HTTP requests.

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Simple pass-through interceptor for logging/future token headers
  console.log(`HTTP Request intercepted: ${req.method} ${req.url}`);
  return next(req);
};
```

#### Explanation
- **Line 3:** Defines interceptor function passing requests to subsequent actions.
- **Line 5:** Logs HTTP Request details: Method and Target URL path.
- **Line 6:** Forwards target request to next HTTP pipeline logic block.

---

### 🚀 src/app/core/services/auth.service.ts
Manages authentication state machine parameters and interacts with backend API routes.

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  // Signals for auth state management
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadUserFromStorage();
  }

  signup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { name, email, password });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.setCurrentUser(res.user);
        }
      })
    );
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('cv_analyzer_user');
    this.router.navigate(['/login']);
  }

  private setCurrentUser(user: User) {
    this.currentUser.set(user);
    localStorage.setItem('cv_analyzer_user', JSON.stringify(user));
  }

  private loadUserFromStorage() {
    const storedUser = localStorage.getItem('cv_analyzer_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUser.set(user);
      } catch (e) {
        localStorage.removeItem('cv_analyzer_user');
      }
    }
  }
}
```

#### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1-5** | `import { ... }` | Imports DI, HttpClient, Routing, RxJS operators and interface models. |
| **7-9** | `@Injectable({ providedIn: 'root' })` | Decorates service class ensuring application-wide singleton initialization state. |
| **10** | `export class AuthService {` | Defines the main `AuthService` class structure. |
| **11** | `  private readonly http = inject(HttpClient);` | Injects HTTP execution engine to support network requests. |
| **12** | `  private readonly router = inject(Router);` | Injects angular router engine mapping navigation updates. |
| **13** | `  private readonly apiUrl = 'http://localhost:3000/api/auth';` | Sets backend base endpoints host location string parameters. |
| **14** | *(empty)* | Left blank for readability. |
| **15** | `  // Signals for auth state management` | Code comments about Angular Signals. |
| **16** | `  readonly currentUser = signal<User \| null>(null);` | Defines reactive storage signal holding authenticated user details or null. |
| **17** | `  readonly isAuthenticated = computed(() => this.currentUser() !== null);` | Computes read-only authentication boolean reflecting Signal status changes. |
| **18** | *(empty)* | Left blank for readability. |
| **19** | `  constructor() {` | Declares class initialization entry constructor function. |
| **20** | `    this.loadUserFromStorage();` | Checks local storage on init to restore existing login sessions. |
| **21** | `  }` | Closes constructor definitions. |
| **22** | *(empty)* | Left blank for readability. |
| **23** | `  signup(...) {` | POST handler mapping new user registrations request API values. |
| **24** | `    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { name, email, password });` | Issues HTTP POST registration payload sending name, email, and password. |
| **25** | `  }` | Closes signup block handler. |
| **26** | *(empty)* | Left blank for readability. |
| **27** | `  login(...) {` | POST validation handler targeting authentication checks. |
| **28** | `    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(` | Issues HTTP POST credentials check matching email and password. |
| **29** | `      tap(res => {` | Runs side-effects tap operator pipeline processing response properties. |
| **30** | `        if (res.success && res.user) {` | If login execution evaluates to successful. |
| **31** | `          this.setCurrentUser(res.user);` | Commits user data models to state cache properties. |
| **32** | `        }` | Closes conditional success checking block. |
| **33** | `      })` | Closes side-effects block. |
| **34** | `    );` | Closes pipe operations chain. |
| **35** | `  }` | Closes login execution block. |
| **36** | *(empty)* | Left blank for readability. |
| **37** | `  logout() {` | Logs out current authenticated user session. |
| **38** | `    this.currentUser.set(null);` | Resets current user Signal reference back to null. |
| **39** | `    localStorage.removeItem('cv_analyzer_user');` | Destroys cached profiles validation keys in local browser storage. |
| **40** | `    this.router.navigate(['/login']);` | Redirects application view display routing back to `/login`. |
| **41** | `  }` | Closes logout handler body. |
| **42** | *(empty)* | Left blank for readability. |
| **43** | `  private setCurrentUser(user: User) {` | Defines internal helper mapping current profile records. |
| **44** | `    this.currentUser.set(user);` | Updates reactive signal user record content mappings. |
| **45** | `    localStorage.setItem('cv_analyzer_user', JSON.stringify(user));` | Persists user profile as JSON string inside browser storage. |
| **46** | `  }` | Closes helper implementation block. |
| **47** | *(empty)* | Left blank for readability. |
| **48** | `  private loadUserFromStorage() {` | Helper checking local memory keys matching existing profile data. |
| **49** | `    const storedUser = localStorage.getItem('cv_analyzer_user');` | Reads storage parameters matching key name target. |
| **50** | `    if (storedUser) {` | If profile data exists. |
| **51** | `      try {` | Initiates try execution wrapper to isolate parse issues. |
| **52** | `        const user = JSON.parse(storedUser) as User;` | Decodes local string values back into User interface structure format. |
| **53** | `        this.currentUser.set(user);` | Populates active runtime Signal caches using parsed data models. |
| **54** | `      } catch (e) {` | Handles json parse errors from corrupted storage data. |
| **55** | `        localStorage.removeItem('cv_analyzer_user');` | Deletes corrupted keys formatting blocks from storage cache. |
| **56** | `      }` | Closes catch blocks scope. |
| **57** | `    }` | Closes check scope conditional. |
| **58** | `  }` | Closes `loadUserFromStorage` helper definition. |
| **59** | `}` | Closes class `AuthService` logic structure. |

---

### 🚀 src/app/core/services/toast.service.ts
Manages dynamic arrays of application transient notification toast items.

```typescript
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 4000) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    
    // Add toast to array signal
    this.toasts.update(currentToasts => [...currentToasts, { id, message, type }]);

    // Automatically remove after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.toasts.update(currentToasts => currentToasts.filter(t => t.id !== id));
  }

  success(message: string, duration?: number) { this.show(message, 'success', duration); }
  error(message: string, duration?: number) { this.show(message, 'error', duration); }
  warning(message: string, duration?: number) { this.show(message, 'warning', duration); }
  info(message: string, duration?: number) { this.show(message, 'info', duration); }
}
```

#### Explanation
- **Lines 3-7:** Declares properties layout interface matching each toast item (Unique ID, display text, status theme).
- **Line 13:** Holds the active notification items list inside a reactive updateable Signal array (`toasts`).
- **Line 15:** Declares utility show constructor mapping parameters: Message, UI template styling type, and lifecycle durations.
- **Line 16:** Generates secure unique id using current date timestamp string parameters alongside random string numbers.
- **Line 19:** Appends the new toast object array structures into the active Signal array cache.
- **Lines 22-24:** Configures a timer to automatically trigger toast dismissal actions using a `setTimeout` function.
- **Line 27:** Declares remove action clearing targeted toast item from Signal tracking list using `filter`.
- **Lines 31-45:** Exposes convenient semantic shortcuts mapping explicit styling categories (Success, Error, Warning, Info).

---

## 3. Shared Layer (Models & Components)

### 🚀 src/app/shared/models/user.model.ts
Defines interface contracts matching application profiles and JSON payloads returned by API backend endpoints.

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}
```

#### Explanation
- **Lines 1-5:** `User` details properties specifications matching standard user credentials layout values.
- **Lines 7-11:** `AuthResponse` specifications matching structured JSON data returned by authentication endpoints.

---

### 🚀 src/app/shared/components/toast/toast.component.ts
Controls layout logic behavior for global notifications display views component.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/auth.service'; // Injected component

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
```

#### Explanation
- **Line 12:** Declares layout controller component class `ToastComponent`.
- **Line 13:** Injects `ToastService` component class reference to bind dynamic notification item lists directly inside HTML view layouts.

---

### 🚀 src/app/shared/components/toast/toast.component.html
Renders floating alert message items loops dynamically.

```html
<div class="toast-container">
  @for (toast of toastService.toasts(); track toast.id) {
    <div class="toast-item" [ngClass]="toast.type" (click)="toastService.remove(toast.id)">
      <span class="material-icons toast-icon">
        @switch (toast.type) {
          @case ('success') { check_circle }
          @case ('error') { error }
          @case ('warning') { warning }
          @case ('info') { info }
        }
      </span>
      <span class="toast-message">{{ toast.message }}</span>
      <button class="toast-close" (click)="$event.stopPropagation(); toastService.remove(toast.id)">
        <span class="material-icons">close</span>
      </button>
    </div>
  }
</div>
```

#### Explanation
- **Line 2:** Implements modern Angular `@for` template flow controls looping through `toastService.toasts()` array signal tracking elements by `toast.id`.
- **Line 3:** Binds class styling names matching validation state theme names (`toast.type`), adding click events allowing users to dismiss them.
- **Lines 5-10:** Renders semantic status icons dynamically inside html viewport templates using Angular's `@switch` flow controls.
- **Line 12:** Outputs transient warning description string content parameters (`toast.message`).
- **Line 13:** Close button executing dismissal action handlers, using `$event.stopPropagation()` to prevent double event dispatch bubbling.

---

## 4. Features Layer (Authentication Pages)

### 🚀 src/app/features/auth/login/login.component.ts
Implements client logic validations handling login operations.

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Form definition with strict email regex validation
  readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],
    password: ['', [Validators.required]]
  });

  // State signals
  readonly isPasswordHidden = signal(true);
  readonly isLoading = signal(false);

  togglePasswordVisibility() {
    this.isPasswordHidden.update(hidden => !hidden);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Login successful! Welcome back.');
          this.router.navigate(['/home']);
        } else {
          this.toastService.error(res.message || 'Login failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || 'Invalid Email or Password';
        this.toastService.error(errorMsg);
      }
    });
  }
}
```

#### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1-6** | `import { ... }` | Imports Angular Core elements, Forms controls dependencies, Routing tools, and Core services. |
| **15** | `export class LoginComponent {` | Declares class component `LoginComponent` framework. |
| **16-19**| `private readonly ... = inject(...)` | Injects FormBuilder, AuthService, ToastService, and Router parameters references. |
| **22** | `readonly emailRegex = ...` | Configures regex enforcing correct email patterns. |
| **23** | `readonly loginForm: FormGroup = ...` | Sets up reactive form control properties mapping validation rules. |
| **24** | `  email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],` | Validates email is non-empty and matches the email pattern regex. |
| **25** | `  password: ['', [Validators.required]]` | Validates password field is non-empty. |
| **29** | `readonly isPasswordHidden = signal(true);` | Reactive state Signal controlling password text visibility controls. |
| **30** | `readonly isLoading = signal(false);` | Reactive state Signal tracking submit HTTP request loading indicators. |
| **32** | `togglePasswordVisibility() {` | Declares toggler function switching password visibility. |
| **33** | `  this.isPasswordHidden.update(hidden => !hidden);` | Inverts current boolean parameter inside password visibility signal state. |
| **34** | `}` | Closes password visibility toggle function. |
| **36** | `onSubmit() {` | Submit handler executed on form submit. |
| **37** | `  if (this.loginForm.invalid) {` | Evaluates if credentials forms fail input rules checks. |
| **38** | `    this.loginForm.markAllAsTouched();` | Forces validation styling blocks error overlays to display on all inputs. |
| **39** | `    return;` | Halts execution routing. |
| **40** | `  }` | Closes validation check routing structure block. |
| **42** | `  this.isLoading.set(true);` | Activates layout spinner loadings graphic markers. |
| **43** | `  const { email, password } = this.loginForm.value;` | Destructures input fields from active reactive form values. |
| **45** | `  this.authService.login(email, password).subscribe({` | Calls login method returning RxJS network subscriber. |
| **46** | `    next: (res) => {` | Standard success callback response intercept. |
| **47** | `      this.isLoading.set(false);` | Deactivates UI submit loader spinner graphic overlay. |
| **48** | `      if (res.success) {` | Checks validation success parameters response indicators. |
| **49** | `        this.toastService.success('Login successful! Welcome back.');` | Launches successful toast message indicator alerts. |
| **50** | `        this.router.navigate(['/home']);` | Routes client user viewport directly onto dashboard page `/home`. |
| **51** | `      } else {` | Handles API logical errors if login details failed. |
| **52** | `        this.toastService.error(res.message \|\| 'Login failed.');` | Displays validation warning message descriptions. |
| **53** | `      }` | Closes checking success conditionals. |
| **54** | `    },` | Closes success subscriber callback parameter settings block. |
| **55** | `    error: (err) => {` | Error callback intercept managing HTTP exceptions (e.g. backend offline). |
| **56** | `      this.isLoading.set(false);` | Deactivates spinner graphics loaders. |
| **57** | `      const errorMsg = err.error?.message \|\| 'Invalid Email or Password';` | Resolves safe message string descriptions from errors. |
| **58** | `      this.toastService.error(errorMsg);` | Launches error toast display cards overlays. |
| **59** | `    }` | Closes error callback parameters details settings. |
| **60** | `  });` | Closes subscriber lifecycle tracking setups. |
| **61** | `}` | Closes `onSubmit` handler body block. |
| **62** | `}` | Closes class Component module settings. |

---

### 🚀 src/app/features/auth/login/login.component.html
Renders login card form layout views.

```html
<div class="auth-page-container">
  <div class="auth-card">
    <!-- Header -->
    <div class="auth-header">
      <h1 class="brand-title">CV Analyzer</h1>
      <p class="brand-subtitle">Analyze and optimize your resume effortlessly.</p>
    </div>

    <!-- Login Form -->
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
      
      <!-- Email Field -->
      <div class="form-group">
        <label for="email">Email Address</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">email</span>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="Enter your email"
            [ngClass]="{ 'invalid-input': loginForm.get('email')?.touched && loginForm.get('email')?.invalid }"
          />
        </div>
        <!-- Email validation messages -->
        @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
          <div class="validation-message">
            @if (loginForm.get('email')?.hasError('required')) {
              Email address is required.
            } @else if (loginForm.get('email')?.hasError('pattern')) {
              Please enter a valid email address.
            }
          </div>
        }
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">lock</span>
          <input
            id="password"
            [type]="isPasswordHidden() ? 'password' : 'text'"
            formControlName="password"
            placeholder="Enter your password"
            [ngClass]="{ 'invalid-input': loginForm.get('password')?.touched && loginForm.get('password')?.invalid }"
          />
          <button
            type="button"
            class="toggle-password-btn"
            (click)="togglePasswordVisibility()"
            tabindex="-1"
          >
            <span class="material-icons">
              {{ isPasswordHidden() ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
        <!-- Password validation messages -->
        @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
          <div class="validation-message">
            Password is required.
          </div>
        }
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn-primary"
        [disabled]="loginForm.invalid || isLoading()"
      >
        @if (isLoading()) {
          <span class="spinner"></span>
          Signing In...
        } @else {
          Sign In
        }
      </button>
    </form>

    <!-- Footer Redirect Link -->
    <div class="auth-footer">
      <p>
        Don't have an account?
        <a routerLink="/signup" class="auth-link">Sign Up</a>
      </p>
    </div>
  </div>
</div>
```

#### Explanation
- **Line 10:** Binds `FormGroup` element reference structure mapping validation indicators to html views context, catching submit events with `(ngSubmit)="onSubmit()"`.
- **Line 22:** Applies invalid styling borders class `invalid-input` if email input was modified and has validation errors.
- **Lines 26-34:** Uses Angular `@if` flow control to render specific warning feedback dynamically.
- **Line 44:** Binds input type dynamically to `'password'` or `'text'` based on the reactive Signal status wrapper state `isPasswordHidden()`.
- **Lines 49-58:** Password visibility toggle button executing `togglePasswordVisibility()` on click.
- **Lines 69-80:** Form submission button disabled dynamically when the form is invalid or currently loading request responses.

---

### 🚀 src/app/features/auth/signup/signup.component.ts
Validates signup details (Name, Email, Password) using standard Angular Reactive Forms.

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Form Setup
  readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Custom password strength regexes for form control validation
  readonly hasUpper = /[A-Z]/;
  readonly hasLower = /[a-z]/;
  readonly hasNum = /[0-9]/;
  readonly hasSpec = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\/`~#]/;

  readonly signupForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.pattern(this.emailRegex)]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(this.hasUpper),
      Validators.pattern(this.hasLower),
      Validators.pattern(this.hasNum),
      Validators.pattern(this.hasSpec)
    ]]
  });

  // State Signals
  readonly isPasswordHidden = signal(true);
  readonly isLoading = signal(false);

  togglePasswordVisibility() {
    this.isPasswordHidden.update(hidden => !hidden);
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { name, email, password } = this.signupForm.value;

    this.authService.signup(name, email, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.success('Account created successfully! Please login.');
          this.router.navigate(['/login']);
        } else {
          this.toastService.error(res.message || 'Signup failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || 'Registration failed. Please check inputs.';
        this.toastService.error(errorMsg);
      }
    });
  }
}
```

#### Line-by-Line Explanation

| Line No. | Code | Description |
| :--- | :--- | :--- |
| **1-6** | `import { ... }` | Imports Angular Core components, Form controls, Router, and Core services. |
| **15** | `export class SignupComponent {` | Declares class component `SignupComponent` framework. |
| **16-19**| `private readonly ... = inject(...)` | Injects FormBuilder, AuthService, ToastService, and Router parameters references. |
| **22** | `readonly emailRegex = ...` | Regex pattern checking target email input values. |
| **25-28**| `readonly hasUpper = ...` | Regex pattern checking password complexity requirements (uppercase, lowercase, digits, special characters). |
| **30-41**| `readonly signupForm: FormGroup = ...` | Configures reactive form controls validating name, email, and password complexity constraints. |
| **44-45**| `readonly isPasswordHidden = ...` | Declares state signals for password text visibility and submit API request loading state. |
| **47-49**| `togglePasswordVisibility() { ... }` | Inverts password text display mode visibility signal. |
| **51-79**| `onSubmit() { ... }` | Evaluates signup form correctness, sets loading state, calls AuthService to sign up, shows success toast, and navigates to the login screen. |

---

### 🚀 src/app/features/auth/signup/signup.component.html
Renders registration forms layout pages displaying warning messages if input details fail validation checks.

```html
<div class="auth-page-container">
  <div class="auth-card">
    <!-- Header -->
    <div class="auth-header">
      <h1 class="brand-title">CV Analyzer</h1>
      <p class="brand-subtitle">Analyze and optimize your resume effortlessly.</p>
    </div>

    <!-- Signup Form -->
    <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" novalidate>
      
      <!-- Full Name Field -->
      <div class="form-group">
        <label for="name">Full Name</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">person</span>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Enter your name"
            [ngClass]="{ 'invalid-input': signupForm.get('name')?.touched && signupForm.get('name')?.invalid }"
          />
        </div>
        @if (signupForm.get('name')?.touched && signupForm.get('name')?.invalid) {
          <div class="validation-message">
            Full Name is required (minimum 2 characters).
          </div>
        }
      </div>

      <!-- Email Field -->
      <div class="form-group">
        <label for="email">Email Address</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">email</span>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="Enter your email"
            [ngClass]="{ 'invalid-input': signupForm.get('email')?.touched && signupForm.get('email')?.invalid }"
          />
        </div>
        @if (signupForm.get('email')?.touched && signupForm.get('email')?.invalid) {
          <div class="validation-message">
            @if (signupForm.get('email')?.hasError('required')) {
              Email address is required.
            } @else if (signupForm.get('email')?.hasError('pattern')) {
              Please enter a valid email address.
            }
          </div>
        }
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <span class="material-icons input-icon">lock</span>
          <input
            id="password"
            [type]="isPasswordHidden() ? 'password' : 'text'"
            formControlName="password"
            placeholder="Create password"
            [ngClass]="{ 'invalid-input': signupForm.get('password')?.touched && signupForm.get('password')?.invalid }"
          />
          <button
            type="button"
            class="toggle-password-btn"
            (click)="togglePasswordVisibility()"
            tabindex="-1"
          >
            <span class="material-icons">
              {{ isPasswordHidden() ? 'visibility_off' : 'visibility' }}
            </span>
          </button>
        </div>
        
        <!-- Simple Password Validation message -->
        @if (signupForm.get('password')?.touched && signupForm.get('password')?.invalid) {
          <div class="validation-message">
            Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
          </div>
        }
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn-primary"
        [disabled]="signupForm.invalid || isLoading()"
      >
        @if (isLoading()) {
          <span class="spinner"></span>
          Creating Account...
        } @else {
          Create Account
        }
      </button>
    </form>

    <!-- Footer Redirect Link -->
    <div class="auth-footer">
      <p>
        Already have an account?
        <a routerLink="/login" class="auth-link">Login</a>
      </p>
    </div>
  </div>
</div>
```

#### Explanation
- **Line 81:** Conditionally displays the static password validation instruction message when the input is touched and invalid, explaining required characters formats.
- **Line 115:** Form submission button disabled dynamically when the signup form is invalid or currently waiting for API network responses.


---

## 5. Pages Layer (Home Dashboard Component)

### 🚀 src/app/pages/home/home.component.ts
Declares the landing dashboard page component.

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected readonly authService = inject(AuthService);

  onLogout() {
    this.authService.logout();
  }
}
```

#### Explanation
- **Line 13:** Injects `AuthService` reference to access profile details and login validation metrics states.
- **Lines 15-17:** Declares log out operations trigger executing `AuthService.logout()`.

---

### 🚀 src/app/pages/home/home.component.html
Renders the welcome dashboard card interface.

```html
<div class="home-container">
  <div class="welcome-card">
    <span class="material-icons welcome-icon">verified_user</span>
    <h1>Welcome, {{ authService.currentUser()?.name || 'User' }}!</h1>
    <p class="subtitle">This is Home Page</p>
    <span class="muted-note">(Will be updated later.)</span>
    
    <button class="btn-logout" (click)="onLogout()">
      <span class="material-icons">logout</span>
      Log Out
    </button>
  </div>
</div>
```

#### Explanation
- **Line 4:** Interpolates and displays the authenticated user name dynamically using `authService.currentUser()?.name`.
- **Lines 8-11:** Renders logout trigger button mapping standard logout click events execution handlers `(click)="onLogout()"`.
