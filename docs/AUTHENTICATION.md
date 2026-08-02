# Authentication and Login Guide

This project uses a React single-page application (SPA) as the frontend and
Laravel as the API backend. Authentication is handled by Laravel Sanctum using
Laravel's normal session cookie. It does **not** store an API token or password
in browser localStorage.

## Architecture

```text
React (localhost:5173)
    |
    | Axios requests with cookies and CSRF headers
    v
Laravel (localhost:8000)
    |
    | web guard + Sanctum middleware
    v
Database (users and sessions tables)
```

The frontend and backend use different ports but the same host (`localhost`).
Do not mix `localhost` and `127.0.0.1` during development because browsers treat
them as different hosts.

## The three authentication endpoints

They are registered in `backend/routes/api.php`:

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/login` | Public | Validate credentials and create a session |
| GET | `/api/user` | `auth:sanctum` | Return the currently authenticated user |
| POST | `/api/logout` | `auth:sanctum` | Destroy the current session |

Sanctum also supplies `GET /sanctum/csrf-cookie`. React calls this before login
so Laravel can issue a CSRF token.

## Login request sequence

```text
1. User submits the React login form
2. React requests GET /sanctum/csrf-cookie
3. Laravel sends the XSRF-TOKEN cookie
4. React posts username/password to POST /api/login
5. Laravel validates the request
6. Auth::attempt() finds the user and verifies the password hash
7. Laravel regenerates the session ID
8. Laravel returns safe user fields as JSON
9. React stores that user in AuthContext
10. ProtectedRoute allows the dashboard to render
```

## Frontend responsibilities

### Axios client

`src/lib/api.js` creates the shared HTTP client.

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});
```

- `baseURL` comes from the frontend `.env` file.
- `withCredentials` allows the browser to send the Laravel session cookie.
- `withXSRFToken` copies the CSRF cookie into the request header.
- `Accept: application/json` makes Laravel return JSON errors instead of HTML.

### Authentication context

`src/context/AuthContext.jsx` owns the frontend authentication state:

```text
user = null            user is logged out
user = {...}           user is logged in
isAuthLoading = true   Laravel is still checking the existing session
```

Its functions are:

- `login()` gets the CSRF cookie, posts credentials, and saves the returned user.
- `loadUser()` calls `/api/user` when React starts. This restores the UI after a
  page refresh if the Laravel session is still valid.
- `logout()` asks Laravel to destroy the session and then clears React's user.

`AuthProvider` wraps the application in `src/main.jsx`, so every descendant can
call `useAuth()`.

### Login form

`src/pages/Login.jsx` manages form state and calls the context's `login()`
function. Only the remembered **username** is saved in localStorage. The
password and authenticated session are not stored there.

Laravel validation errors normally have this shape:

```json
{
  "message": "Invalid username or password.",
  "errors": {
    "username": ["Invalid username or password."]
  }
}
```

The login page reads that message and displays it to the user.

### Protected React routes

`ProtectedRoute` in `src/routes/AppRoutes.jsx` waits for `loadUser()` to finish.
It redirects to `/login` when no authenticated user exists.

This is a user-interface guard, not a security boundary. A user can modify
frontend JavaScript. Every sensitive Laravel endpoint must therefore also use
authentication and authorization middleware.

## Backend responsibilities

### Routes

```php
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
```

`throttle:5,1` permits at most five login requests per minute for the limiter's
request key. `auth:sanctum` rejects unauthenticated requests with HTTP 401.

### Controller login method

`backend/app/Http/Controllers/AuthController.php` first validates the input:

```php
$credentials = $request->validate([
    'username' => ['required', 'string'],
    'password' => ['required', 'string'],
    'remember' => ['sometimes', 'boolean'],
]);
```

Laravel returns HTTP 422 automatically when validation fails.

Authentication then happens here:

```php
$authenticated = Auth::attempt(
    [
        'username' => $credentials['username'],
        'password' => $credentials['password'],
        'is_active' => true,
    ],
    $credentials['remember'] ?? false,
);
```

Important details:

- Laravel queries the configured `User` model by `username` and `is_active`.
- `password` is treated specially: Laravel hashes the submitted value and
  safely compares it with the stored password hash.
- An inactive account deliberately receives the same error as bad credentials.
  This avoids revealing whether an account exists.
- `?? false` means “use `false` when `remember` was not submitted.”
- The second `Auth::attempt()` argument controls Laravel's remember-me cookie.

After success:

```php
$request->session()->regenerate();
```

Regenerating the session ID prevents session-fixation attacks.

### Current-user method

`$request->user()` is populated by `auth:sanctum`. The controller returns only
an explicit safe list:

```text
id, name, username, email, role, is_active
```

