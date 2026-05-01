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
        $app['config']->set('postman-clone.storage.driver', 'sqlite');
        $app['config']->set('postman-clone.storage.sqlite.path', ':memory:');
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('migrate', ['--database' => 'postman_clone_storage'])->run();
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
