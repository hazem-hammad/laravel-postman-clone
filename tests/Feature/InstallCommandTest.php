<?php

use Illuminate\Support\Facades\File;

it('publishes config file via the install command', function () {
    $publishedConfig = config_path('postman-clone.php');
    if (File::exists($publishedConfig)) {
        File::delete($publishedConfig);
    }

    $this->artisan('postman-clone:install')->assertExitCode(0);

    expect(File::exists($publishedConfig))->toBeTrue();
    File::delete($publishedConfig);
});

it('prints follow-up steps after install', function () {
    $this->artisan('postman-clone:install')
        ->expectsOutputToContain('postman-clone installed.')
        ->assertExitCode(0);
});
