<?php

namespace HazemHammad\PostmanClone\Services\Github;

class IssueBodyComposer
{
    /**
     * @param  array{
     *   user_body:string,
     *   collection_name:string,
     *   request_path:string,
     *   method:string,
     *   url_raw:string,
     *   url_resolved:string,
     *   env_id:?string,
     *   branch:?string,
     *   last_run:?array{status:?int,error_kind:?string,message:?string,timing_ms:?int},
     *   filer_login:string,
     * }  $input
     */
    public function compose(array $input): string
    {
        $lines = [];
        $lines[] = $input['user_body'];
        $lines[] = '';
        $lines[] = '---';
        $lines[] = '### Request context';
        $lines[] = "- **Collection:** {$input['collection_name']}";
        $lines[] = "- **Path:** {$input['request_path']}";
        $lines[] = "- **Method + URL:** {$input['method']} `{$input['url_raw']}`";
        $lines[] = "- **Resolved URL:** {$input['url_resolved']}";
        if ($input['env_id'] !== null) {
            $lines[] = "- **Active env:** `{$input['env_id']}`";
        }
        if ($input['branch'] !== null) {
            $lines[] = "- **Branch:** `{$input['branch']}`";
        }
        if ($input['last_run'] !== null) {
            $lr = $input['last_run'];
            $statusPart = $lr['status'] ?? ($lr['error_kind'] ?? '?');
            $msgPart = isset($lr['message']) && $lr['message'] !== '' ? ' '.$lr['message'] : '';
            $timing = isset($lr['timing_ms']) ? " ({$lr['timing_ms']} ms)" : '';
            $lines[] = "- **Last response:** {$statusPart}{$timing}{$msgPart}";
        }
        $lines[] = '';
        $lines[] = '---';
        $lines[] = "> Filed via Postman Clone by @{$input['filer_login']}";

        return implode("\n", $lines);
    }
}