Passwords and remember tokens are never returned.

### Logout method

Logout performs three operations:

```php
Auth::guard('web')->logout();
$request->session()->invalidate();
$request->session()->regenerateToken();
```

These log out the web guard, invalidate the old session, and create a new CSRF
token for any later session.

## Laravel concepts used here

### Guard

A guard describes how Laravel keeps a user authenticated. `config/auth.php`
configures the `web` guard with the `session` driver.

### Provider

A provider describes how users are loaded. The `users` provider uses Eloquent
and `App\Models\User`, so Laravel queries the `users` table through that model.

### Middleware

Middleware runs before or after a controller. `$middleware->statefulApi()` in
`backend/bootstrap/app.php` lets approved first-party SPA requests use Laravel
session cookies with API routes.

### Sanctum

Sanctum connects the first-party SPA request to Laravel's `web` session guard.
This project uses Sanctum's cookie mode, not its personal-access-token mode.

### CSRF

Cross-Site Request Forgery protection prevents another site from submitting a
state-changing request through an authenticated user's browser. Axios and
Sanctum exchange the `XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header.

### Model casts and hidden fields

The `User` model casts `password` as `hashed`, so assigned plaintext passwords
are hashed before storage. It casts `is_active` to a PHP boolean. Its hidden
fields prevent `password` and `remember_token` from appearing in JSON.

### Migration

The authentication migration adds a unique username, role, and active flag to
the users table. Migrations are version control for database structure.

### Seeder

`AdminUserSeeder` creates or updates the initial administrator. Its password is
read from `ADMIN_INITIAL_PASSWORD` in the backend `.env`, which is not committed.

Be aware that running this seeder currently resets that administrator's password
to the environment value. Do not run production seeders casually. A future
improvement should create the administrator only when absent or use a dedicated
deployment command.

## PHP syntax used in the controller

```php
public function login(Request $request): JsonResponse
```

- `public` makes the method callable by Laravel routing.
- `Request $request` is dependency injection with a type declaration.
- `: JsonResponse` declares the return type.

```php
Auth::attempt(...)
```

`::` calls a static-style facade method. Laravel's facade resolves the real
authentication service behind the scenes.

```php
['username' => 'value']
```

This is a PHP associative array, comparable to a JavaScript object.

```php
if (! $authenticated)
```

`!` means logical NOT. The spacing follows Laravel's Pint style.

```php
$this->userData($request)
```

`$this` refers to the current controller object, and `->` accesses an instance
method or property.

## Environment configuration

Frontend `.env`:

```dotenv
VITE_API_URL=http://localhost:8000
```

Important backend `.env` values:

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DRIVER=database
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
```

Production must use HTTPS, production domains, and:

```dotenv
SESSION_SECURE_COOKIE=true
APP_DEBUG=false
```

After changing backend environment configuration, run:

```powershell
php artisan optimize:clear
```

## Expected status codes

| Status | Meaning in this flow |
| --- | --- |
| 200 | Login, current-user request, or logout succeeded |
| 401 | No valid authenticated session |
| 419 | CSRF token/session problem |
| 422 | Invalid input or invalid credentials |
| 429 | Too many login attempts |
| 500 | Unexpected backend error; inspect Laravel logs |

## Security audit

Implemented correctly:

- Password hashing through the model cast
- Session ID regeneration after login
- Session invalidation and CSRF regeneration on logout
- Cookie-based Sanctum authentication
- Credentialed CORS restricted to the configured frontend origin
- Login throttling
- Active-account check
- Explicit safe user response fields
- Backend authentication middleware on `/api/user` and `/api/logout`

Still required before production:

1. Replace the hardcoded forgot-password modal. It currently uses a hardcoded
   email/OTP and writes a plaintext test password to localStorage.
2. Add Laravel authorization policies or role middleware to every future data
   endpoint. React role checks alone are not security.
3. Add dedicated feature tests for login success, bad credentials, inactive
   users, session restoration, logout, CSRF, and throttling.
4. Change the seeded administrator password and adjust the production seeding
   strategy so routine seeding cannot reset it.
5. Use HTTPS and secure cookies in production.
6. Decide and enforce the canonical role names shared by Laravel and React.

## Local verification checklist

Run Laravel:

```powershell
cd backend
php artisan serve --host=localhost --port=8000
```

Run React in another terminal:

```powershell
npm run dev
```

Then verify:

1. Bad credentials produce a generic error.
2. Correct credentials open the dashboard.
3. Refreshing the dashboard preserves authentication.
4. `/api/user` returns HTTP 401 after logout.
5. Navigating to `/dashboard` after logout redirects to `/login`.
6. An account with `is_active = false` cannot log in.

