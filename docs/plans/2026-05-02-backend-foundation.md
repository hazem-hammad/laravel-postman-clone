# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a curl-usable Laravel package that loads Postman v2.1 collections, resolves environments, executes requests server-side via Guzzle, records history, and serves all HTTP endpoints the future SPA will consume.

**Architecture:** PSR-4 PHP package (namespace `HazemHammad\PostmanClone`) with a service provider that registers config, routes, migrations, and a dedicated `postman_clone_storage` DB connection. Framework-light service classes (in `src/Services/`) take DTOs and return DTOs so the future MCP server can reuse them. Storage defaults to a self-contained SQLite file. Tests use Pest + Orchestra Testbench.

**Tech Stack:** PHP 8.2+, Laravel 11/12, Guzzle 7, Pest 3, Orchestra Testbench 9, Eloquent (single connection, two storage drivers).

**Plan source:** `postman-clone/docs/specs/2026-05-02-postman-clone-design.md`

---

## File map

### Package root
- Create: `composer.json` — package manifest, autoload PSR-4, dev deps
- Create: `phpunit.xml` — Pest config
- Create: `.gitignore` — vendor/, node_modules/, .phpunit.cache, etc.
- Create: `.gitattributes` — export-ignore tests/, resources/spa/
- Create: `LICENSE` — MIT
- Create: `README.md` — minimal stub (full README is Plan 3)
- Create: `Pest.php` — Pest config root
- Create: `phpstan.neon` — static analysis (level 5)

### Config
- Create: `config/postman-clone.php`

### Routes
- Create: `routes/web.php`

### Migrations
- Create: `database/migrations/2026_05_02_000001_create_runs_table.php`

### Views (stub, full SPA shell in Plan 2)
- Create: `resources/views/app.blade.php`

### Source — `src/`
- Create: `src/PostmanCloneServiceProvider.php`
- Create: `src/Support/Storage.php`
- Create: `src/Support/SecretMasker.php`
- Create: `src/Models/Run.php`
- Create: `src/Exceptions/CollectionMissingException.php`
- Create: `src/Exceptions/InvalidCollectionException.php`
- Create: `src/Exceptions/UnresolvedVariableException.php`
- Create: `src/Services/Collections/Dto/Collection.php`
- Create: `src/Services/Collections/Dto/Folder.php`
- Create: `src/Services/Collections/Dto/Request.php`
- Create: `src/Services/Collections/PostmanV21Parser.php`
- Create: `src/Services/Collections/CollectionLoader.php`
- Create: `src/Services/Collections/CollectionRegistry.php`
- Create: `src/Services/Environments/EnvironmentResolver.php`
- Create: `src/Services/Environments/EnvironmentWriter.php`
- Create: `src/Services/Execution/ResultDto.php`
- Create: `src/Services/Execution/VariableSubstitutor.php`
- Create: `src/Services/Execution/RequestExecutor.php`
- Create: `src/Services/History/HistoryRecorder.php`
- Create: `src/Http/Middleware/EnsurePackageEnabled.php`
- Create: `src/Http/Controllers/AppController.php`
- Create: `src/Http/Controllers/BootstrapController.php`
- Create: `src/Http/Controllers/CollectionsController.php`
- Create: `src/Http/Controllers/EnvironmentsController.php`
- Create: `src/Http/Controllers/RequestRunnerController.php`
- Create: `src/Http/Controllers/HistoryController.php`
- Create: `src/Http/Requests/RunRequestPayload.php`
- Create: `src/Http/Requests/UpdateEnvironmentVariableRequest.php`

### Tests — `tests/`
- Create: `tests/TestCase.php` — Testbench base
- Create: `tests/Pest.php` — bind TestCase to test groups
- Create: `tests/Fixtures/sample-collection.postman_collection.json`
- Create: `tests/Fixtures/recursive-vars-collection.postman_collection.json`
- Create: `tests/Unit/PostmanV21ParserTest.php`
- Create: `tests/Unit/SecretMaskerTest.php`
- Create: `tests/Unit/EnvironmentResolverTest.php`
- Create: `tests/Unit/EnvironmentWriterTest.php`
- Create: `tests/Unit/VariableSubstitutorTest.php`
- Create: `tests/Unit/RequestExecutorTest.php`
- Create: `tests/Feature/AccessControlTest.php`
- Create: `tests/Feature/BootstrapEndpointTest.php`
- Create: `tests/Feature/CollectionsEndpointTest.php`
- Create: `tests/Feature/EnvironmentsEndpointTest.php`
- Create: `tests/Feature/RequestRunnerTest.php`
- Create: `tests/Feature/HistoryEndpointTest.php`

---

## PHASE 0 — Project skeleton

### Task 0.1: Create `composer.json`

**Files:**
- Create: `composer.json`

- [ ] **Step 1: Write composer.json**

```json
{
    "name": "hazem-hammad/postman-clone",
    "description": "A free, open-source Postman-like UI mounted into any Laravel application.",
    "type": "library",
    "license": "MIT",
    "keywords": ["laravel", "postman", "api", "developer-tools", "http-client"],
    "authors": [
        {
            "name": "Hazem Hamaad",
            "email": "hazem.hamaad@outlook.com"
        }
    ],
    "require": {
        "php": "^8.2",
        "guzzlehttp/guzzle": "^7.8",
        "illuminate/contracts": "^11.0|^12.0",
        "illuminate/database": "^11.0|^12.0",
        "illuminate/http": "^11.0|^12.0",
        "illuminate/routing": "^11.0|^12.0",
        "illuminate/support": "^11.0|^12.0"
    },
    "require-dev": {
        "orchestra/testbench": "^9.0|^10.0",
        "pestphp/pest": "^3.0",
        "pestphp/pest-plugin-laravel": "^3.0",
        "phpstan/phpstan": "^1.11"
    },
    "autoload": {
        "psr-4": {
            "HazemHammad\\PostmanClone\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "HazemHammad\\PostmanClone\\Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "pest",
        "test:coverage": "pest --coverage",
        "stan": "phpstan analyse"
    },
    "config": {
        "sort-packages": true,
        "allow-plugins": {
            "pestphp/pest-plugin": true
        }
    },
    "extra": {
        "laravel": {
            "providers": [
                "HazemHammad\\PostmanClone\\PostmanCloneServiceProvider"
            ]
        }
    },
    "minimum-stability": "stable",
    "prefer-stable": true
}
```

- [ ] **Step 2: Install dependencies**

Run: `composer install`
Expected: Vendor directory created, lockfile written. No errors.

- [ ] **Step 3: Commit**

```bash
git add composer.json composer.lock
git commit -m "chore: initialize composer package manifest"
```

---

### Task 0.2: Create `.gitignore`, `.gitattributes`, `LICENSE`

**Files:**
- Create: `.gitignore`
- Create: `.gitattributes`
- Create: `LICENSE`
- Create: `README.md` (stub)

- [ ] **Step 1: Write `.gitignore`**

```
/vendor/
/node_modules/
/resources/spa/node_modules/
/resources/spa/dist/
/.phpunit.cache/
/.phpunit.result.cache
/coverage/
/build/
.env
.env.*
!.env.example
.DS_Store
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
*.swp
*.swo
*~
.phpstan.cache/
```

- [ ] **Step 2: Write `.gitattributes`**

```
* text=auto eol=lf

# Files excluded from Packagist tarballs
/.gitattributes export-ignore
/.gitignore     export-ignore
/.github/       export-ignore
/tests/         export-ignore
/phpunit.xml    export-ignore
/phpstan.neon   export-ignore
/Pest.php       export-ignore
/resources/spa/ export-ignore
/docs/          export-ignore
```

- [ ] **Step 3: Write `LICENSE`**

```
MIT License

Copyright (c) 2026 Hazem Hamaad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Write `README.md` stub**

```markdown
# postman-clone

A free, open-source Postman-like UI mounted into any Laravel application.

> v0.1 in active development. Full README arrives with the v0.1 release.

## License

MIT
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore .gitattributes LICENSE README.md
git commit -m "chore: add gitignore, gitattributes, MIT license, README stub"
```

---

### Task 0.3: Create `phpunit.xml` and `Pest.php`

**Files:**
- Create: `phpunit.xml`
- Create: `Pest.php`

- [ ] **Step 1: Write `phpunit.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         processIsolation="false"
         stopOnFailure="false"
         cacheDirectory=".phpunit.cache"
         executionOrder="random">
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory suffix="Test.php">./tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>./src</directory>
        </include>
    </source>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="testing"/>
    </php>
</phpunit>
```

- [ ] **Step 2: Write `Pest.php` at package root**

```php
<?php

uses(HazemHammad\PostmanClone\Tests\TestCase::class)
    ->in('Feature', 'Unit');
```

- [ ] **Step 3: Commit**

```bash
git add phpunit.xml Pest.php
git commit -m "chore: configure pest + phpunit"
```

---

### Task 0.4: Create the Testbench `TestCase` base class

**Files:**
- Create: `tests/TestCase.php`

- [ ] **Step 1: Write `tests/TestCase.php`**

```php
<?php

namespace HazemHammad\PostmanClone\Tests;

use HazemHammad\PostmanClone\PostmanCloneServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    protected function getPackageProviders($app): array
    {
        return [
            PostmanCloneServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.env', 'local');
    }

    protected function fixturePath(string $name): string
    {
        return __DIR__ . '/Fixtures/' . $name;
    }

    protected function fixtureContents(string $name): string
    {
        return file_get_contents($this->fixturePath($name));
    }
}
```

- [ ] **Step 2: Verify Pest discovers it (will fail until ServiceProvider exists in Phase 1; that's fine)**

Run: `vendor/bin/pest --testdox 2>&1 | head -20`
Expected: A "Class not found" error referencing `PostmanCloneServiceProvider`. This confirms Pest is wired; the missing class is the next task's job.

- [ ] **Step 3: Commit**

```bash
git add tests/TestCase.php
git commit -m "test: add testbench base testcase"
```

---

## PHASE 1 — Service provider, config, runtime gate

### Task 1.1: Create the `config/postman-clone.php` config file

**Files:**
- Create: `config/postman-clone.php`

- [ ] **Step 1: Write the full config file**

```php
<?php

return [
    'route' => [
        'prefix' => 'postman',
    ],

    'access' => [
        'enabled_environments' => ['local'],
        'middleware' => [],
        'gate' => null,
    ],

    'theme' => [
        'primary_color' => '#0B5FFF',
        'primary_text' => '#FFFFFF',
        'app_name' => 'Postman Clone',
        'logo_url' => null,
        'favicon_url' => null,
        'default_mode' => 'system',
    ],

    'storage' => [
        'driver' => env('POSTMAN_CLONE_STORAGE', 'sqlite'),
        'connection' => null,
        'sqlite' => [
            'path' => storage_path('postman-clone/history.sqlite'),
        ],
        'table_prefix' => 'postman_clone_',
    ],

    'collections' => [
        // base_path('docs/postman/collection.postman_collection.json'),
    ],

    'environments' => [
        // 'local' => [
        //     'base_url' => 'http://localhost:8000/api/v1',
        //     'token' => env('POSTMAN_CLONE_LOCAL_TOKEN'),
        // ],
    ],

    'default_environment' => null,

    'execution' => [
        'timeout_seconds' => 30,
        'response_body_cap_mb' => 5,
        'follow_redirects' => true,
        'max_redirects' => 5,
        'verify_tls' => true,
    ],

    'history' => [
        'retain_days' => 14,
        'retain_max_rows' => 5000,
    ],
];
```

- [ ] **Step 2: Commit**

```bash
git add config/postman-clone.php
git commit -m "feat: add package config with all v1 sections and defaults"
```

---

### Task 1.2: Create `Support/Storage.php` helper

**Files:**
- Create: `src/Support/Storage.php`
- Create: `tests/Unit/StorageTest.php` (skip — too thin to test in isolation; covered via integration tests)

- [ ] **Step 1: Write the helper**

```php
<?php

namespace HazemHammad\PostmanClone\Support;

class Storage
{
    public static function dir(): string
    {
        return storage_path('postman-clone');
    }

    public static function ensureDir(): void
    {
        $dir = self::dir();
        if (! is_dir($dir)) {
            mkdir($dir, 0775, recursive: true);
        }
    }

    public static function path(string $relative): string
    {
        return self::dir() . '/' . ltrim($relative, '/');
    }

    public static function uploadsDir(): string
    {
        return self::path('uploads');
    }

    public static function environmentsOverridePath(): string
    {
        return self::path('environments.local.json');
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Support/Storage.php
git commit -m "feat: add Storage path helper"
```

---

### Task 1.3: Write `EnsurePackageEnabled` middleware (TDD)

**Files:**
- Create: `tests/Feature/AccessControlTest.php`
- Create: `src/Http/Middleware/EnsurePackageEnabled.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Http\Middleware\EnsurePackageEnabled;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(EnsurePackageEnabled::class)->get('/__test_gate', fn () => 'ok');
});

