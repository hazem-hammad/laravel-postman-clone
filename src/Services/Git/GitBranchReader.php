<?php

namespace HazemHammad\PostmanClone\Services\Git;

/**
 * Reads the current git branch from a directory by inspecting `.git/HEAD`.
 *
 * Handles three cases:
 *   - Plain repository: `.git` is a directory; HEAD points to refs/heads/X.
 *   - Worktree:        `.git` is a file containing `gitdir: /path/to/.git/worktrees/X`.
 *   - Submodule:       `.git` is a file containing `gitdir: ../.git/modules/Y`.
 *
 * Returns null when the path isn't a git repo, or when HEAD is detached
 * (we surface the short SHA in that case so the user still has a hint).
 */
class GitBranchReader
{
    public function read(string $path): ?string
    {
        if (! is_dir($path)) {
            return null;
        }

        $headFile = $this->resolveHeadFile($path);
        if ($headFile === null || ! is_readable($headFile)) {
            return null;
        }

        $head = trim((string) @file_get_contents($headFile));
        if ($head === '') {
            return null;
        }

        if (str_starts_with($head, 'ref: ')) {
            $ref = substr($head, 5);
            // refs/heads/main → main; refs/heads/feature/x → feature/x
            if (str_starts_with($ref, 'refs/heads/')) {
                return substr($ref, strlen('refs/heads/'));
            }
            return $ref;
        }

        // Detached HEAD — just a sha
        if (preg_match('/^[0-9a-f]{7,40}$/', $head)) {
            return '(' . substr($head, 0, 7) . ')';
        }

        return null;
    }

    /**
     * Resolve `.git` (which may be a file pointing at the real gitdir, e.g.
     * for worktrees and submodules) to the actual HEAD file path.
     */
    protected function resolveHeadFile(string $path): ?string
    {
        $gitPath = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.git';

        if (is_dir($gitPath)) {
            return $gitPath . DIRECTORY_SEPARATOR . 'HEAD';
        }

        if (is_file($gitPath)) {
            $contents = trim((string) @file_get_contents($gitPath));
            if (str_starts_with($contents, 'gitdir: ')) {
                $gitdir = trim(substr($contents, 8));
                // Resolve relative gitdir against the path the .git file lives in
                if (! str_starts_with($gitdir, DIRECTORY_SEPARATOR)) {
                    $gitdir = $path . DIRECTORY_SEPARATOR . $gitdir;
                }
                $real = realpath($gitdir);
                if ($real !== false) {
                    return $real . DIRECTORY_SEPARATOR . 'HEAD';
                }
            }
        }

        return null;
    }
}
