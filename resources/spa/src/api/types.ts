export type CollectionEntry = {
  id: string;
  name: string;
  source: 'config' | 'upload';
  missing: boolean;
};

export type EnvironmentSummary = { id: string; variable_count: number };

export type GithubBootstrap = {
  enabled: boolean;
  repo: string | null;
  current_user: {
    id: number;
    github_login: string;
    name: string | null;
    avatar_url: string;
    has_repo_access: boolean;
  } | null;
};

export type Bootstrap = {
  collections: CollectionEntry[];
  environments: EnvironmentSummary[];
  active_environment: string | null;
  history_count: number;
  git_branch: string | null;
  github: GithubBootstrap;
};

export type KeyValue = { key: string; value: string; disabled?: boolean };

export type RequestNode = {
  type: 'request';
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body_mode: string | null;
  body: unknown;
  auth: Record<string, unknown> | null;
};

export type FolderNode = {
  type: 'folder';
  id: string;
  name: string;
  items: TreeNode[];
};

export type TreeNode = FolderNode | RequestNode;

export type CollectionDetail = {
  id: string;
  name: string;
  description: string | null;
  variables: Record<string, string>;
  items: TreeNode[];
};

export type EnvironmentVariable = {
  name: string;
  value: string;
  is_secret: boolean;
  source: 'collection' | 'config' | 'override';
};

export type EnvironmentDetail = {
  id: string;
  variables: EnvironmentVariable[];
};

export type RunResult = {
  status: number | null;
  headers: Record<string, string[]>;
  body: string | null;
  body_truncated: boolean;
  size_bytes: number | null;
  timing_ms: number;
  error_kind: string | null;
  error_message: string | null;
};

export type RunRecordSummary = {
  id: number;
  method: string;
  url_raw: string;
  url_resolved: string;
  response_status: number | null;
  error_kind: string | null;
  timing_ms: number | null;
  request_name: string | null;
  collection_id: string | null;
  request_id: string | null;
  created_at: string | null;
};

export type RunRecordFull = RunRecordSummary & {
  environment_id: string | null;
  request_payload_json: Record<string, unknown>;
  response_headers_json: Record<string, string[]> | null;
  response_body: string | null;
  response_body_truncated: boolean;
  response_size_bytes: number | null;
  error_message: string | null;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};