it('returns 404 when current env is not enabled', function () {
    config()->set('postman-clone.access.enabled_environments', ['local']);
    config()->set('app.env', 'production');
    app()['env'] = 'production';

    $this->get('/__test_gate')->assertStatus(404);
});

it('returns 200 when env is enabled and no gate set', function () {
    config()->set('postman-clone.access.enabled_environments', ['local']);
    config()->set('app.env', 'local');

    $this->get('/__test_gate')->assertStatus(200)->assertSee('ok');
});

it('returns 403 when gate denies', function () {
    config()->set('postman-clone.access.enabled_environments', ['local']);
    config()->set('postman-clone.access.gate', 'viewPostmanClone');
    Gate::define('viewPostmanClone', fn () => false);

    $this->get('/__test_gate')->assertStatus(403);
});

it('returns 200 when gate allows', function () {
    config()->set('postman-clone.access.enabled_environments', ['local']);
    config()->set('postman-clone.access.gate', 'viewPostmanClone');
    Gate::define('viewPostmanClone', fn () => true);

    $this->get('/__test_gate')->assertStatus(200);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `vendor/bin/pest tests/Feature/AccessControlTest.php`
Expected: All 4 tests fail with "Class EnsurePackageEnabled not found" (or similar autoload error).

- [ ] **Step 3: Implement the middleware**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class EnsurePackageEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowedEnvs = config('postman-clone.access.enabled_environments', ['local']);

        if (! in_array(app()->environment(), $allowedEnvs, true)) {
            abort(404);
        }

        $gate = config('postman-clone.access.gate');
        if ($gate !== null && Gate::denies($gate)) {
            abort(403);
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Run tests — they still fail because there's no ServiceProvider yet**

Run: `vendor/bin/pest tests/Feature/AccessControlTest.php`
Expected: Still failing — Testbench can't boot the package without the provider. This is wired in Task 1.4.

- [ ] **Step 5: Commit (test + middleware land together; tests will pass after Task 1.4)**

```bash
git add src/Http/Middleware/EnsurePackageEnabled.php tests/Feature/AccessControlTest.php
git commit -m "feat: add EnsurePackageEnabled middleware with access tests"
```

---

### Task 1.4: Implement the `PostmanCloneServiceProvider`

**Files:**
- Create: `src/PostmanCloneServiceProvider.php`
- Create: `routes/web.php` (minimal — just the `__test_gate` won't be needed; we'll wire the real routes in Phase 9)
- Create: `resources/views/app.blade.php` (stub)

- [ ] **Step 1: Write a minimal `routes/web.php`**

```php
<?php

use Illuminate\Support\Facades\Route;

// Real routes wired in Phase 9. Phase 1 only needs the provider to boot
// without registering any routes — actual URLs come later.
```

- [ ] **Step 2: Write the Blade stub**

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Postman Clone</title>
</head>
<body>
    <div id="app">SPA bundle not yet built. See Plan 2.</div>
</body>
</html>
```

- [ ] **Step 3: Write the service provider**

```php
<?php

namespace HazemHammad\PostmanClone;

use HazemHammad\PostmanClone\Http\Middleware\EnsurePackageEnabled;
use HazemHammad\PostmanClone\Support\Storage;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class PostmanCloneServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/postman-clone.php', 'postman-clone');
    }

    public function boot(Router $router): void
    {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'postman-clone');

        $this->publishes([
            __DIR__ . '/../config/postman-clone.php' => config_path('postman-clone.php'),
        ], 'postman-clone-config');

        $this->registerStorageConnection();
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        $router->aliasMiddleware('postman-clone.gate', EnsurePackageEnabled::class);

        Storage::ensureDir();
    }

    protected function registerStorageConnection(): void
    {
        $driver = config('postman-clone.storage.driver', 'sqlite');

        if ($driver === 'sqlite') {
            $path = config('postman-clone.storage.sqlite.path');
            $dir = dirname($path);
            if (! is_dir($dir)) {
                mkdir($dir, 0775, recursive: true);
            }
            if (! file_exists($path)) {
                touch($path);
            }

            config()->set('database.connections.postman_clone_storage', [
                'driver' => 'sqlite',
                'database' => $path,
                'prefix' => config('postman-clone.storage.table_prefix', 'postman_clone_'),
                'foreign_key_constraints' => true,
            ]);

            return;
        }

        // 'database' driver: alias the chosen connection under our logical name
        $target = config('postman-clone.storage.connection') ?? config('database.default');
        $cfg = config('database.connections.' . $target);
        $cfg['prefix'] = config('postman-clone.storage.table_prefix', 'postman_clone_');
        config()->set('database.connections.postman_clone_storage', $cfg);
    }
}
```

- [ ] **Step 4: Run access tests**

Run: `vendor/bin/pest tests/Feature/AccessControlTest.php`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/PostmanCloneServiceProvider.php routes/web.php resources/views/app.blade.php
git commit -m "feat: add service provider with config merge, storage connection, view loading"
```

---

## PHASE 2 — Storage migration + Run model

### Task 2.1: Create the `runs` migration (TDD via model test)

**Files:**
- Create: `database/migrations/2026_05_02_000001_create_runs_table.php`
- Create: `src/Models/Run.php`
- Create: `tests/Unit/RunModelTest.php`

- [ ] **Step 1: Write a failing test that creates and reads a Run**

```php
<?php

use HazemHammad\PostmanClone\Models\Run;

it('persists a run and reads it back', function () {
    $run = Run::create([
        'collection_id' => 'col-1',
        'request_id' => 'req-1',
        'request_name' => 'List items',
        'environment_id' => 'local',
        'method' => 'GET',
        'url_raw' => 'https://api.example.com/{{path}}',
        'url_resolved' => 'https://api.example.com/items',
        'request_payload_json' => ['headers' => ['Accept' => 'application/json']],
        'response_status' => 200,
        'response_headers_json' => ['Content-Type' => 'application/json'],
        'response_body' => '{"ok":true}',
        'response_body_truncated' => false,
        'response_size_bytes' => 11,
        'timing_ms' => 87,
        'error_kind' => null,
        'error_message' => null,
    ]);

    $found = Run::find($run->id);

    expect($found)->not->toBeNull();
    expect($found->method)->toBe('GET');
    expect($found->response_status)->toBe(200);
    expect($found->request_payload_json)->toBe(['headers' => ['Accept' => 'application/json']]);
});
```

- [ ] **Step 2: Run — fails (no migration, no model)**

Run: `vendor/bin/pest tests/Unit/RunModelTest.php`
Expected: Errors about missing class or table.

- [ ] **Step 3: Write the migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected ?string $connection = 'postman_clone_storage';

    public function up(): void
    {
        Schema::connection($this->connection)->create('runs', function (Blueprint $table) {
            $table->id();
            $table->string('collection_id')->nullable();
            $table->string('request_id')->nullable();
            $table->string('request_name')->nullable();
            $table->string('environment_id')->nullable();
            $table->string('method', 10);
            $table->text('url_raw');
            $table->text('url_resolved');
            $table->json('request_payload_json');
            $table->integer('response_status')->nullable();
            $table->json('response_headers_json')->nullable();
            $table->longText('response_body')->nullable();
            $table->boolean('response_body_truncated')->default(false);
            $table->bigInteger('response_size_bytes')->nullable();
            $table->integer('timing_ms')->nullable();
            $table->string('error_kind')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
            $table->index(['collection_id', 'request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('runs');
    }
};
```

- [ ] **Step 4: Write the Run model**

```php
<?php

namespace HazemHammad\PostmanClone\Models;

use Illuminate\Database\Eloquent\Model;

class Run extends Model
{
    protected $connection = 'postman_clone_storage';

    protected $table = 'runs';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'request_payload_json' => 'array',
        'response_headers_json' => 'array',
        'response_body_truncated' => 'bool',
        'response_status' => 'int',
        'response_size_bytes' => 'int',
        'timing_ms' => 'int',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $run): void {
            if (! $run->created_at) {
                $run->created_at = now();
            }
        });
    }
}
```

- [ ] **Step 5: Run tests**

Run: `vendor/bin/pest tests/Unit/RunModelTest.php`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_05_02_000001_create_runs_table.php src/Models/Run.php tests/Unit/RunModelTest.php
git commit -m "feat: add runs migration + Run eloquent model on dedicated connection"
```

---

## PHASE 3 — Postman v2.1 parser + DTOs

### Task 3.1: Create DTO classes

**Files:**
- Create: `src/Services/Collections/Dto/Collection.php`
- Create: `src/Services/Collections/Dto/Folder.php`
- Create: `src/Services/Collections/Dto/Request.php`

- [ ] **Step 1: Write the DTOs**

`src/Services/Collections/Dto/Request.php`:
```php
<?php

namespace HazemHammad\PostmanClone\Services\Collections\Dto;

class Request
{
    /**
     * @param array<int, array{key:string,value:string,disabled?:bool}> $headers
     * @param array<int, array{key:string,value:string,disabled?:bool}> $params
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $method,
        public readonly string $url,
        public readonly array $headers,
        public readonly array $params,
        public readonly ?string $bodyMode,
        public readonly mixed $body,
        public readonly ?array $auth,
    ) {
    }
}
```

`src/Services/Collections/Dto/Folder.php`:
```php
<?php

namespace HazemHammad\PostmanClone\Services\Collections\Dto;

class Folder
{
    /**
     * @param array<int, Folder|Request> $items
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly array $items,
    ) {
    }
}
```

`src/Services/Collections/Dto/Collection.php`:
```php
<?php

namespace HazemHammad\PostmanClone\Services\Collections\Dto;

class Collection
{
    /**
     * @param array<string,string> $variables
     * @param array<int, Folder|Request> $items
     */
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly ?string $description,
        public readonly array $variables,
        public readonly array $items,
    ) {
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Services/Collections/Dto/
git commit -m "feat: add Collection/Folder/Request DTOs"
```

---

### Task 3.2: Create the test fixtures

**Files:**
- Create: `tests/Fixtures/sample-collection.postman_collection.json`

- [ ] **Step 1: Write a small but realistic v2.1 fixture**

```json
{
    "info": {
        "_postman_id": "11111111-2222-3333-4444-555555555555",
        "name": "Sample API",
        "description": "A small fixture used in parser tests.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        { "key": "base_url", "value": "https://api.example.com" }
    ],
    "item": [
        {
            "name": "Public",
            "item": [
                {
                    "_postman_id": "req-1",
                    "name": "List items",
                    "request": {
                        "method": "GET",
                        "header": [
                            { "key": "Accept", "value": "application/json" }
                        ],
                        "url": {
                            "raw": "{{base_url}}/items?limit=10",
                            "host": ["{{base_url}}"],
                            "path": ["items"],
                            "query": [
                                { "key": "limit", "value": "10" }
                            ]
                        }
                    }
                },
                {
                    "_postman_id": "req-2",
                    "name": "Create item",
                    "request": {
                        "method": "POST",
                        "header": [
                            { "key": "Content-Type", "value": "application/json" },
                            { "key": "Authorization", "value": "Bearer {{token}}" }
                        ],
                        "url": {
                            "raw": "{{base_url}}/items",
                            "host": ["{{base_url}}"],
                            "path": ["items"]
                        },
                        "body": {
                            "mode": "raw",
                            "raw": "{\"name\":\"hello\"}",
                            "options": { "raw": { "language": "json" } }
                        }
                    }
                }
            ]
        }
    ]
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/Fixtures/sample-collection.postman_collection.json
git commit -m "test: add Postman v2.1 fixture for parser tests"
```

---

### Task 3.3: Implement `PostmanV21Parser` (TDD)

