<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Models\Run;
use HazemHammad\PostmanClone\Services\Collections\CollectionRegistry;
use HazemHammad\PostmanClone\Services\Git\GitBranchReader;
use HazemHammad\PostmanClone\Services\Github\UserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class BootstrapController extends Controller
{
    public function show(CollectionRegistry $registry, GitBranchReader $git, UserResolver $userResolver): JsonResponse
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
            'git_branch' => $this->resolveGitBranch($git),
            'github' => $this->buildGithubBlock($userResolver),
        ]);
    }

    protected function resolveGitBranch(GitBranchReader $git): ?string
    {
        if (! config('postman-clone.git_branch.enabled', true)) {
            return null;
        }
        $path = config('postman-clone.git_branch.path') ?? base_path();
        return $git->read((string) $path);
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildGithubBlock(UserResolver $userResolver): array
    {
        $user = $userResolver->current();

        return [
            'enabled' => (bool) config('postman-clone.github.enabled'),
            'repo' => config('postman-clone.github.repo'),
            'current_user' => $user ? [
                'id' => $user->id,
                'github_login' => $user->github_login,
                'name' => $user->name,
                'avatar_url' => $user->avatar_url,
                'has_repo_access' => $user->has_repo_access,
            ] : null,
        ];
    }
}
