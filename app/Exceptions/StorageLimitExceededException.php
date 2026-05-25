<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;
use Throwable;

/**
 * Thrown when a user attempts to upload beyond their subscription storage quota.
 */
class StorageLimitExceededException extends RuntimeException
{
    private int $limitBytes;
    private int $usedBytes;
    private int $fileBytes;

    public function __construct(
        int $limitBytes,
        int $usedBytes,
        int $fileBytes,
        string $message = '',
        int $code = 0,
        ?Throwable $previous = null
    ) {
        $this->limitBytes = $limitBytes;
        $this->usedBytes  = $usedBytes;
        $this->fileBytes  = $fileBytes;

        $message = $message ?: sprintf(
            'Storage limit exceeded. Limit: %s, Used: %s, File: %s.',
            $this->formatBytes($limitBytes),
            $this->formatBytes($usedBytes),
            $this->formatBytes($fileBytes),
        );

        parent::__construct($message, $code, $previous);
    }

    public function getLimitBytes(): int  { return $this->limitBytes; }
    public function getUsedBytes(): int   { return $this->usedBytes;  }
    public function getFileBytes(): int   { return $this->fileBytes;  }

    public function toArray(): array
    {
        return [
            'limit_bytes' => $this->limitBytes,
            'used_bytes'  => $this->usedBytes,
            'file_bytes'  => $this->fileBytes,
            'limit_human' => $this->formatBytes($this->limitBytes),
            'used_human'  => $this->formatBytes($this->usedBytes),
            'file_human'  => $this->formatBytes($this->fileBytes),
        ];
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        $value = (float) $bytes;

        while ($value >= 1024 && $i < count($units) - 1) {
            $value /= 1024;
            $i++;
        }

        return round($value, 2) . ' ' . $units[$i];
    }
}