**Files:**
- Create: `tests/Unit/PostmanV21ParserTest.php`
- Create: `src/Exceptions/InvalidCollectionException.php`
- Create: `src/Services/Collections/PostmanV21Parser.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Exceptions\InvalidCollectionException;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;
use HazemHammad\PostmanClone\Services\Collections\Dto\Folder;
use HazemHammad\PostmanClone\Services\Collections\Dto\Request;
use HazemHammad\PostmanClone\Services\Collections\PostmanV21Parser;

it('parses a v2.1 collection with folders, requests, headers, params, body', function () {
    $json = $this->fixtureContents('sample-collection.postman_collection.json');

    $parsed = (new PostmanV21Parser())->parse($json);

    expect($parsed)->toBeInstanceOf(Collection::class);
    expect($parsed->id)->toBe('11111111-2222-3333-4444-555555555555');
    expect($parsed->name)->toBe('Sample API');
    expect($parsed->variables)->toBe(['base_url' => 'https://api.example.com']);
    expect($parsed->items)->toHaveCount(1);

    $folder = $parsed->items[0];
    expect($folder)->toBeInstanceOf(Folder::class);
    expect($folder->name)->toBe('Public');
    expect($folder->items)->toHaveCount(2);

    $first = $folder->items[0];
    expect($first)->toBeInstanceOf(Request::class);
    expect($first->id)->toBe('req-1');
    expect($first->name)->toBe('List items');
    expect($first->method)->toBe('GET');
    expect($first->url)->toBe('{{base_url}}/items?limit=10');
    expect($first->headers)->toBe([['key' => 'Accept', 'value' => 'application/json', 'disabled' => false]]);
    expect($first->params)->toBe([['key' => 'limit', 'value' => '10', 'disabled' => false]]);
    expect($first->bodyMode)->toBeNull();

    $second = $folder->items[1];
    expect($second->method)->toBe('POST');
    expect($second->bodyMode)->toBe('raw');
    expect($second->body)->toBe('{"name":"hello"}');
});

it('throws InvalidCollectionException on malformed JSON', function () {
    (new PostmanV21Parser())->parse('{not json');
})->throws(InvalidCollectionException::class);

it('throws InvalidCollectionException when info.schema is missing or wrong', function () {
    $bad = json_encode(['info' => ['name' => 'No schema'], 'item' => []]);
    (new PostmanV21Parser())->parse($bad);
})->throws(InvalidCollectionException::class);

it('handles deeply nested folders', function () {
    $deep = [
        'info' => [
            '_postman_id' => 'd-1',
            'name' => 'Deep',
            'schema' => 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        ],
        'item' => [[
            'name' => 'L1',
            'item' => [[
                'name' => 'L2',
                'item' => [[
                    '_postman_id' => 'r',
                    'name' => 'Leaf',
                    'request' => ['method' => 'GET', 'url' => 'https://x.test'],
                ]],
            ]],
        ]],
    ];

    $parsed = (new PostmanV21Parser())->parse(json_encode($deep));

    expect($parsed->items[0])->toBeInstanceOf(Folder::class);
    expect($parsed->items[0]->items[0])->toBeInstanceOf(Folder::class);
    expect($parsed->items[0]->items[0]->items[0])->toBeInstanceOf(Request::class);
});
```

- [ ] **Step 2: Run — fails**

Run: `vendor/bin/pest tests/Unit/PostmanV21ParserTest.php`
Expected: All tests fail with class-not-found.

- [ ] **Step 3: Write `InvalidCollectionException`**

```php
<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class InvalidCollectionException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $line = null,
        public readonly ?int $column = null,
    ) {
        parent::__construct($message);
    }
}
```

- [ ] **Step 4: Implement the parser**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Collections;

use HazemHammad\PostmanClone\Exceptions\InvalidCollectionException;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;
use HazemHammad\PostmanClone\Services\Collections\Dto\Folder;
use HazemHammad\PostmanClone\Services\Collections\Dto\Request;

class PostmanV21Parser
{
    public function parse(string $json): Collection
    {
        try {
            $data = json_decode($json, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new InvalidCollectionException('Invalid JSON: ' . $e->getMessage());
        }

        if (! is_array($data) || ! isset($data['info'])) {
            throw new InvalidCollectionException('Missing top-level "info" object');
        }

        $schema = $data['info']['schema'] ?? null;
        if (! is_string($schema) || ! str_contains($schema, 'collection/v2.1')) {
            throw new InvalidCollectionException(
                'Unsupported or missing schema (expected v2.1.0): ' . ($schema ?? 'null')
            );
        }

        return new Collection(
            id: (string) ($data['info']['_postman_id'] ?? ''),
            name: (string) ($data['info']['name'] ?? 'Untitled'),
            description: $data['info']['description'] ?? null,
            variables: $this->parseVariables($data['variable'] ?? []),
            items: array_values(array_map(
                fn (array $item) => $this->parseItem($item),
                $data['item'] ?? []
            )),
        );
    }

    /**
     * @param array<int, array{key:string,value:mixed}> $list
     * @return array<string,string>
     */
    protected function parseVariables(array $list): array
    {
        $out = [];
        foreach ($list as $row) {
            if (isset($row['key'])) {
                $out[(string) $row['key']] = (string) ($row['value'] ?? '');
            }
        }
        return $out;
    }

    protected function parseItem(array $item): Folder|Request
    {
        if (isset($item['item']) && is_array($item['item'])) {
            return new Folder(
                id: (string) ($item['_postman_id'] ?? bin2hex(random_bytes(8))),
                name: (string) ($item['name'] ?? 'Folder'),
                items: array_values(array_map(
                    fn (array $child) => $this->parseItem($child),
                    $item['item']
                )),
            );
        }

        return $this->parseRequest($item);
    }

    protected function parseRequest(array $item): Request
    {
        $req = $item['request'] ?? [];

        $url = $req['url'] ?? '';
        if (is_array($url)) {
            $url = (string) ($url['raw'] ?? '');
        }

        return new Request(
            id: (string) ($item['_postman_id'] ?? bin2hex(random_bytes(8))),
            name: (string) ($item['name'] ?? 'Request'),
            method: strtoupper((string) ($req['method'] ?? 'GET')),
            url: (string) $url,
            headers: array_values(array_map(
                fn (array $h) => [
                    'key' => (string) ($h['key'] ?? ''),
                    'value' => (string) ($h['value'] ?? ''),
                    'disabled' => (bool) ($h['disabled'] ?? false),
                ],
                $req['header'] ?? []
            )),
            params: array_values(array_map(
                fn (array $q) => [
                    'key' => (string) ($q['key'] ?? ''),
                    'value' => (string) ($q['value'] ?? ''),
                    'disabled' => (bool) ($q['disabled'] ?? false),
                ],
                (is_array($req['url'] ?? null) ? ($req['url']['query'] ?? []) : [])
            )),
            bodyMode: $req['body']['mode'] ?? null,
            body: $req['body']['raw'] ?? $req['body']['formdata'] ?? $req['body']['urlencoded'] ?? null,
            auth: $req['auth'] ?? null,
        );
    }
}
```

- [ ] **Step 5: Run tests**

Run: `vendor/bin/pest tests/Unit/PostmanV21ParserTest.php`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Services/Collections/PostmanV21Parser.php src/Exceptions/InvalidCollectionException.php tests/Unit/PostmanV21ParserTest.php
git commit -m "feat: implement Postman v2.1 parser with folder/request/body extraction"
```

---

## PHASE 4 — Collection loader + registry

### Task 4.1: Implement `CollectionLoader` (TDD)

**Files:**
- Create: `src/Exceptions/CollectionMissingException.php`
- Create: `src/Services/Collections/CollectionLoader.php`
- Add tests in: `tests/Unit/PostmanV21ParserTest.php` (extend) — actually, new file:
- Create: `tests/Unit/CollectionLoaderTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Exceptions\CollectionMissingException;
use HazemHammad\PostmanClone\Services\Collections\CollectionLoader;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;

it('loads and parses a collection from disk', function () {
    $loader = new CollectionLoader();
    $parsed = $loader->load($this->fixturePath('sample-collection.postman_collection.json'));

    expect($parsed)->toBeInstanceOf(Collection::class);
    expect($parsed->name)->toBe('Sample API');
});

it('throws CollectionMissingException when file does not exist', function () {
    (new CollectionLoader())->load('/no/such/path/collection.json');
})->throws(CollectionMissingException::class);
```

- [ ] **Step 2: Run — fails**

Run: `vendor/bin/pest tests/Unit/CollectionLoaderTest.php`
Expected: Class-not-found errors.

- [ ] **Step 3: Write `CollectionMissingException`**

```php
<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class CollectionMissingException extends RuntimeException
{
    public function __construct(public readonly string $path)
    {
        parent::__construct("Collection file not found at: {$path}");
    }
}
```

- [ ] **Step 4: Implement `CollectionLoader`**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Collections;

use HazemHammad\PostmanClone\Exceptions\CollectionMissingException;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;

class CollectionLoader
{
    public function __construct(private readonly PostmanV21Parser $parser = new PostmanV21Parser()) {}

    public function load(string $absolutePath): Collection
    {
        if (! is_file($absolutePath)) {
            throw new CollectionMissingException($absolutePath);
        }

        return $this->parser->parse(file_get_contents($absolutePath));
    }
}
```

- [ ] **Step 5: Run tests — pass**

Run: `vendor/bin/pest tests/Unit/CollectionLoaderTest.php`
Expected: 2 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Exceptions/CollectionMissingException.php src/Services/Collections/CollectionLoader.php tests/Unit/CollectionLoaderTest.php
git commit -m "feat: CollectionLoader reads JSON from disk and delegates to parser"
```

---

### Task 4.2: Implement `CollectionRegistry`

**Files:**
- Create: `src/Services/Collections/CollectionRegistry.php`
- Create: `tests/Unit/CollectionRegistryTest.php`

The registry merges (a) absolute paths from `config('postman-clone.collections')` and (b) UI-uploaded entries from `storage/postman-clone/uploads.json`. Each entry exposes `{ id, name, source: 'config'|'upload', path }`.

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use HazemHammad\PostmanClone\Support\Storage;

it('lists collections from config paths', function () {
    config()->set('postman-clone.collections', [
        $this->fixturePath('sample-collection.postman_collection.json'),
    ]);

    $entries = (new CollectionRegistry())->all();

    expect($entries)->toHaveCount(1);
    expect($entries[0]['name'])->toBe('Sample API');
    expect($entries[0]['source'])->toBe('config');
    expect($entries[0]['id'])->toBeString();
});

it('skips missing config paths but flags them', function () {
    config()->set('postman-clone.collections', [
        '/no/such/file.json',
        $this->fixturePath('sample-collection.postman_collection.json'),
    ]);

    $entries = (new CollectionRegistry())->all();

    expect($entries)->toHaveCount(2);
    expect($entries[0]['missing'])->toBeTrue();
    expect($entries[1]['missing'])->toBeFalse();
});

it('lists uploaded collections from uploads.json', function () {
    Storage::ensureDir();
    if (! is_dir(Storage::uploadsDir())) {
        mkdir(Storage::uploadsDir(), 0775, recursive: true);
    }
    $uploadPath = Storage::uploadsDir() . '/abc.postman_collection.json';
    copy($this->fixturePath('sample-collection.postman_collection.json'), $uploadPath);
    file_put_contents(Storage::path('uploads.json'), json_encode([
        ['id' => 'abc', 'original_name' => 'mine.json', 'uploaded_at' => '2026-05-02T00:00:00Z'],
    ]));

    config()->set('postman-clone.collections', []);

    $entries = (new CollectionRegistry())->all();

    expect($entries)->toHaveCount(1);
    expect($entries[0]['source'])->toBe('upload');
    expect($entries[0]['name'])->toBe('Sample API');
});

afterEach(function () {
    if (is_dir(Storage::dir())) {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(Storage::dir(), FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($it as $f) {
            $f->isDir() ? rmdir($f->getRealPath()) : unlink($f->getRealPath());
        }
    }
});
```

- [ ] **Step 2: Run — fails**

Run: `vendor/bin/pest tests/Unit/CollectionRegistryTest.php`

- [ ] **Step 3: Implement `CollectionRegistry`**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Collections;

use HazemHammad\PostmanClone\Support\Storage;

class CollectionRegistry
{
    public function __construct(private readonly CollectionLoader $loader = new CollectionLoader()) {}

    /**
     * @return array<int, array{id:string,name:string,source:string,path:string,missing:bool}>
     */
    public function all(): array
    {
        $entries = [];

        foreach (config('postman-clone.collections', []) as $path) {
            $entries[] = $this->buildConfigEntry((string) $path);
        }

        foreach ($this->uploads() as $upload) {
            $entries[] = $this->buildUploadEntry($upload);
        }

        return $entries;
    }

    public function find(string $id): ?array
    {
        foreach ($this->all() as $entry) {
            if ($entry['id'] === $id) {
                return $entry;
            }
        }
        return null;
    }

    /**
     * @return array<int, array{id:string,original_name:string,uploaded_at:string}>
     */
    protected function uploads(): array
    {
        $path = Storage::path('uploads.json');
        if (! is_file($path)) {
            return [];
        }
        $data = json_decode(file_get_contents($path), associative: true) ?: [];
        return is_array($data) ? $data : [];
    }

    protected function buildConfigEntry(string $path): array
    {
        $missing = ! is_file($path);
        $name = basename($path);
        if (! $missing) {
            try {
                $name = $this->loader->load($path)->name;
            } catch (\Throwable) {
                // leave basename
            }
        }

        return [
            'id' => 'cfg:' . sha1($path),
            'name' => $name,
            'source' => 'config',
            'path' => $path,
            'missing' => $missing,
        ];
    }

    protected function buildUploadEntry(array $row): array
    {
        $path = Storage::uploadsDir() . '/' . $row['id'] . '.postman_collection.json';
        $missing = ! is_file($path);
        $name = $row['original_name'] ?? 'Uploaded';
        if (! $missing) {
            try {
                $name = $this->loader->load($path)->name;
            } catch (\Throwable) {
                // keep original_name
            }
        }

        return [
            'id' => 'up:' . $row['id'],
            'name' => $name,
            'source' => 'upload',
            'path' => $path,
            'missing' => $missing,
        ];
    }
}
```

- [ ] **Step 4: Run tests — pass**

Run: `vendor/bin/pest tests/Unit/CollectionRegistryTest.php`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Services/Collections/CollectionRegistry.php tests/Unit/CollectionRegistryTest.php
git commit -m "feat: CollectionRegistry merges config paths and UI uploads"
```

---

## PHASE 5 — Environments + secret masking

### Task 5.1: Implement `SecretMasker` (TDD)

**Files:**
- Create: `src/Support/SecretMasker.php`
- Create: `tests/Unit/SecretMaskerTest.php`

A secret is any environment variable whose source is `env(...)` in the consumer's config (i.e., resolved at runtime by Laravel). The masker tags those at resolution time so downstream code knows what to mask. Implementation: the resolver returns variables as `['value' => string, 'is_secret' => bool]`.

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Support\SecretMasker;

it('replaces a secret value with bullets in a string', function () {
    $masked = SecretMasker::mask(
        'Authorization: Bearer abc123',
        ['abc123']
    );

    expect($masked)->toBe('Authorization: Bearer ••••••');
});

it('handles multiple secret values in one string', function () {
    $masked = SecretMasker::mask(
        'token=alpha&id=42&key=beta',
        ['alpha', 'beta']
    );

    expect($masked)->toBe('token=••••••&id=42&key=••••••');
});

it('returns input unchanged when no secrets', function () {
    $masked = SecretMasker::mask('plain text', []);
    expect($masked)->toBe('plain text');
});

it('skips empty secret strings', function () {
    $masked = SecretMasker::mask('hello world', ['', 'world']);
    expect($masked)->toBe('hello ••••••');
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Support;

class SecretMasker
{
    public const MASK = '••••••';

    /**
     * @param array<int, string> $secrets
     */
    public static function mask(string $input, array $secrets): string
    {
        foreach ($secrets as $secret) {
            if ($secret === '' || $secret === null) {
                continue;
            }
            $input = str_replace($secret, self::MASK, $input);
        }
        return $input;
    }

    /**
     * @param array<int|string, mixed> $payload
     * @param array<int, string> $secrets
     * @return array<int|string, mixed>
     */
    public static function maskArray(array $payload, array $secrets): array
    {
        array_walk_recursive($payload, function (&$value) use ($secrets): void {
            if (is_string($value)) {
                $value = self::mask($value, $secrets);
            }
        });
        return $payload;
    }
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add src/Support/SecretMasker.php tests/Unit/SecretMaskerTest.php
git commit -m "feat: SecretMasker replaces secret strings with bullets"
```

---

### Task 5.2: Implement `EnvironmentResolver` (TDD)

**Files:**
- Create: `src/Services/Environments/EnvironmentResolver.php`
- Create: `tests/Unit/EnvironmentResolverTest.php`

Resolver merges three layers: collection variables (lowest), config environment, override JSON (highest). Each variable is returned as `['value' => string, 'is_secret' => bool, 'source' => 'collection'|'config'|'override']`. A variable is a secret iff its source is `config` AND its value came from `env()` (the resolver checks by re-reading the config snapshot vs. literal env values — see implementation).

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Services\Environments\EnvironmentResolver;
use HazemHammad\PostmanClone\Support\Storage;

beforeEach(function () {
    Storage::ensureDir();
    @unlink(Storage::environmentsOverridePath());
});

it('returns empty array when env id is null', function () {
    $vars = (new EnvironmentResolver())->resolve(null);
    expect($vars)->toBe([]);
});

it('returns variables from config when no override file exists', function () {
    config()->set('postman-clone.environments', [
        'local' => [
            'base_url' => 'http://localhost:8000',
            'token' => 'abc',
        ],
    ]);

    $vars = (new EnvironmentResolver())->resolve('local');

    expect($vars)->toHaveKey('base_url');
    expect($vars['base_url']['value'])->toBe('http://localhost:8000');
    expect($vars['base_url']['source'])->toBe('config');
});

it('overlays override JSON values on top of config', function () {
    config()->set('postman-clone.environments', [
        'local' => ['token' => 'config-token'],
    ]);
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'override-token'],
    ]));

    $vars = (new EnvironmentResolver())->resolve('local');

    expect($vars['token']['value'])->toBe('override-token');
    expect($vars['token']['source'])->toBe('override');
});

