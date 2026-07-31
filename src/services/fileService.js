import { supabase } from './supabaseClient'

const BUCKET = 'procedure-files'

function buildPath(userId, sectionId, fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${sectionId}/${Date.now()}_${safeName}`
}

export async function uploadFile({ userId, sectionId, file }) {
  const path = buildPath(userId, sectionId, file.name)
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('procedure_files')
    .insert({
      section_id: sectionId,
      file_name: file.name,
      file_type: file.type || 'application/octet-stream',
      file_url: path,
      file_size: file.size,
      uploaded_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function replaceFile({ fileRecordId, userId, sectionId, file }) {
  const newFile = await uploadFile({ userId, sectionId, file })
  await deleteFileRecord(fileRecordId, false)
  return newFile
}

export async function getFileSignedUrl(path, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

export async function deleteFileRecord(fileRecordId, removeFromStorage = true) {
  if (removeFromStorage) {
    const { data: fileRow, error: fetchError } = await supabase
      .from('procedure_files')
      .select('file_url')
      .eq('id', fileRecordId)
      .single()
    if (fetchError) throw fetchError
    await supabase.storage.from(BUCKET).remove([fileRow.file_url])
  }
  const { error } = await supabase.from('procedure_files').delete().eq('id', fileRecordId)
  if (error) throw error
}

// --- Voice recordings --------------------------------------------------------

export async function uploadVoiceRecording({ userId, sectionId, blob, duration }) {
  const path = buildPath(userId, sectionId, `voice_${Date.now()}.webm`)
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: '3600',
    contentType: blob.type || 'audio/webm',
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('voice_recordings')
    .insert({
      section_id: sectionId,
      recording_url: path,
      duration,
      uploaded_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVoiceRecording(recordingId) {
  const { data: row, error: fetchError } = await supabase
    .from('voice_recordings')
    .select('recording_url')
    .eq('id', recordingId)
    .single()
  if (fetchError) throw fetchError
  await supabase.storage.from(BUCKET).remove([row.recording_url])
  const { error } = await supabase.from('voice_recordings').delete().eq('id', recordingId)
  if (error) throw error
}
