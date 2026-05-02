<?php

namespace HazemHammad\PostmanClone\Services\Github;

use HazemHammad\PostmanClone\Models\User;

class AssigneeSuggester
{
    /**
     * @param  callable():?GithubClient  $githubClientFactory  builder for an authenticated client
     */
    public function __construct(
        private readonly RouteFileResolver $routeFileResolver,
        private readonly GitLogReader $gitLogReader,
        private readonly mixed $githubClientFactory,
        private readonly string $hostBasePath,
    ) {
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