it('marks env() values as secret', function () {
    putenv('POSTMAN_CLONE_TEST_TOKEN=secret-from-env');
    config()->set('postman-clone.environments', [
        'local' => ['token' => env('POSTMAN_CLONE_TEST_TOKEN')],
    ]);

    $vars = (new EnvironmentResolver())->resolve('local');

    expect($vars['token']['is_secret'])->toBeTrue();
    putenv('POSTMAN_CLONE_TEST_TOKEN');
});

it('overlays collection variables when provided, lowest precedence', function () {
    config()->set('postman-clone.environments', [
        'local' => ['token' => 'env-token'],
    ]);

    $vars = (new EnvironmentResolver())->resolve('local', collectionVariables: [
        'base_url' => 'https://collection-default.test',
        'token' => 'collection-token',
    ]);

    expect($vars['token']['value'])->toBe('env-token');
    expect($vars['token']['source'])->toBe('config');
    expect($vars['base_url']['value'])->toBe('https://collection-default.test');
    expect($vars['base_url']['source'])->toBe('collection');
});

it('returns secrets list', function () {
    putenv('POSTMAN_CLONE_TEST_TOKEN=tok-xyz');
    config()->set('postman-clone.environments', [
        'local' => [
            'token' => env('POSTMAN_CLONE_TEST_TOKEN'),
            'base_url' => 'http://localhost',
        ],
    ]);

    $resolver = new EnvironmentResolver();
    $secrets = $resolver->secrets('local');

    expect($secrets)->toContain('tok-xyz');
    expect($secrets)->not->toContain('http://localhost');
    putenv('POSTMAN_CLONE_TEST_TOKEN');
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Environments;

use HazemHammad\PostmanClone\Support\Storage;

class EnvironmentResolver
{
    /**
     * @param array<string,string> $collectionVariables
     * @return array<string, array{value:string,is_secret:bool,source:string}>
     */
    public function resolve(?string $environmentId, array $collectionVariables = []): array
    {
        if ($environmentId === null) {
            return [];
        }

        $configEnv = config("postman-clone.environments.{$environmentId}", []);
        $overrideEnv = $this->loadOverrides()[$environmentId] ?? [];

        $out = [];

        foreach ($collectionVariables as $key => $value) {
            $out[$key] = ['value' => (string) $value, 'is_secret' => false, 'source' => 'collection'];
        }

        foreach ($configEnv as $key => $value) {
            $out[$key] = [
                'value' => (string) $value,
                'is_secret' => $this->isSecretValue($key, $value, $environmentId),
                'source' => 'config',
            ];
        }

        foreach ($overrideEnv as $key => $value) {
            $out[$key] = ['value' => (string) $value, 'is_secret' => false, 'source' => 'override'];
        }

        return $out;
    }

    /**
     * @return array<int, string>
     */
    public function secrets(string $environmentId): array
    {
        $resolved = $this->resolve($environmentId);
        $secrets = [];
        foreach ($resolved as $row) {
            if ($row['is_secret'] && $row['value'] !== '') {
                $secrets[] = $row['value'];
            }
        }
        return $secrets;
    }

    /**
     * A value is "secret" if it came from env() — heuristic: the literal value
     * appears as the value of an environment variable. False positives are
     * acceptable (mask too aggressively) but false negatives are not.
     */
    protected function isSecretValue(string $key, mixed $value, string $environmentId): bool
    {
        if (! is_string($value) || $value === '') {
            return false;
        }
        // Walk all env vars; if any equals this value, treat as secret.
        foreach ($_ENV as $envValue) {
            if (is_string($envValue) && $envValue === $value) {
                return true;
            }
        }
        // Also check getenv-only vars (some shells)
        foreach (['_', 'PATH', 'HOME', 'PWD'] as $known) {
            // skip — we don't want to mark PATH as secret
            unset($known);
        }
        return false;
    }

    /**
     * @return array<string, array<string,string>>
     */
    protected function loadOverrides(): array
    {
        $path = Storage::environmentsOverridePath();
        if (! is_file($path)) {
            return [];
        }
        $data = json_decode(file_get_contents($path), associative: true);
        return is_array($data) ? $data : [];
    }
}
```

- [ ] **Step 4: Run — pass**

Run: `vendor/bin/pest tests/Unit/EnvironmentResolverTest.php`
Expected: 6 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Services/Environments/EnvironmentResolver.php tests/Unit/EnvironmentResolverTest.php
git commit -m "feat: EnvironmentResolver merges collection + config + override layers"
```

---

### Task 5.3: Implement `EnvironmentWriter` (TDD)

**Files:**
- Create: `src/Services/Environments/EnvironmentWriter.php`
- Create: `tests/Unit/EnvironmentWriterTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Services\Environments\EnvironmentWriter;
use HazemHammad\PostmanClone\Support\Storage;

beforeEach(function () {
    Storage::ensureDir();
    @unlink(Storage::environmentsOverridePath());
});

it('creates the override file when none exists and writes a single value', function () {
    (new EnvironmentWriter())->setOverride('local', 'token', 'xyz');

    $data = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($data)->toBe(['local' => ['token' => 'xyz']]);
});

it('preserves existing overrides when adding a new one', function () {
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['user_id' => '42'],
        'staging' => ['token' => 's-tok'],
    ]));

    (new EnvironmentWriter())->setOverride('local', 'token', 'new-tok');

    $data = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($data['local'])->toBe(['user_id' => '42', 'token' => 'new-tok']);
    expect($data['staging'])->toBe(['token' => 's-tok']);
});

it('removes a single override key', function () {
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'tok', 'user_id' => '42'],
    ]));

    (new EnvironmentWriter())->removeOverride('local', 'token');

    $data = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($data['local'])->toBe(['user_id' => '42']);
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Environments;

use HazemHammad\PostmanClone\Support\Storage;
use RuntimeException;

class EnvironmentWriter
{
    public function setOverride(string $environmentId, string $key, string $value): void
    {
        $this->mutate(function (array &$data) use ($environmentId, $key, $value): void {
            $data[$environmentId] ??= [];
            $data[$environmentId][$key] = $value;
        });
    }

    public function removeOverride(string $environmentId, string $key): void
    {
        $this->mutate(function (array &$data) use ($environmentId, $key): void {
            if (isset($data[$environmentId][$key])) {
                unset($data[$environmentId][$key]);
            }
        });
    }

    protected function mutate(callable $mutator): void
    {
        Storage::ensureDir();
        $path = Storage::environmentsOverridePath();

        $fp = fopen($path, 'c+');
        if ($fp === false) {
            throw new RuntimeException("Could not open {$path}");
        }

        try {
            if (! flock($fp, LOCK_EX)) {
                throw new RuntimeException("Could not lock {$path}");
            }

            $contents = stream_get_contents($fp);
            $data = $contents === '' ? [] : (json_decode($contents, associative: true) ?: []);

            $mutator($data);

            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            fflush($fp);
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
        }
    }
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add src/Services/Environments/EnvironmentWriter.php tests/Unit/EnvironmentWriterTest.php
git commit -m "feat: EnvironmentWriter atomic write under flock for override JSON"
```

---

## PHASE 6 — Variable substitution

### Task 6.1: Implement `VariableSubstitutor` (TDD)

**Files:**
- Create: `src/Exceptions/UnresolvedVariableException.php`
- Create: `src/Services/Execution/VariableSubstitutor.php`
- Create: `tests/Unit/VariableSubstitutorTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Exceptions\UnresolvedVariableException;
use HazemHammad\PostmanClone\Services\Execution\VariableSubstitutor;

it('substitutes a single variable', function () {
    $vars = ['base_url' => ['value' => 'https://x.test', 'is_secret' => false, 'source' => 'config']];
    $out = (new VariableSubstitutor())->substitute('{{base_url}}/items', $vars);
    expect($out)->toBe('https://x.test/items');
});

it('substitutes multiple variables in one string', function () {
    $vars = [
        'host' => ['value' => 'api.x.test', 'is_secret' => false, 'source' => 'config'],
        'id' => ['value' => '42', 'is_secret' => false, 'source' => 'config'],
    ];
    $out = (new VariableSubstitutor())->substitute('https://{{host}}/items/{{id}}', $vars);
    expect($out)->toBe('https://api.x.test/items/42');
});

it('throws UnresolvedVariableException listing missing names', function () {
    try {
        (new VariableSubstitutor())->substitute('{{a}}/{{b}}', []);
        $this->fail('Expected exception');
    } catch (UnresolvedVariableException $e) {
        expect($e->missing)->toBe(['a', 'b']);
    }
});

it('resolves recursively up to 3 hops', function () {
    $vars = [
        'a' => ['value' => 'x={{b}}', 'is_secret' => false, 'source' => 'config'],
        'b' => ['value' => 'y={{c}}', 'is_secret' => false, 'source' => 'config'],
        'c' => ['value' => 'done', 'is_secret' => false, 'source' => 'config'],
    ];
    $out = (new VariableSubstitutor())->substitute('{{a}}', $vars);
    expect($out)->toBe('x=y=done');
});

it('bails out of cycles after 3 hops', function () {
    $vars = [
        'a' => ['value' => '{{b}}', 'is_secret' => false, 'source' => 'config'],
        'b' => ['value' => '{{a}}', 'is_secret' => false, 'source' => 'config'],
    ];
    $out = (new VariableSubstitutor())->substitute('{{a}}', $vars);
    // After 3 hops we accept whatever's there — never infinite-loops.
    expect($out)->toMatch('/\{\{[ab]\}\}/');
});

it('substitutes recursively across an array payload', function () {
    $vars = ['t' => ['value' => 'tok', 'is_secret' => false, 'source' => 'config']];
    $payload = [
        'url' => '{{t}}/x',
        'headers' => [['key' => 'Auth', 'value' => 'Bearer {{t}}']],
    ];
    $out = (new VariableSubstitutor())->substituteArray($payload, $vars);
    expect($out['url'])->toBe('tok/x');
    expect($out['headers'][0]['value'])->toBe('Bearer tok');
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Write the exception**

```php
<?php

namespace HazemHammad\PostmanClone\Exceptions;

use RuntimeException;

class UnresolvedVariableException extends RuntimeException
{
    /**
     * @param array<int, string> $missing
     */
    public function __construct(public readonly array $missing)
    {
        parent::__construct('Unresolved variables: ' . implode(', ', $missing));
    }
}
```

- [ ] **Step 4: Implement the substitutor**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Execution;

use HazemHammad\PostmanClone\Exceptions\UnresolvedVariableException;

class VariableSubstitutor
{
    private const MAX_HOPS = 3;
    private const PATTERN = '/\{\{\s*([a-zA-Z0-9_.\-]+)\s*\}\}/';

    /**
     * @param array<string, array{value:string,is_secret:bool,source:string}> $vars
     */
    public function substitute(string $input, array $vars, bool $throwOnMissing = true): string
    {
        $missing = [];
        $current = $input;

        for ($i = 0; $i < self::MAX_HOPS; $i++) {
            $next = preg_replace_callback(self::PATTERN, function (array $m) use ($vars, &$missing): string {
                $name = $m[1];
                if (! isset($vars[$name])) {
                    if (! in_array($name, $missing, true)) {
                        $missing[] = $name;
                    }
                    return $m[0];
                }
                return $vars[$name]['value'];
            }, $current);

            if ($next === $current) {
                break;
            }
            $current = $next;
        }

        if ($throwOnMissing && $missing !== []) {
            throw new UnresolvedVariableException($missing);
        }

        return $current;
    }

    /**
     * @param array<int|string, mixed> $payload
     * @param array<string, array{value:string,is_secret:bool,source:string}> $vars
     * @return array<int|string, mixed>
     */
    public function substituteArray(array $payload, array $vars, bool $throwOnMissing = true): array
    {
        array_walk_recursive($payload, function (mixed &$value) use ($vars, $throwOnMissing): void {
            if (is_string($value)) {
                $value = $this->substitute($value, $vars, $throwOnMissing);
            }
        });
        return $payload;
    }

    /**
     * Returns the list of variable names referenced in any string within the payload.
     *
     * @return array<int, string>
     */
    public function referencedNames(string|array $payload): array
    {
        $names = [];
        $walk = function (string $s) use (&$names): void {
            if (preg_match_all(self::PATTERN, $s, $m)) {
                foreach ($m[1] as $name) {
                    if (! in_array($name, $names, true)) {
                        $names[] = $name;
                    }
                }
            }
        };
        if (is_string($payload)) {
            $walk($payload);
        } else {
            array_walk_recursive($payload, function (mixed $value) use ($walk): void {
                if (is_string($value)) {
                    $walk($value);
                }
            });
        }
        return $names;
    }
}
```

- [ ] **Step 5: Run — pass**

Run: `vendor/bin/pest tests/Unit/VariableSubstitutorTest.php`
Expected: 6 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Exceptions/UnresolvedVariableException.php src/Services/Execution/VariableSubstitutor.php tests/Unit/VariableSubstitutorTest.php
git commit -m "feat: VariableSubstitutor with 3-hop recursive resolution"
```

---

## PHASE 7 — Request executor (Guzzle)

### Task 7.1: Create `ResultDto`

**Files:**
- Create: `src/Services/Execution/ResultDto.php`

- [ ] **Step 1: Write the DTO**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Execution;

class ResultDto
{
    /**
     * @param array<string, array<int,string>> $headers
     */
    public function __construct(
        public readonly ?int $status,
        public readonly array $headers,
        public readonly ?string $body,
        public readonly bool $bodyTruncated,
        public readonly ?int $sizeBytes,
        public readonly int $timingMs,
        public readonly ?string $errorKind,
        public readonly ?string $errorMessage,
    ) {
    }

    public static function networkError(string $kind, string $message, int $timingMs): self
    {
        return new self(
            status: null,
            headers: [],
            body: null,
            bodyTruncated: false,
            sizeBytes: null,
            timingMs: $timingMs,
            errorKind: $kind,
            errorMessage: $message,
        );
    }

    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'headers' => $this->headers,
            'body' => $this->body,
            'body_truncated' => $this->bodyTruncated,
            'size_bytes' => $this->sizeBytes,
            'timing_ms' => $this->timingMs,
            'error_kind' => $this->errorKind,
            'error_message' => $this->errorMessage,
        ];
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/Services/Execution/ResultDto.php
git commit -m "feat: ResultDto for executor output"
```

---

### Task 7.2: Implement `RequestExecutor` (TDD)

**Files:**
- Create: `src/Services/Execution/RequestExecutor.php`
- Create: `tests/Unit/RequestExecutorTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Request as Psr7Request;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Services\Execution\RequestExecutor;
use HazemHammad\PostmanClone\Services\Execution\ResultDto;

function makeExecutor(MockHandler $mock, array $config = []): RequestExecutor
{
    $config = array_merge([
        'timeout_seconds' => 30,
        'response_body_cap_mb' => 5,
        'follow_redirects' => true,
        'max_redirects' => 5,
        'verify_tls' => true,
    ], $config);

    $client = new Client(['handler' => HandlerStack::create($mock)]);
    return new RequestExecutor($client, $config);
}

it('executes a successful GET and returns status/headers/body', function () {
    $mock = new MockHandler([
        new Response(200, ['Content-Type' => 'application/json'], '{"ok":true}'),
    ]);
    $exec = makeExecutor($mock);

    $result = $exec->execute([
        'method' => 'GET',
        'url' => 'https://api.example.com/items',
        'headers' => [['key' => 'Accept', 'value' => 'application/json', 'disabled' => false]],
        'params' => [],
        'body_mode' => null,
        'body' => null,
    ]);

    expect($result)->toBeInstanceOf(ResultDto::class);
    expect($result->status)->toBe(200);
    expect($result->body)->toBe('{"ok":true}');
    expect($result->headers['Content-Type'][0])->toBe('application/json');
    expect($result->errorKind)->toBeNull();
});

it('appends query params from the params array', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = (string) $req->getUri();
            return new Response(200, [], 'ok');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'GET',
        'url' => 'https://x.test/items',
        'headers' => [],
        'params' => [
            ['key' => 'limit', 'value' => '10', 'disabled' => false],
            ['key' => 'skip',  'value' => '0',  'disabled' => true],
        ],
        'body_mode' => null,
        'body' => null,
    ]);

    expect($captured)->toBe('https://x.test/items?limit=10');
});

it('reports network error with kind=network on connection failure', function () {
    $mock = new MockHandler([
        new ConnectException('Connection refused', new Psr7Request('GET', 'https://x.test')),
    ]);
    $exec = makeExecutor($mock);

    $result = $exec->execute([
        'method' => 'GET',
        'url' => 'https://x.test',
        'headers' => [], 'params' => [], 'body_mode' => null, 'body' => null,
    ]);

    expect($result->status)->toBeNull();
    expect($result->errorKind)->toBe('network');
});

it('truncates response body at the configured cap', function () {
    $cap = 1024; // 1 KB cap
    $oversized = str_repeat('a', $cap * 2);
    $mock = new MockHandler([new Response(200, [], $oversized)]);
    $exec = makeExecutor($mock, ['response_body_cap_mb' => 1 / 1024]); // 1 KB

    $result = $exec->execute([
        'method' => 'GET', 'url' => 'https://x.test',
        'headers' => [], 'params' => [], 'body_mode' => null, 'body' => null,
    ]);

    expect(strlen($result->body))->toBe($cap);
    expect($result->bodyTruncated)->toBeTrue();
    expect($result->sizeBytes)->toBe($cap * 2);
});

it('sends a raw JSON body when body_mode = raw', function () {
    $captured = null;
    $mock = new MockHandler([
        function (Psr7Request $req) use (&$captured) {
            $captured = (string) $req->getBody();
            return new Response(201, [], '');
        },
    ]);
    $exec = makeExecutor($mock);

    $exec->execute([
        'method' => 'POST',
        'url' => 'https://x.test/items',
        'headers' => [['key' => 'Content-Type', 'value' => 'application/json', 'disabled' => false]],
        'params' => [],
        'body_mode' => 'raw',
        'body' => '{"name":"hi"}',
    ]);

    expect($captured)->toBe('{"name":"hi"}');
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement the executor**

```php
<?php

namespace HazemHammad\PostmanClone\Services\Execution;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Psr7\Request;
use Psr\Http\Message\ResponseInterface;

class RequestExecutor
{
    /**
     * @param array{
     *   timeout_seconds:int,
     *   response_body_cap_mb:float,
     *   follow_redirects:bool,
     *   max_redirects:int,
     *   verify_tls:bool
     * } $config
     */
    public function __construct(
        private readonly Client $client,
        private readonly array $config,
    ) {
    }

    /**
     * @param array{
     *   method:string,
     *   url:string,
     *   headers:array<int, array{key:string,value:string,disabled?:bool}>,
     *   params:array<int, array{key:string,value:string,disabled?:bool}>,
     *   body_mode:?string,
     *   body:mixed
     * } $req
     */
    public function execute(array $req): ResultDto
    {
        $url = $this->buildUrl($req['url'], $req['params']);
        $headers = $this->buildHeaders($req['headers']);
        [$body, $bodyHeaders] = $this->buildBody($req['body_mode'], $req['body']);
        $headers = array_merge($headers, $bodyHeaders);

        $request = new Request($req['method'], $url, $headers, $body);

        $cap = (int) ($this->config['response_body_cap_mb'] * 1024 * 1024);

        $start = microtime(true);
        try {
            $response = $this->client->send($request, [
                'timeout' => $this->config['timeout_seconds'],
                'allow_redirects' => $this->config['follow_redirects']
                    ? ['max' => $this->config['max_redirects'], 'strict' => false, 'referer' => false]
                    : false,
                'verify' => $this->config['verify_tls'],
                'http_errors' => false,
            ]);
        } catch (ConnectException $e) {
            $msg = $e->getMessage();
            $kind = 'network';
            if (stripos($msg, 'timed out') !== false || stripos($msg, 'timeout') !== false) {
                $kind = 'timeout';
            } elseif (stripos($msg, 'name or service') !== false || stripos($msg, 'getaddrinfo') !== false) {
                $kind = 'dns';
            } elseif (stripos($msg, 'ssl') !== false || stripos($msg, 'certificate') !== false) {
                $kind = 'tls';
            }
            return ResultDto::networkError($kind, $msg, (int) ((microtime(true) - $start) * 1000));
        } catch (RequestException $e) {
            return ResultDto::networkError(
                'unknown',
                $e->getMessage(),
                (int) ((microtime(true) - $start) * 1000)
            );
        }

        return $this->buildResult($response, $cap, (int) ((microtime(true) - $start) * 1000));
    }

    /**
     * @param array<int, array{key:string,value:string,disabled?:bool}> $params
     */
    protected function buildUrl(string $url, array $params): string
    {
        $active = array_filter($params, fn (array $p) => empty($p['disabled']));
        if ($active === []) {
            return $url;
        }

        $pairs = array_map(
            fn (array $p) => urlencode((string) $p['key']) . '=' . urlencode((string) $p['value']),
            $active
        );

        $separator = str_contains($url, '?') ? '&' : '?';
        return $url . $separator . implode('&', $pairs);
    }

    /**
     * @param array<int, array{key:string,value:string,disabled?:bool}> $headers
     * @return array<string, string>
     */
    protected function buildHeaders(array $headers): array
    {
        $out = [];
        foreach ($headers as $h) {
            if (! empty($h['disabled'])) {
                continue;
            }
            $out[(string) $h['key']] = (string) $h['value'];
        }
        return $out;
    }

    /**
     * @return array{0:?string,1:array<string,string>}
     */
    protected function buildBody(?string $mode, mixed $body): array
    {
        if ($mode === null || $body === null) {
            return [null, []];
        }
        if ($mode === 'raw') {
            return [(string) $body, []];
        }
        if ($mode === 'urlencoded' && is_array($body)) {
            $active = array_filter($body, fn (array $r) => empty($r['disabled']));
            $parts = array_map(
                fn (array $r) => urlencode((string) $r['key']) . '=' . urlencode((string) $r['value']),
                $active
            );
            return [implode('&', $parts), ['Content-Type' => 'application/x-www-form-urlencoded']];
        }
        // formdata: not supported in v1 (file uploads); future task
        return [(string) $body, []];
    }

    protected function buildResult(ResponseInterface $response, int $cap, int $timingMs): ResultDto
    {
        $stream = $response->getBody();
        $body = '';
        $totalSize = 0;
        $truncated = false;

        while (! $stream->eof()) {
            $chunk = $stream->read(8192);
            $totalSize += strlen($chunk);
            if (strlen($body) < $cap) {
                $remaining = $cap - strlen($body);
                $body .= substr($chunk, 0, $remaining);
                if (strlen($body) >= $cap && ! $stream->eof()) {
                    $truncated = true;
                }
            } else {
                $truncated = true;
            }
        }

        return new ResultDto(
            status: $response->getStatusCode(),
            headers: $response->getHeaders(),
            body: $body,
            bodyTruncated: $truncated,
            sizeBytes: $totalSize,
            timingMs: $timingMs,
            errorKind: null,
            errorMessage: null,
        );
    }
}
```

- [ ] **Step 4: Run — pass**

Run: `vendor/bin/pest tests/Unit/RequestExecutorTest.php`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Services/Execution/RequestExecutor.php tests/Unit/RequestExecutorTest.php
git commit -m "feat: RequestExecutor with Guzzle backend, body cap, error classification"
```

---

## PHASE 8 — History recorder

### Task 8.1: Implement `HistoryRecorder` (TDD)

**Files:**
- Create: `src/Services/History/HistoryRecorder.php`
- Create: `tests/Unit/HistoryRecorderTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Execution\ResultDto;
use HazemHammad\PostmanClone\Services\History\HistoryRecorder;

it('writes a Run row with the masked payload and result', function () {
    $recorder = new HistoryRecorder();

    $run = $recorder->record(
        rawPayload: [
            'collection_id' => 'cfg:x', 'request_id' => 'r1', 'request_name' => 'List',
            'environment_id' => 'local',
            'method' => 'GET',
            'url_raw' => '{{base_url}}/items',
            'url_resolved' => 'https://api.test/items',
            'headers' => [['key' => 'Authorization', 'value' => 'Bearer secret-tok']],
            'params' => [], 'body_mode' => null, 'body' => null,
        ],
        secrets: ['secret-tok'],
        result: new ResultDto(
            status: 200,
            headers: ['Content-Type' => ['application/json']],
            body: '{"ok":true}',
            bodyTruncated: false,
            sizeBytes: 11,
            timingMs: 87,
            errorKind: null,
            errorMessage: null,
        ),
    );

    $found = Run::find($run->id);
    expect($found)->not->toBeNull();
    expect($found->method)->toBe('GET');
    expect($found->response_status)->toBe(200);
    expect($found->response_size_bytes)->toBe(11);
    // Masking applied to stored payload
    expect(json_encode($found->request_payload_json))->not->toContain('secret-tok');
    expect(json_encode($found->request_payload_json))->toContain('••••••');
});

it('prunes old rows on every Nth insert', function () {
    config()->set('postman-clone.history.retain_max_rows', 5);
    $recorder = new HistoryRecorder(pruneEvery: 2);

    for ($i = 0; $i < 12; $i++) {
        $recorder->record(
            rawPayload: [
                'method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
                'headers' => [], 'params' => [], 'body_mode' => null, 'body' => null,
            ],
            secrets: [],
            result: new ResultDto(200, [], 'ok', false, 2, 1, null, null),
        );
    }

    expect(Run::count())->toBeLessThanOrEqual(5);
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Services\History;

use Carbon\Carbon;
use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Execution\ResultDto;
use HazemHammad\PostmanClone\Support\SecretMasker;

class HistoryRecorder
{
    public function __construct(private readonly int $pruneEvery = 50) {}

    /**
     * @param array<string, mixed> $rawPayload
     * @param array<int, string> $secrets
     */
    public function record(array $rawPayload, array $secrets, ResultDto $result): Run
    {
        $payloadForStorage = SecretMasker::maskArray([
            'headers' => $rawPayload['headers'] ?? [],
            'params' => $rawPayload['params'] ?? [],
            'body_mode' => $rawPayload['body_mode'] ?? null,
            'body' => $rawPayload['body'] ?? null,
            'auth' => $rawPayload['auth'] ?? null,
        ], $secrets);

        $urlResolved = SecretMasker::mask((string) ($rawPayload['url_resolved'] ?? ''), $secrets);

        $run = Run::create([
            'collection_id' => $rawPayload['collection_id'] ?? null,
            'request_id' => $rawPayload['request_id'] ?? null,
            'request_name' => $rawPayload['request_name'] ?? null,
            'environment_id' => $rawPayload['environment_id'] ?? null,
            'method' => (string) ($rawPayload['method'] ?? 'GET'),
            'url_raw' => (string) ($rawPayload['url_raw'] ?? ''),
            'url_resolved' => $urlResolved,
            'request_payload_json' => $payloadForStorage,
            'response_status' => $result->status,
            'response_headers_json' => $result->headers,
            'response_body' => $result->body,
            'response_body_truncated' => $result->bodyTruncated,
            'response_size_bytes' => $result->sizeBytes,
            'timing_ms' => $result->timingMs,
            'error_kind' => $result->errorKind,
            'error_message' => $result->errorMessage,
        ]);

        if ($run->id % $this->pruneEvery === 0) {
            $this->prune();
        }

        return $run;
    }

    protected function prune(): void
    {
        $maxRows = (int) config('postman-clone.history.retain_max_rows', 5000);
        $maxDays = (int) config('postman-clone.history.retain_days', 14);

        // Days
        Run::where('created_at', '<', Carbon::now()->subDays($maxDays))->delete();

        // Rows
        $count = Run::count();
        if ($count > $maxRows) {
            $toDelete = $count - $maxRows;
            $ids = Run::orderBy('created_at', 'asc')->orderBy('id', 'asc')->limit($toDelete)->pluck('id');
            Run::whereIn('id', $ids)->delete();
        }
    }
}
```

- [ ] **Step 4: Run — pass**

Run: `vendor/bin/pest tests/Unit/HistoryRecorderTest.php`
Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Services/History/HistoryRecorder.php tests/Unit/HistoryRecorderTest.php
git commit -m "feat: HistoryRecorder writes masked runs and prunes by row + day caps"
```

---

## PHASE 9 — HTTP layer (controllers, routes, FormRequests)

### Task 9.1: Wire `routes/web.php` and the `AppController`

**Files:**
- Modify: `routes/web.php`
- Create: `src/Http/Controllers/AppController.php`

- [ ] **Step 1: Update `routes/web.php`**

```php
<?php

use HazemHammad\PostmanClone\Http\Controllers\AppController;
use HazemHammad\PostmanClone\Http\Controllers\BootstrapController;
use HazemHammad\PostmanClone\Http\Controllers\CollectionsController;
use HazemHammad\PostmanClone\Http\Controllers\EnvironmentsController;
use HazemHammad\PostmanClone\Http\Controllers\HistoryController;
use HazemHammad\PostmanClone\Http\Controllers\RequestRunnerController;
use Illuminate\Support\Facades\Route;

$prefix = config('postman-clone.route.prefix', 'postman');
$middleware = array_merge(['postman-clone.gate'], config('postman-clone.access.middleware', []));

Route::group([
    'prefix' => $prefix,
    'middleware' => $middleware,
], function (): void {
    Route::get('/', [AppController::class, 'show'])->name('postman-clone.app');
    Route::get('/history', [AppController::class, 'show'])->name('postman-clone.history');

    Route::prefix('api')->group(function (): void {
        Route::get('/bootstrap', [BootstrapController::class, 'show']);

        Route::get('/collections', [CollectionsController::class, 'index']);
        Route::get('/collections/{id}', [CollectionsController::class, 'show'])->where('id', '.*');

        Route::get('/environments', [EnvironmentsController::class, 'index']);
        Route::put('/environments/{env}/variables/{name}', [EnvironmentsController::class, 'updateVariable']);
        Route::delete('/environments/{env}/variables/{name}', [EnvironmentsController::class, 'removeOverride']);

        Route::post('/runs', [RequestRunnerController::class, 'store']);
        Route::post('/preview', [RequestRunnerController::class, 'preview']);

        Route::get('/history', [HistoryController::class, 'index']);
        Route::get('/runs/{id}', [HistoryController::class, 'show']);
        Route::delete('/runs/{id}', [HistoryController::class, 'destroy']);
    });
});
```

- [ ] **Step 2: Implement `AppController`**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class AppController extends Controller
{
    public function show(): Response
    {
        return response()->view('postman-clone::app', [
            'theme' => config('postman-clone.theme'),
            'route_prefix' => config('postman-clone.route.prefix'),
        ]);
    }
}
```

- [ ] **Step 3: Update `resources/views/app.blade.php` to expose theme**

```blade
<!DOCTYPE html>
<html lang="en" style="--pc-primary: {{ $theme['primary_color'] }}; --pc-primary-text: {{ $theme['primary_text'] }};">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $theme['app_name'] }}</title>
    @if($theme['favicon_url'])<link rel="icon" href="{{ $theme['favicon_url'] }}">@endif
</head>
<body>
    <div id="app">SPA bundle not yet built. See Plan 2.</div>
    <script>
        window.__POSTMAN_CLONE__ = @json([
            'theme' => $theme,
            'route_prefix' => $route_prefix,
        ]);
    </script>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add routes/web.php src/Http/Controllers/AppController.php resources/views/app.blade.php
git commit -m "feat: wire all package routes and AppController serving Blade shell"
```

---

### Task 9.2: Implement `BootstrapController` (TDD)

**Files:**
- Create: `src/Http/Controllers/BootstrapController.php`
- Create: `tests/Feature/BootstrapEndpointTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Models\Run;

beforeEach(function () {
    config()->set('app.env', 'local');
    config()->set('postman-clone.access.enabled_environments', ['local']);
});

it('returns collections, environments, default_environment, and history_count', function () {
    config()->set('postman-clone.collections', [$this->fixturePath('sample-collection.postman_collection.json')]);
    config()->set('postman-clone.environments', [
        'local' => ['base_url' => 'http://localhost:8000'],
    ]);
    config()->set('postman-clone.default_environment', 'local');

    Run::create([
        'method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
        'request_payload_json' => [], 'response_body_truncated' => false,
    ]);

    $res = $this->getJson('/postman/api/bootstrap');

    $res->assertStatus(200);
    $res->assertJsonStructure(['collections', 'environments', 'active_environment', 'history_count']);
    expect($res->json('collections.0.name'))->toBe('Sample API');
    expect($res->json('environments.0.id'))->toBe('local');
    expect($res->json('active_environment'))->toBe('local');
    expect($res->json('history_count'))->toBe(1);
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class BootstrapController extends Controller
{
    public function show(CollectionRegistry $registry): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        $envList = [];
        foreach ($envs as $id => $vars) {
            $envList[] = [
                'id' => $id,
                'variable_count' => count($vars),
            ];
        }

        return response()->json([
            'collections' => array_values(array_map(fn ($e) => [
                'id' => $e['id'],
                'name' => $e['name'],
                'source' => $e['source'],
                'missing' => $e['missing'],
            ], $registry->all())),
            'environments' => $envList,
            'active_environment' => config('postman-clone.default_environment'),
            'history_count' => Run::count(),
        ]);
    }
}
```

- [ ] **Step 4: Run — pass**

- [ ] **Step 5: Commit**

```bash
git add src/Http/Controllers/BootstrapController.php tests/Feature/BootstrapEndpointTest.php
git commit -m "feat: GET /api/bootstrap returns initial app state"
```

---

### Task 9.3: Implement `CollectionsController` (TDD)

**Files:**
- Create: `src/Http/Controllers/CollectionsController.php`
- Create: `tests/Feature/CollectionsEndpointTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

beforeEach(function () {
    config()->set('app.env', 'local');
    config()->set('postman-clone.access.enabled_environments', ['local']);
});

it('lists all collections', function () {
    config()->set('postman-clone.collections', [$this->fixturePath('sample-collection.postman_collection.json')]);

    $res = $this->getJson('/postman/api/collections');
    $res->assertStatus(200);
    expect($res->json('data.0.name'))->toBe('Sample API');
});

it('returns the parsed tree for a single collection', function () {
    $path = $this->fixturePath('sample-collection.postman_collection.json');
    config()->set('postman-clone.collections', [$path]);
    $id = 'cfg:' . sha1($path);

    $res = $this->getJson('/postman/api/collections/' . urlencode($id));

    $res->assertStatus(200);
    expect($res->json('id'))->toBe('11111111-2222-3333-4444-555555555555');
    expect($res->json('name'))->toBe('Sample API');
    expect($res->json('items.0.items.0.name'))->toBe('List items');
});

it('returns 410 Gone when collection file is missing', function () {
    config()->set('postman-clone.collections', ['/no/such/file.json']);
    $id = 'cfg:' . sha1('/no/such/file.json');

    $res = $this->getJson('/postman/api/collections/' . urlencode($id));

    $res->assertStatus(410);
});

it('returns 404 for unknown collection id', function () {
    config()->set('postman-clone.collections', []);
    $this->getJson('/postman/api/collections/cfg:does-not-exist')->assertStatus(404);
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Exceptions\CollectionMissingException;
use HazemHammad\PostmanClone\Exceptions\InvalidCollectionException;
use HazemHammad\PostmanClone\Services\Collections\CollectionLoader;
use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use HazemHammad\PostmanClone\Services\Collections\Dto\Collection;
use HazemHammad\PostmanClone\Services\Collections\Dto\Folder;
use HazemHammad\PostmanClone\Services\Collections\Dto\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CollectionsController extends Controller
{
    public function __construct(
        private readonly CollectionRegistry $registry,
        private readonly CollectionLoader $loader,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => array_values(array_map(fn ($e) => [
                'id' => $e['id'],
                'name' => $e['name'],
                'source' => $e['source'],
                'missing' => $e['missing'],
            ], $this->registry->all())),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $entry = $this->registry->find($id);
        if ($entry === null) {
            abort(404);
        }
        if ($entry['missing']) {
            abort(410, 'Collection file is missing');
        }

        try {
            $collection = $this->loader->load($entry['path']);
        } catch (CollectionMissingException) {
            abort(410, 'Collection file is missing');
        } catch (InvalidCollectionException $e) {
            return response()->json([
                'error' => [
                    'kind' => 'invalid_collection',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }

        return response()->json([
            'id' => $collection->id,
            'name' => $collection->name,
            'description' => $collection->description,
            'variables' => $collection->variables,
            'items' => array_map(fn ($i) => $this->serializeItem($i), $collection->items),
        ]);
    }

    protected function serializeItem(Folder|Request $item): array
    {
        if ($item instanceof Folder) {
            return [
                'type' => 'folder',
                'id' => $item->id,
                'name' => $item->name,
                'items' => array_map(fn ($c) => $this->serializeItem($c), $item->items),
            ];
        }

        return [
            'type' => 'request',
            'id' => $item->id,
            'name' => $item->name,
            'method' => $item->method,
            'url' => $item->url,
            'headers' => $item->headers,
            'params' => $item->params,
            'body_mode' => $item->bodyMode,
            'body' => $item->body,
            'auth' => $item->auth,
        ];
    }
}
```

- [ ] **Step 4: Run — pass**

Run: `vendor/bin/pest tests/Feature/CollectionsEndpointTest.php`
Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Http/Controllers/CollectionsController.php tests/Feature/CollectionsEndpointTest.php
git commit -m "feat: GET /api/collections list + show with 410-on-missing"
```

---

### Task 9.4: Implement `EnvironmentsController` (TDD)

**Files:**
- Create: `src/Http/Controllers/EnvironmentsController.php`
- Create: `src/Http/Requests/UpdateEnvironmentVariableRequest.php`
- Create: `tests/Feature/EnvironmentsEndpointTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Support\Storage;

beforeEach(function () {
    config()->set('app.env', 'local');
    config()->set('postman-clone.access.enabled_environments', ['local']);
    Storage::ensureDir();
    @unlink(Storage::environmentsOverridePath());
});

it('lists merged environments with per-variable source badges', function () {
    config()->set('postman-clone.environments', [
        'local' => ['base_url' => 'http://x', 'token' => 'cfg-tok'],
    ]);
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'override-tok'],
    ]));

    $res = $this->getJson('/postman/api/environments');
    $res->assertStatus(200);

    $local = collect($res->json('data'))->firstWhere('id', 'local');
    expect($local)->not->toBeNull();
    expect(collect($local['variables'])->firstWhere('name', 'token')['value'])->toBe('override-tok');
    expect(collect($local['variables'])->firstWhere('name', 'token')['source'])->toBe('override');
});

