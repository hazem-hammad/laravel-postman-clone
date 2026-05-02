<?php

namespace HazemHammad\PostmanClone\Services\Github;

use HazemHammad\PostmanClone\Models\User;

class AssigneeSuggester
{
    /** @var (callable():?GithubClient)|null */
    private $githubClientFactory = null;

    public function __construct(
        private readonly RouteFileResolver $routeFileResolver,
        private readonly GitLogReader $gitLogReader,
        private readonly string $hostBasePath,
    ) {
    }

    public function setClientFactory(callable $factory): void
    {
        $this->githubClientFactory = $factory;
    }

    /**
     * @return array{suggested:string, source:string}|null
     */
    public function suggest(string $method, string $urlPath): ?array
    {
        $file = $this->routeFileResolver->resolve($method, $urlPath);
        if ($file === null) {
            return null;
        }

        $relativeFile = str_replace($this->hostBasePath.'/', '', $file);
        $authors = $this->gitLogReader->read($this->hostBasePath, $relativeFile);
        if (empty($authors)) {
            return null;
        }

        $seenEmails = [];
        foreach ($authors as $author) {
            $email = $author['email'];
            if (in_array($email, $seenEmails, true)) {
                continue;
            }
            $seenEmails[] = $email;

            $cached = User::where('email', $email)->first();
            if ($cached) {
                return ['suggested' => $cached->github_login, 'source' => 'git+cache'];
            }
        }

        if ($this->githubClientFactory === null) {
            return null;
        }
        $client = ($this->githubClientFactory)();
        if (! $client instanceof GithubClient) {
            return null;
        }
        $login = $client->searchUserByEmail($authors[0]['email']);
        if ($login !== null) {
            return ['suggested' => $login, 'source' => 'git+github'];
        }

        return null;
    }
}
