<?php

namespace App\Services;

use App\Core\Database;

/**
 * Port of sanad_next_content_order($group_id): computes the next menu_order
 * value for a new content item appended to a group, so mixed content types
 * (video/note/link/exam/assignment) interleave in a single shared order per
 * group, exactly like the original's cross-post-type MAX(menu_order) query.
 *
 * Phase 4 note: extended additively with exams/assignments once those
 * tables existed — this only ADDS more source tables to the MAX()
 * computation; it does not change how video/note/link ordering behaved in
 * Phase 3 (those tables/queries are untouched), so all Phase 3 CRUD/reorder
 * tests remain valid unchanged.
 */
class ContentOrderService
{
    private const TABLES = ['videos', 'notes', 'links', 'exams', 'assignments'];

    public static function nextOrder(?int $groupId): int
    {
        if (!$groupId) {
            return 0;
        }

        $db = Database::connection();
        $selects = array_map(
            fn ($table) => "SELECT MAX(menu_order) AS m FROM {$table} WHERE group_id = ?",
            self::TABLES
        );
        $sql = 'SELECT MAX(m) FROM (' . implode(' UNION ALL ', $selects) . ') AS combined';

        $stmt = $db->prepare($sql);
        $stmt->execute(array_fill(0, count(self::TABLES), $groupId));
        $max = $stmt->fetchColumn();

        return $max !== null ? ((int) $max) + 1 : 0;
    }
}
