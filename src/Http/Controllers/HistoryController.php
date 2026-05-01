<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Models\Run;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class HistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->input('per_page', 50)));

        $query = Run::query()->orderByDesc('created_at')->orderByDesc('id');
        if ($request->filled('collection_id')) {
            $query->where('collection_id', $request->input('collection_id'));
        }
        if ($request->filled('request_id')) {
            $query->where('request_id', $request->input('request_id'));
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => array_map(fn (Run $r) => $this->summary($r), $paginator->items()),
            'meta' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $run = Run::find($id);
        if ($run === null) {
            abort(404);
        }
        return response()->json($this->full($run));
    }

    public function destroy(int $id): JsonResponse
    {
        $run = Run::find($id);
        if ($run === null) {
            abort(404);
        }
        $run->delete();
        return response()->json(['ok' => true]);
    }

    protected function summary(Run $r): array
    {
        return [
            'id' => $r->id,
            'method' => $r->method,
            'url_raw' => $r->url_raw,
            'url_resolved' => $r->url_resolved,
            'response_status' => $r->response_status,
            'error_kind' => $r->error_kind,
            'timing_ms' => $r->timing_ms,
            'request_name' => $r->request_name,
            'collection_id' => $r->collection_id,
            'request_id' => $r->request_id,
            'created_at' => optional($r->created_at)->toIso8601String(),
        ];
    }

    protected function full(Run $r): array
    {
        return array_merge($this->summary($r), [
            'environment_id' => $r->environment_id,
            'request_payload_json' => $r->request_payload_json,
            'response_headers_json' => $r->response_headers_json,
            'response_body' => $r->response_body,
            'response_body_truncated' => $r->response_body_truncated,
            'response_size_bytes' => $r->response_size_bytes,
            'error_message' => $r->error_message,
        ]);
    }
}
