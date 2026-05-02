<?php

namespace HazemHammad\PostmanClone\Console;

use Illuminate\Console\Command;

class InstallCommand extends Command
{
    protected $signature = 'postman-clone:install';

    protected $description = 'Publish postman-clone config and print setup instructions.';

    public function handle(): int
    {
        $this->call('vendor:publish', [
            '--tag' => 'postman-clone-config',
            '--force' => false,
        ]);

        $this->newLine();
        $this->line('<fg=green;options=bold>postman-clone installed.</>');
        $this->newLine();
        $this->line('Next steps:');
        $this->line('  1. Edit <fg=cyan>config/postman-clone.php</> — add your collection paths and environments.');
        $this->line('  2. Visit <fg=cyan>/postman</> in your browser (local env only by default).');
        $this->line('  3. To enable on staging: set <fg=cyan>access.enabled_environments</> + <fg=cyan>access.middleware</>.');
        $this->newLine();

        return self::SUCCESS;
    }
}
