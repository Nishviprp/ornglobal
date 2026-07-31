import { supabase } from './supabaseClient'

export async function getMyPermission(recordId, userId) {
  const { data, error } = await supabase
    .from('procedure_permissions')
    .select('*')
    .eq('record_id', recordId)
    .eq('shared_with_user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listPermissionsForRecord(recordId) {
  const { data, error } = await supabase
    .from('procedure_permissions')
    .select('*, profiles!procedure_permissions_shared_with_user_id_fkey(first_name, last_name, email)')
    .eq('record_id', recordId)
  if (error) throw error
  return data
}

export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function shareRecord({ recordId, sharedWithUserId, permissionLevel, grantedBy }) {
  const { data, error } = await supabase
    .from('procedure_permissions')
    .upsert(
      {
        record_id: recordId,
        shared_with_user_id: sharedWithUserId,
        permission_level: permissionLevel,
        granted_by: grantedBy,
      },
      { onConflict: 'record_id,shared_with_user_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePermissionLevel(permissionId, permissionLevel) {
  const { data, error } = await supabase
    .from('procedure_permissions')
    .update({ permission_level: permissionLevel })
    .eq('id', permissionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function revokeAccess(permissionId) {
  const { error } = await supabase.from('procedure_permissions').delete().eq('id', permissionId)
  if (error) throw error
}

export function getMyPermissionLevel(record, currentUserId, myPermissionLevel) {
  if (record.user_id === currentUserId) return 'owner'
  return myPermissionLevel || 'read'
}