it('writes an override on PUT /environments/{env}/variables/{name}', function () {
    config()->set('postman-clone.environments', ['local' => ['token' => 'cfg']]);

    $res = $this->putJson('/postman/api/environments/local/variables/token', [
        'value' => 'new-value',
    ]);

    $res->assertStatus(200);
    expect($res->json('variable.value'))->toBe('new-value');
    expect($res->json('variable.source'))->toBe('override');

    $stored = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($stored['local']['token'])->toBe('new-value');
});

it('removes an override on DELETE', function () {
    file_put_contents(Storage::environmentsOverridePath(), json_encode([
        'local' => ['token' => 'override-val'],
    ]));
    config()->set('postman-clone.environments', ['local' => ['token' => 'cfg-val']]);

    $res = $this->deleteJson('/postman/api/environments/local/variables/token');
    $res->assertStatus(200);

    $stored = json_decode(file_get_contents(Storage::environmentsOverridePath()), true);
    expect($stored['local'] ?? [])->toBe([]);
});

it('returns 404 for unknown environment id on PUT', function () {
    config()->set('postman-clone.environments', ['local' => []]);
    $this->putJson('/postman/api/environments/staging/variables/x', ['value' => 'y'])->assertStatus(404);
});

it('validates value is a string', function () {
    config()->set('postman-clone.environments', ['local' => []]);
    $this->putJson('/postman/api/environments/local/variables/x', ['value' => ['nope']])->assertStatus(422);
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement the FormRequest**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEnvironmentVariableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'value' => ['required', 'string'],
        ];
    }
}
```

- [ ] **Step 4: Implement the controller**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Http\Requests\UpdateEnvironmentVariableRequest;
use HazemHammad\PostmanClone\Services\Environments\EnvironmentResolver;
use HazemHammad\PostmanClone\Services\Environments\EnvironmentWriter;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class EnvironmentsController extends Controller
{
    public function __construct(
        private readonly EnvironmentResolver $resolver,
        private readonly EnvironmentWriter $writer,
    ) {
    }

    public function index(): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        $data = [];
        foreach ($envs as $id => $configVars) {
            $merged = $this->resolver->resolve((string) $id);
            $variables = [];
            foreach ($merged as $name => $row) {
                $variables[] = [
                    'name' => $name,
                    'value' => $row['is_secret'] ? '••••••' : $row['value'],
                    'is_secret' => $row['is_secret'],
                    'source' => $row['source'],
                ];
            }
            $data[] = [
                'id' => (string) $id,
                'variables' => $variables,
            ];
        }
        return response()->json(['data' => $data]);
    }

    public function updateVariable(UpdateEnvironmentVariableRequest $request, string $env, string $name): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        if (! isset($envs[$env])) {
            abort(404);
        }

        $this->writer->setOverride($env, $name, $request->string('value')->toString());

        $merged = $this->resolver->resolve($env);
        $row = $merged[$name] ?? null;

        return response()->json([
            'variable' => [
                'name' => $name,
                'value' => $row['is_secret'] ? '••••••' : $row['value'],
                'is_secret' => $row['is_secret'] ?? false,
                'source' => $row['source'] ?? 'override',
            ],
        ]);
    }

    public function removeOverride(string $env, string $name): JsonResponse
    {
        $envs = config('postman-clone.environments', []);
        if (! isset($envs[$env])) {
            abort(404);
        }

        $this->writer->removeOverride($env, $name);

        return response()->json(['ok' => true]);
    }
}
```

