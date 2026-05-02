<?php

namespace HazemHammad\PostmanClone;

use GuzzleHttp\Client;
use HazemHammad\PostmanClone\Console\InstallCommand;
use HazemHammad\PostmanClone\Http\Middleware\EnsurePackageEnabled;
use Illuminate\Routing\Router;
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

        $router->aliasMiddleware('postman-clone.gate', EnsurePackageEnabled::class);

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
}
