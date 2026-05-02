<?php

namespace HazemHammad\PostmanClone;

use GuzzleHttp\Client;
use HazemHammad\PostmanClone\Console\InstallCommand;
use HazemHammad\PostmanClone\Http\Middleware\EnsureGithubAuthenticated;
use HazemHammad\PostmanClone\Http\Middleware\EnsurePackageEnabled;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class PostmanCloneServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/postman-clone.php', 'postman-clone');
        $this->app->singleton(Client::class, fn () => new Client());
    }

    public function boot(Router $router): void
    {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'postman-clone');

        $this->publishes([
            __DIR__ . '/../config/postman-clone.php' => config_path('postman-clone.php'),
        ], 'postman-clone-config');

        $this->registerStorageConnection();
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        $this->ensureMigrated();

        $router->aliasMiddleware('postman-clone.gate', EnsurePackageEnabled::class);
        $router->aliasMiddleware('postman-clone.gh-auth', EnsureGithubAuthenticated::class);

        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');

        if ($this->app->runningInConsole()) {
            $this->commands([
                InstallCommand::class,
            ]);
        }
    }

    protected function registerStorageConnection(): void
    {
        $driver = config('postman-clone.storage.driver', 'sqlite');

        if ($driver === 'sqlite') {
            $path = config('postman-clone.storage.sqlite.path');

            if ($path !== ':memory:') {
                $dir = dirname($path);
                if (! is_dir($dir)) {
                    @mkdir($dir, 0775, recursive: true);
                }
                if (! file_exists($path)) {
                    @touch($path);
                }
            }

            config()->set('database.connections.postman_clone_storage', [
                'driver' => 'sqlite',
                'database' => $path,
                'prefix' => config('postman-clone.storage.table_prefix', 'postman_clone_'),
                'foreign_key_constraints' => true,
            ]);

            return;
        }

        $target = config('postman-clone.storage.connection') ?? config('database.default');
        $cfg = config('database.connections.' . $target);
        $cfg['prefix'] = config('postman-clone.storage.table_prefix', 'postman_clone_');
        config()->set('database.connections.postman_clone_storage', $cfg);
    }

    /**
     * Auto-migrate the package's own connection on first boot. Idempotent —
     * the migrator skips already-applied migrations. Safe to call on every
     * request since the schema check is a single SELECT against
     * sqlite_master / information_schema.
     *
     * Skipped during php artisan migrate:* commands so user-driven migrations
     * stay in control.
     */
    protected function ensureMigrated(): void
    {
        // Console commands manage migrations themselves (`php artisan migrate`,
        // `postman-clone:install`, test runs that drive migrate manually).
        // Auto-migrate runs only on incoming web requests where it's needed.
        if ($this->app->runningInConsole()) {
            return;
        }

        // Cheap signature check: count migration files in our path vs. rows
        // in the migrations table on the storage connection. If they match,
        // skip artisan migrate entirely (saves ~10ms per request). If not,
        // a new migration shipped with a package upgrade — apply it.
        try {
            $migrationsPath = __DIR__ . '/../database/migrations';
            $files = glob($migrationsPath . '/*.php') ?: [];
            $expected = count($files);

            if ($expected > 0 && Schema::connection('postman_clone_storage')->hasTable('migrations')) {
                $applied = (int) DB::connection('postman_clone_storage')
                    ->table('migrations')
                    ->whereIn('migration', array_map(
                        fn (string $f) => pathinfo($f, PATHINFO_FILENAME),
                        $files,
                    ))
                    ->count();
                if ($applied === $expected) {
                    return;
                }
            }

            Artisan::call('migrate', [
                '--database' => 'postman_clone_storage',
                '--path' => $migrationsPath,
                '--realpath' => true,
                '--force' => true,
            ]);
        } catch (\Throwable) {
            // First-boot migrate failure shouldn't crash boot. The query
            // exception that follows will surface a clear error to the user.
        }
    }
}
