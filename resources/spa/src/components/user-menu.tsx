import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { signInUrl, signOut } from '@/api/auth';

export function UserMenu() {
  const enabled = useAuthStore((s) => s.enabled);
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  if (!enabled) return null;
  if (!user) {
    return (
      <a
        href={signInUrl()}
        className="text-xs px-2.5 py-1 rounded-md border border-line-subtle bg-surface-2 hover:bg-surface-hover text-fg flex items-center gap-1.5"
        title="Sign in with GitHub to file issues from requests"
      >
        <GhMark />
        Sign in with GitHub
      </a>
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 hover:bg-surface-hover rounded p-0.5"
      >
        <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-44 bg-surface border border-line rounded-md shadow-lg z-30 text-xs">
          <div className="px-3 py-2 border-b border-line-subtle">
            <div className="font-medium text-fg">{user.name ?? user.githubLogin}</div>
            <div className="text-fg-subtle text-[10px]">@{user.githubLogin}</div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              useAuthStore.getState().signOut();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-fg-muted hover:bg-surface-hover hover:text-fg"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function GhMark() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}
