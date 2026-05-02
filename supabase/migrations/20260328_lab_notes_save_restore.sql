-- ============================================
-- 实验室共创笔记 保存恢复 + 版本历史系统
-- ============================================

-- 1. 当前文档状态表（每个房间一条记录，Yjs 二进制快照）
CREATE TABLE IF NOT EXISTS lab_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid NOT NULL REFERENCES lab_rooms(id) ON DELETE CASCADE,
    yjs_state bytea NOT NULL,                          -- Y.encodeStateAsUpdate(doc) 的二进制数据
    updated_by uuid REFERENCES auth.users(id),         -- 最后保存者
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(room_id)                                    -- 每个房间只有一条当前状态
);

-- 2. 版本快照表（定期保存 + 手动保存）
CREATE TABLE IF NOT EXISTS lab_note_snapshots (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid NOT NULL REFERENCES lab_rooms(id) ON DELETE CASCADE,
    yjs_state bytea NOT NULL,
    snapshot_type text NOT NULL DEFAULT 'auto',        -- 'auto' = 定时自动, 'manual' = 用户手动, 'pre_rollback' = 回滚前备份
    label text,                                        -- 用户可选标签，如 "公式推导完成"
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 索引：按房间 + 时间排序查询
CREATE INDEX IF NOT EXISTS idx_lab_note_snapshots_room_time 
    ON lab_note_snapshots(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_notes_room 
    ON lab_notes(room_id);

-- ============================================
-- RLS 策略
-- ============================================

ALTER TABLE lab_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_note_snapshots ENABLE ROW LEVEL SECURITY;

-- lab_notes: 仅房间成员可读写
CREATE POLICY "lab_notes_select" ON lab_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lab_members
            WHERE lab_members.room_id = lab_notes.room_id
            AND lab_members.user_id = auth.uid()
        )
    );

CREATE POLICY "lab_notes_insert" ON lab_notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lab_members
            WHERE lab_members.room_id = lab_notes.room_id
            AND lab_members.user_id = auth.uid()
        )
    );

CREATE POLICY "lab_notes_update" ON lab_notes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lab_members
            WHERE lab_members.room_id = lab_notes.room_id
            AND lab_members.user_id = auth.uid()
        )
    );

-- lab_note_snapshots: 仅房间成员可读；仅编辑者以上可写
CREATE POLICY "lab_note_snapshots_select" ON lab_note_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lab_members
            WHERE lab_members.room_id = lab_note_snapshots.room_id
            AND lab_members.user_id = auth.uid()
        )
    );

CREATE POLICY "lab_note_snapshots_insert" ON lab_note_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lab_members
            WHERE lab_members.room_id = lab_note_snapshots.room_id
            AND lab_members.user_id = auth.uid()
            AND lab_members.role IN ('owner', 'admin', 'editor')
        )
    );

-- 删除快照仅管理员和创建者
CREATE POLICY "lab_note_snapshots_delete" ON lab_note_snapshots
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lab_members
            WHERE lab_members.room_id = lab_note_snapshots.room_id
            AND lab_members.user_id = auth.uid()
            AND lab_members.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 自动清理旧快照函数（保留最近50个auto快照 + 全部手动快照）
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_lab_snapshots(target_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM lab_note_snapshots
    WHERE room_id = target_room_id
    AND snapshot_type = 'auto'
    AND id NOT IN (
        SELECT id FROM lab_note_snapshots
        WHERE room_id = target_room_id
        AND snapshot_type = 'auto'
        ORDER BY created_at DESC
        LIMIT 50
    );
END;
$$;