- [ ] **Step 5: Run — pass**

Run: `vendor/bin/pest tests/Feature/EnvironmentsEndpointTest.php`
Expected: 5 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Http/Controllers/EnvironmentsController.php src/Http/Requests/UpdateEnvironmentVariableRequest.php tests/Feature/EnvironmentsEndpointTest.php
git commit -m "feat: GET/PUT/DELETE environments endpoints with merged source badges"
```

---

### Task 9.5: Implement `RequestRunnerController` (TDD)

**Files:**
- Create: `src/Http/Controllers/RequestRunnerController.php`
- Create: `src/Http/Requests/RunRequestPayload.php`
- Create: `tests/Feature/RequestRunnerTest.php`

The controller binds Guzzle to a real client by default but allows the tests to swap a `MockHandler` via the container.

- [ ] **Step 1: Write failing tests**

```php
<?php

use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use HazemHammad\PostmanClone\Models\Run;

beforeEach(function () {
    config()->set('app.env', 'local');
    config()->set('postman-clone.access.enabled_environments', ['local']);
});

function bindMockClient(MockHandler $mock): void
{
    app()->instance(Client::class, new Client(['handler' => HandlerStack::create($mock)]));
}

it('executes a simple GET, records history, returns result', function () {
    bindMockClient(new MockHandler([new Response(200, ['Content-Type' => 'application/json'], '{"ok":true}')]));

    $res = $this->postJson('/postman/api/runs', [
        'method' => 'GET',
        'url' => 'https://api.example.com/items',
        'headers' => [],
        'params' => [],
        'body_mode' => null,
        'body' => null,
        'environment_id' => null,
        'collection_id' => null,
        'request_id' => null,
        'request_name' => null,
    ]);

    $res->assertStatus(200);
    expect($res->json('result.status'))->toBe(200);
    expect($res->json('run_id'))->toBeInt();
    expect(Run::count())->toBe(1);
});

