<?php

namespace App\Core;

use App\Exceptions\ApiException;
use Throwable;

/**
 * Converts any exception into the app's uniform JSON error envelope:
 * { success: false, error: true, code, message, ...extra }
 */
class ExceptionHandler
{
    public static function handle(Throwable $e): void
    {
        if ($e instanceof ApiException) {
            if ($e->status >= 500) {
                Logger::error('unhandled', $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            }
            self::respond($e->errorCode, $e->getMessage(), $e->status, $e->extra);
            return;
        }

        Logger::error('unhandled', $e->getMessage(), [
            'file'  => $e->getFile(),
            'line'  => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        $debug = (bool) Config::get('app.debug', false);
        self::respond(
            'server_error',
            $debug ? $e->getMessage() : 'حدث خطأ غير متوقع',
            500,
            $debug ? ['file' => $e->getFile(), 'line' => $e->getLine()] : []
        );
    }

    private static function respond(string $code, string $message, int $status, array $extra): void
    {
        Response::json(array_merge([
            'success' => false,
            'error'   => true,
            'code'    => $code,
            'message' => $message,
        ], $extra), $status);
    }
}
