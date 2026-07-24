<?php

namespace App\Controllers;

use App\Core\BaseController;
use App\Core\Config;
use App\Core\Request;
use App\Exceptions\ApiException;
use App\Middleware\Auth;

/**
 * Phase 6 addition: the original WordPress backend used core WP media
 * (`POST /wp/v2/media`) for file uploads — course images, note attachments,
 * question images, assignment submissions. backend-v2 has no WP media
 * library, so this replicates just enough of that endpoint's contract for
 * the frontend to keep working unchanged: same path, multipart upload,
 * and a response containing both `id` and `source_url`.
 *
 * Note: backend-v2 stores `image`/`file_url` columns as plain URL strings
 * (Phase 3 design), not attachment IDs. CourseManager.tsx assigns
 * `media.id` directly into the course's `image` field, so `id` here is set
 * to the same URL as `source_url` (not a numeric ID) — this makes that
 * existing frontend code path work correctly without editing it.
 */
class UploadController extends BaseController
{
    private const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];

    // Real (sniffed) MIME types allowed per extension — an attacker can name a file
    // "x.jpg" but can't make its actual bytes sniff as image/jpeg, so this is the
    // real gate; the extension check above only picks the allow-list bucket.
    private const ALLOWED_MIME_TYPES = [
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
        'gif'  => ['image/gif'],
        'webp' => ['image/webp'],
        'pdf'  => ['application/pdf'],
        'doc'  => ['application/msword'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip', // .docx is a zip container; some finfo builds report it as such
        ],
    ];

    public function store(Request $request): void
    {
        Auth::requireTeacherArea($request);

        if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'] ?? '')) {
            throw new ApiException('missing_file', 'الملف مطلوب', 400);
        }

        $file = $_FILES['file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new ApiException('upload_failed', 'فشل رفع الملف', 400);
        }
        if ($file['size'] > self::MAX_BYTES) {
            throw new ApiException('file_too_large', 'حجم الملف كبير جدًا (الحد الأقصى 10 ميجابايت)', 400);
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new ApiException('invalid_file_type', 'نوع الملف غير مسموح', 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $actualMime = $finfo->file($file['tmp_name']) ?: '';
        if (!in_array($actualMime, self::ALLOWED_MIME_TYPES[$extension], true)) {
            throw new ApiException('invalid_file_type', 'نوع الملف غير مسموح', 400);
        }

        $uploadsDir = dirname(__DIR__, 2) . '/public/uploads';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0775, true);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $destination = $uploadsDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new ApiException('upload_failed', 'فشل حفظ الملف', 500);
        }

        $url = rtrim(Config::get('app.url'), '/') . '/uploads/' . $filename;

        $this->json([
            'id'         => $url,
            'source_url' => $url,
        ], 201);
    }
}
