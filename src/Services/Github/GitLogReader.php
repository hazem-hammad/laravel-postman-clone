<?php

namespace HazemHammad\PostmanClone\Services\Github;

class GitLogReader
{
    /** @var callable(string,string):array<int,array{email:string,name:string}> */
    private $reader;

    public function __construct(?callable $reader = null)
    {
        $this->reader = $reader ?? function (string $cwd, string $file): array {
            $cmd = sprintf(
                "cd %s && git log -n 5 --pretty=format:'%%ae|%%an' -- %s 2>/dev/null",
                escapeshellarg($cwd),
                escapeshellarg($file),
            );
            $out = @shell_exec($cmd);
            if (! is_string($out) || $out === '') {
                return [];
            }
            $rows = [];
            foreach (explode("\n", trim($out)) as $line) {
                $parts = explode('|', $line, 2);
                if (count($parts) === 2) {
                    $rows[] = ['email' => $parts[0], 'name' => $parts[1]];
                }
            }

            return $rows;
        };
    }

    /** @return array<int,array{email:string,name:string}> */
    public function read(string $cwd, string $file): array
    {
        return ($this->reader)($cwd, $file);
    }
}
