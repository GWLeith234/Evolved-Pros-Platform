import { adminClient } from '@/lib/supabase/admin'

/**
 * Log an admin action to the audit trail.
 * Fire-and-forget — never throws, never blocks the response.
 */
export function logAdminAction(opts: {
  adminId: string
  action: string
  targetUserId?: string
  details?: Record<string, unknown>
}): void {
  adminClient
    .from('admin_audit_log')
    .insert({
      admin_id:       opts.adminId,
      action:         opts.action,
      target_user_id: opts.targetUserId ?? null,
      details:        opts.details ?? null,
    })
    .then(({ error }) => {
      if (error) console.error('[AuditLog] Failed to write:', error.message)
    })
}
