<?php

namespace HazemHammad\PostmanClone\Services\Github;

class RepoIdentityResolver
{
    /** @var callable(string):?string */
    private $remoteReader;

    public function __construct(?callable $remoteReader = null)
    {
        $this->remoteReader = $remoteReader ?? function (string $cwd): ?string {
            $output = @shell_exec('cd '.escapeshellarg($cwd).' && git remote get-url origin 2>/dev/null');

            return $output !== null && $output !== '' ? trim($output) : null;
        };
    }

    public function resolve(string $hostBasePath): ?string
    {
        $configured = config('postman-clone.github.repo');
        if (is_string($configured) && $configured !== '') {
            return $configured;
        }

        $remote = ($this->remoteReader)($hostBasePath);
        if (! $remote) {
            return null;
        }

        return $this->parseRemote($remote);
    }

    protected function parseRemote(string $url): ?string
    {
        if (preg_match('/^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/', $url, $m)) {
            return $m[1].'/'.$m[2];
        }
        if (preg_match('#^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$#', $url, $m)) {
            return $m[1].'/'.$m[2];
        }

        return null;
    }
}