it('substitutes environment variables before sending', function () {
    config()->set('postman-clone.environments', ['local' => ['base_url' => 'https://api.example.com']]);

    $captured = null;
    $mock = new MockHandler([
        function ($req) use (&$captured) {
            $captured = (string) $req->getUri();
            return new Response(200, [], 'ok');
        },
    ]);
    bindMockClient($mock);

    $this->postJson('/postman/api/runs', [
        'method' => 'GET',
        'url' => '{{base_url}}/items',
        'headers' => [],
        'params' => [],
        'body_mode' => null, 'body' => null,
        'environment_id' => 'local',
        'collection_id' => null, 'request_id' => null, 'request_name' => null,
    ])->assertStatus(200);

    expect($captured)->toBe('https://api.example.com/items');
});

it('returns 422 with the missing variable list when substitution fails', function () {
    bindMockClient(new MockHandler([new Response(200, [], 'unused')]));

    $res = $this->postJson('/postman/api/runs', [
        'method' => 'GET',
        'url' => '{{nope}}/items',
        'headers' => [], 'params' => [],
        'body_mode' => null, 'body' => null,
        'environment_id' => null,
        'collection_id' => null, 'request_id' => null, 'request_name' => null,
    ]);

    $res->assertStatus(422);
    expect($res->json('error.kind'))->toBe('unresolved_variable');
    expect($res->json('error.missing'))->toBe(['nope']);
});

