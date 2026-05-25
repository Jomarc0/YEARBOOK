<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;
use Throwable;

/**
 * Thrown when a file upload to the storage provider fails.
 */
class StorageUploadException extends RuntimeException
{
    public function __construct(
        string $message = 'File upload failed.',
        int $code = 0,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }
}