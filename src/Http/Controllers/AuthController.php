<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use GuzzleHttp\Client;
use HazemHammad\PostmanClone\Models\User;
use HazemHammad\PostmanClone\Services\Github\GithubClient;
use HazemHammad\PostmanClone\Services\Github\OAuthStateGenerator;
use HazemHammad\PostmanClone\Services\Github\UserResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Session;

class AuthController extends Controller
{
    public function __construct(
        private readonly OAuthStateGenerator $state,
        private readonly UserResolver $userResolver,
        private readonly Client $http,
    ) {
    }

    public function start(): RedirectResponse
    {
        $state = $this->state->generate();
        $clientId = config('postman-clone.github.client_id');
        $scope = config('postman-clone.github.allow_public_repo_scope') ? 'read:user public_repo' : 'read:user repo';
        $redirectUri = url(config('postman-clone.route.prefix', 'postman').'/auth/github/callback');

        $url = config('postman-clone.github.oauth_authorize_url').'?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'scope' => $scope,
            'state' => $state,
            'allow_signup' => 'false',
        ]);

        return redirect($url);
    }

    public function callback(Request $request): RedirectResponse
    {
        $code = (string) $request->query('code', '');
        $stateValue = (string) $request->query('state', '');
        if ($code === '' || $stateValue === '' || ! $this->state->validate($stateValue)) {
            abort(400, 'Sign-in failed (CSRF state mismatch).');
        }

        $client = new GithubClient($this->http, '');
        $token = $client->exchangeOauthCode(
            $code,
            (string) config('postman-clone.github.client_id'),
            (string) config('postman-clone.github.client_secret'),
        );

        $authed = new GithubClient($this->http, $token);
        $profile = $authed->getAuthenticatedUser();
        $emails = $authed->getUserEmails();
        $primaryEmail = collect($emails)->firstWhere('primary', true)['email'] ?? null;

        $repo = config('postman-clone.github.repo');
        $hasAccess = $repo ? ($authed->getRepo($repo) !== null) : false;

        $user = User::updateOrCreate(
            ['github_id' => $profile['id']],
            [
                'github_login' => $profile['login'],
                'name' => $profile['name'] ?? null,
                'email' => $primaryEmail,
                'avatar_url' => $profile['avatar_url'] ?? '',
                'encrypted_access_token' => Crypt::encryptString($token),
                'has_repo_access' => $hasAccess,
                'last_repo_check_at' => now(),
                'last_seen_at' => now(),
            ],
        );

        $this->userResolver->signIn($user);

        $prefix = '/'.trim((string) config('postman-clone.route.prefix', 'postman'), '/');

        return redirect($prefix.($hasAccess ? '' : '?auth_error=no_repo_access'));
    }

    public function signOut(): Response
    {
        $this->userResolver->signOut();
        Session::invalidate();

        return response()->noContent();
    }
}