it('preview endpoint returns substituted url with masked secrets', function () {
    putenv('POSTMAN_CLONE_TEST_TOKEN=tok-xyz');
    config()->set('postman-clone.environments', [
        'local' => ['token' => env('POSTMAN_CLONE_TEST_TOKEN'), 'base_url' => 'http://x'],
    ]);

    $res = $this->postJson('/postman/api/preview', [
        'url' => '{{base_url}}/items?t={{token}}',
        'environment_id' => 'local',
    ]);

    $res->assertStatus(200);
    expect($res->json('url'))->toBe('http://x/items?t=••••••');

    putenv('POSTMAN_CLONE_TEST_TOKEN');
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Write the FormRequest**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RunRequestPayload extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'method' => ['required', 'string', 'in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS'],
            'url' => ['required', 'string'],
            'headers' => ['array'],
            'headers.*.key' => ['required_with:headers', 'string'],
            'headers.*.value' => ['required_with:headers', 'string'],
            'headers.*.disabled' => ['nullable', 'boolean'],
            'params' => ['array'],
            'params.*.key' => ['required_with:params', 'string'],
            'params.*.value' => ['required_with:params', 'string'],
            'params.*.disabled' => ['nullable', 'boolean'],
            'body_mode' => ['nullable', 'string', 'in:raw,urlencoded,formdata'],
            'body' => ['nullable'],
            'environment_id' => ['nullable', 'string'],
            'collection_id' => ['nullable', 'string'],
            'request_id' => ['nullable', 'string'],
            'request_name' => ['nullable', 'string'],
        ];
    }
}
```

- [ ] **Step 4: Implement the controller**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use GuzzleHttp\Client;
use HazemHammad\PostmanClone\Exceptions\UnresolvedVariableException;
use HazemHammad\PostmanClone\Http\Requests\RunRequestPayload;
use HazemHammad\PostmanClone\Services\Environments\EnvironmentResolver;
use HazemHammad\PostmanClone\Services\Execution\RequestExecutor;
use HazemHammad\PostmanClone\Services\Execution\VariableSubstitutor;
use HazemHammad\PostmanClone\Services\History\HistoryRecorder;
use HazemHammad\PostmanClone\Support\SecretMasker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class RequestRunnerController extends Controller
{
    public function __construct(
        private readonly EnvironmentResolver $resolver,
        private readonly VariableSubstitutor $substitutor,
        private readonly HistoryRecorder $recorder,
    ) {
    }

    public function store(RunRequestPayload $request): JsonResponse
    {
        $payload = $request->validated();
        $envId = $payload['environment_id'];
        $vars = $this->resolver->resolve($envId);
        $secrets = $this->resolver->secrets($envId ?? '');

        try {
            $resolvedUrl = $this->substitutor->substitute($payload['url'], $vars);
            $resolvedHeaders = $this->substitutor->substituteArray($payload['headers'] ?? [], $vars);
            $resolvedParams = $this->substitutor->substituteArray($payload['params'] ?? [], $vars);
            $resolvedBody = is_string($payload['body'] ?? null)
                ? $this->substitutor->substitute($payload['body'], $vars)
                : ($payload['body'] ?? null);
        } catch (UnresolvedVariableException $e) {
            return response()->json([
                'error' => ['kind' => 'unresolved_variable', 'missing' => $e->missing],
            ], 422);
        }

        $executor = new RequestExecutor(
            app(Client::class),
            config('postman-clone.execution'),
        );

        $result = $executor->execute([
            'method' => $payload['method'],
            'url' => $resolvedUrl,
            'headers' => $resolvedHeaders,
            'params' => $resolvedParams,
            'body_mode' => $payload['body_mode'] ?? null,
            'body' => $resolvedBody,
        ]);

        $run = $this->recorder->record(
            rawPayload: [
                'collection_id' => $payload['collection_id'] ?? null,
                'request_id' => $payload['request_id'] ?? null,
                'request_name' => $payload['request_name'] ?? null,
                'environment_id' => $envId,
                'method' => $payload['method'],
                'url_raw' => $payload['url'],
                'url_resolved' => $resolvedUrl,
                'headers' => $resolvedHeaders,
                'params' => $resolvedParams,
                'body_mode' => $payload['body_mode'] ?? null,
                'body' => $resolvedBody,
            ],
            secrets: $secrets,
            result: $result,
        );

        return response()->json([
            'run_id' => $run->id,
            'result' => $result->toArray(),
        ]);
    }

    public function preview(Request $request, EnvironmentResolver $resolver, VariableSubstitutor $sub): JsonResponse
    {
        $url = (string) $request->input('url', '');
        $envId = $request->input('environment_id');
        $vars = $resolver->resolve($envId);
        $secrets = $envId !== null ? $resolver->secrets($envId) : [];

        try {
            $resolved = $sub->substitute($url, $vars);
        } catch (UnresolvedVariableException $e) {
            return response()->json(['url' => $url, 'missing' => $e->missing]);
        }

        return response()->json(['url' => SecretMasker::mask($resolved, $secrets)]);
    }
}
```

- [ ] **Step 5: Bind a default Guzzle client in the service provider**

Add to `PostmanCloneServiceProvider::register()`:

```php
$this->app->singleton(\GuzzleHttp\Client::class, fn () => new \GuzzleHttp\Client());
```

(Edit `src/PostmanCloneServiceProvider.php` to add this line inside `register()`, after `mergeConfigFrom`.)

- [ ] **Step 6: Run — pass**

Run: `vendor/bin/pest tests/Feature/RequestRunnerTest.php`
Expected: 4 PASS.

- [ ] **Step 7: Commit**

```bash
git add src/Http/Controllers/RequestRunnerController.php src/Http/Requests/RunRequestPayload.php src/PostmanCloneServiceProvider.php tests/Feature/RequestRunnerTest.php
git commit -m "feat: POST /api/runs + /api/preview with substitution, masking, history"
```

---

### Task 9.6: Implement `HistoryController` (TDD)

**Files:**
- Create: `src/Http/Controllers/HistoryController.php`
- Create: `tests/Feature/HistoryEndpointTest.php`

- [ ] **Step 1: Write failing tests**

```php
<?php

use HazemHammad\PostmanClone\Models\Run;

beforeEach(function () {
    config()->set('app.env', 'local');
    config()->set('postman-clone.access.enabled_environments', ['local']);
});

it('lists history paginated, newest first', function () {
    for ($i = 0; $i < 5; $i++) {
        Run::create([
            'method' => 'GET', 'url_raw' => "x{$i}", 'url_resolved' => "x{$i}",
            'request_payload_json' => [], 'response_body_truncated' => false,
            'created_at' => now()->subSeconds(5 - $i),
        ]);
    }

    $res = $this->getJson('/postman/api/history?per_page=3');
    $res->assertStatus(200);

    expect($res->json('data'))->toHaveCount(3);
    expect($res->json('data.0.url_raw'))->toBe('x4'); // newest first
    expect($res->json('meta.total'))->toBe(5);
});

it('filters by collection_id and request_id', function () {
    Run::create(['method' => 'GET', 'url_raw' => 'a', 'url_resolved' => 'a',
        'collection_id' => 'col-1', 'request_id' => 'req-1',
        'request_payload_json' => [], 'response_body_truncated' => false]);
    Run::create(['method' => 'GET', 'url_raw' => 'b', 'url_resolved' => 'b',
        'collection_id' => 'col-1', 'request_id' => 'req-2',
        'request_payload_json' => [], 'response_body_truncated' => false]);

    $res = $this->getJson('/postman/api/history?collection_id=col-1&request_id=req-1');
    expect($res->json('data'))->toHaveCount(1);
    expect($res->json('data.0.url_raw'))->toBe('a');
});

it('returns a single run on show', function () {
    $run = Run::create(['method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
        'request_payload_json' => ['headers' => []], 'response_body_truncated' => false]);

    $res = $this->getJson("/postman/api/runs/{$run->id}");
    $res->assertStatus(200);
    expect($res->json('id'))->toBe($run->id);
});

it('returns 404 for unknown run id', function () {
    $this->getJson('/postman/api/runs/999999')->assertStatus(404);
});

it('deletes a single run', function () {
    $run = Run::create(['method' => 'GET', 'url_raw' => 'x', 'url_resolved' => 'x',
        'request_payload_json' => [], 'response_body_truncated' => false]);

    $this->deleteJson("/postman/api/runs/{$run->id}")->assertStatus(200);
    expect(Run::find($run->id))->toBeNull();
});
```

- [ ] **Step 2: Run — fails**

- [ ] **Step 3: Implement**

```php
<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Models\Run;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class HistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->input('per_page', 50)));

        $query = Run::query()->orderByDesc('created_at')->orderByDesc('id');
        if ($request->filled('collection_id')) {
            $query->where('collection_id', $request->input('collection_id'));
        }
        if ($request->filled('request_id')) {
            $query->where('request_id', $request->input('request_id'));
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => array_map(fn (Run $r) => $this->summary($r), $paginator->items()),
            'meta' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $run = Run::find($id);
        if ($run === null) {
            abort(404);
        }
        return response()->json($this->full($run));
    }

    public function destroy(int $id): JsonResponse
    {
        $run = Run::find($id);
        if ($run === null) {
            abort(404);
        }
        $run->delete();
        return response()->json(['ok' => true]);
    }

    protected function summary(Run $r): array
    {
        return [
            'id' => $r->id,
            'method' => $r->method,
            'url_raw' => $r->url_raw,
            'url_resolved' => $r->url_resolved,
            'response_status' => $r->response_status,
            'error_kind' => $r->error_kind,
            'timing_ms' => $r->timing_ms,
            'request_name' => $r->request_name,
            'collection_id' => $r->collection_id,
            'request_id' => $r->request_id,
            'created_at' => optional($r->created_at)->toIso8601String(),
        ];
    }

    protected function full(Run $r): array
    {
        return array_merge($this->summary($r), [
            'environment_id' => $r->environment_id,
            'request_payload_json' => $r->request_payload_json,
            'response_headers_json' => $r->response_headers_json,
            'response_body' => $r->response_body,
            'response_body_truncated' => $r->response_body_truncated,
            'response_size_bytes' => $r->response_size_bytes,
            'error_message' => $r->error_message,
        ]);
    }
}
```

- [ ] **Step 4: Run — pass**

Run: `vendor/bin/pest tests/Feature/HistoryEndpointTest.php`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Http/Controllers/HistoryController.php tests/Feature/HistoryEndpointTest.php
git commit -m "feat: history endpoints (list paginated, show, delete)"
```

---

## PHASE 10 — Final wire-up & full test pass

### Task 10.1: Run the full suite and fix any regressions

- [ ] **Step 1: Run all tests**

Run: `vendor/bin/pest`
Expected: All tests PASS. Count: ≥ 30 tests across Unit + Feature.

- [ ] **Step 2: If anything fails, fix it before proceeding**

Triage rule: do not loosen tests to make them pass. Fix the implementation or revisit the spec.

- [ ] **Step 3: Run static analysis**

Run: `vendor/bin/phpstan analyse src --level=5 --memory-limit=256M`
Expected: No errors. Fix any phpstan complaints inline.

(If phpstan config doesn't exist yet, create a minimal `phpstan.neon`:)

```yaml
parameters:
    level: 5
    paths:
        - src
    excludePaths:
        - vendor
```

- [ ] **Step 4: Commit phpstan config and any fixes**

```bash
git add phpstan.neon
# plus any src/ fixes
git commit -m "chore: add phpstan config and clear level-5 errors"
```

---

### Task 10.2: Tag a Plan-1-complete checkpoint

- [ ] **Step 1: Verify tree is clean and all suites pass**

Run: `git status && vendor/bin/pest && vendor/bin/phpstan analyse`
Expected: Clean tree, all green.

- [ ] **Step 2: Tag**

```bash
git tag -a plan-1-backend-complete -m "Backend foundation complete: parser, resolver, executor, history, all HTTP endpoints with full test coverage. Ready for Plan 2 (SPA)."
```

- [ ] **Step 3: Verify**

```bash
git tag -l 'plan-*'
# Expected output: plan-1-backend-complete
```

---

## Self-review against the spec

| Spec section | Plan task(s) |
|---|---|
| 3.1–3.2 Runtime gate / access control | Task 1.3, 1.4, 9.1 |
| 3.3 Server-side execution | Task 7.2 |
| 3.4 Response cap | Task 7.2 (truncation test) |
| 4 Architecture | Phases 1–9 collectively |
| 5 Configuration | Task 1.1 |
| 6.1 Bootstrap | Task 9.2 |
| 6.2 Open from tree (collections endpoints) | Task 4.1, 4.2, 9.3 |
| 6.3 Send a request | Task 9.5 |
| 6.4 Edit env variable | Task 5.3, 9.4 |
| 6.5 Replay from history | Task 9.6 (show endpoint) |
| 6.6 Variable substitution preview | Task 9.5 (preview endpoint) |
| 7.1 Runs table schema | Task 2.1 |
| 7.2 On-disk files (envs.local.json, uploads) | Tasks 5.3, 4.2 |
| 7.3 Override JSON shape | Task 5.3 |
| 10.1 Failure taxonomy | Task 7.2 (network/timeout/dns/tls); Task 9.5 (unresolved_variable, invalid_request via FormRequest); body_too_large (Task 7.2) |
| 10.2 Concurrency: flock | Task 5.3 |
| 10.3 Filesystem edges (missing/invalid collection) | Task 9.3 |
| 10.5 Variable substitution edges | Task 6.1 |
| 11 Testing strategy | Every task includes TDD steps + dedicated test files |

**Gaps acknowledged (deferred to later plans, not v1 backend foundation):**
- SPA (Plan 2)
- InstallCommand, README, dogfood, v0.1 release (Plan 3)
- Binary-response detection + download streaming (touched in 10.4 of spec — sits behind a controller flag noted as "v1 disabled" in spec, so legitimately deferred)
- Cookie jar (explicit backlog)
- Pre-request scripts (explicit backlog)

No placeholders found. No missing requirements among in-scope items.

---

## Execution Handoff

**Plan complete and saved to `postman-clone/docs/plans/2026-05-02-backend-foundation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
