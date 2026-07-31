import { supabase } from './supabaseClient'

// --- Global dropdowns -------------------------------------------------------

export async function listSpecialties() {
  const { data, error } = await supabase
    .from('surgical_specialties')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function addSpecialty(name, description, userId) {
  const { data, error } = await supabase
    .from('surgical_specialties')
    .insert({ name, description, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listSurgeons(specialtyId) {
  let query = supabase.from('surgeons').select('*').order('name', { ascending: true })
  if (specialtyId) query = query.eq('specialty_id', specialtyId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addSurgeon({ name, specialtyId, hospitalId, licenseNumber, userId }) {
  const { data, error } = await supabase
    .from('surgeons')
    .insert({
      name,
      specialty_id: specialtyId || null,
      hospital_id: hospitalId || null,
      license_number: licenseNumber || null,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listProcedures(surgeonId) {
  let query = supabase.from('surgical_procedures').select('*').order('name', { ascending: true })
  if (surgeonId) query = query.eq('surgeon_id', surgeonId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addProcedure({ name, surgeonId, description, userId }) {
  const { data, error } = await supabase
    .from('surgical_procedures')
    .insert({ name, surgeon_id: surgeonId || null, description: description || null, created_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Surgical records --------------------------------------------------------

export async function listMyRecords(userId) {
  const { data, error } = await supabase
    .from('surgical_records')
    .select(
      `id, status, created_at, updated_at, patient_reference,
       surgical_specialties(name), surgeons(name), surgical_procedures(name), hospitals(name)`
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listSharedWithMe(userId) {
  const { data, error } = await supabase
    .from('procedure_permissions')
    .select(
      `permission_level, created_at,
       surgical_records(id, status, created_at, updated_at, patient_reference,
         surgical_specialties(name), surgeons(name), surgical_procedures(name), hospitals(name), user_id,
         profiles(first_name, last_name))`
    )
    .eq('shared_with_user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRecord(recordId) {
  const { data, error } = await supabase
    .from('surgical_records')
    .select(
      `*, surgical_specialties(name), surgeons(name), surgical_procedures(name), hospitals(name),
       profiles(first_name, last_name, email)`
    )
    .eq('id', recordId)
    .single()
  if (error) throw error
  return data
}

export async function createRecord({ userId, specialtyId, surgeonId, procedureId, hospitalId, patientReference }) {
  const { data, error } = await supabase
    .from('surgical_records')
    .insert({
      user_id: userId,
      specialty_id: specialtyId || null,
      surgeon_id: surgeonId || null,
      procedure_id: procedureId || null,
      hospital_id: hospitalId || null,
      patient_reference: patientReference || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecord(recordId, updates) {
  const { data, error } = await supabase
    .from('surgical_records')
    .update(updates)
    .eq('id', recordId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecord(recordId) {
  const { error } = await supabase.from('surgical_records').delete().eq('id', recordId)
  if (error) throw error
}

// --- Sections -----------------------------------------------------------------

export const DEFAULT_SECTIONS = [
  'Surgeon Preference',
  'Patient Position',
  'Equipment',
  'Instruments',
  'Supplies',
  'Specimen',
  'Blood Bank',
  'Implant',
  'Dressing',
  'Post Op Care',
]

export async function listSections(recordId) {
  const { data, error } = await supabase
    .from('procedure_sections')
    .select('*, procedure_files(*), voice_recordings(*)')
    .eq('record_id', recordId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function ensureDefaultSections(recordId) {
  const existing = await listSections(recordId)
  if (existing.length > 0) return existing

  const rows = DEFAULT_SECTIONS.map((name, index) => ({
    record_id: recordId,
    section_name: name,
    section_type: 'default',
    sort_order: index,
    data_json: {},
  }))
  const { error } = await supabase.from('procedure_sections').insert(rows)
  if (error) throw error
  return listSections(recordId)
}

export async function addCustomSection(recordId, sectionName, sortOrder) {
  const { data, error } = await supabase
    .from('procedure_sections')
    .insert({
      record_id: recordId,
      section_name: sectionName,
      section_type: 'custom',
      sort_order: sortOrder,
      data_json: {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameSection(sectionId, sectionName) {
  const { data, error } = await supabase
    .from('procedure_sections')
    .update({ section_name: sectionName })
    .eq('id', sectionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSectionData(sectionId, dataJson) {
  const { data, error } = await supabase
    .from('procedure_sections')
    .update({ data_json: dataJson })
    .eq('id', sectionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSection(sectionId) {
  const { error } = await supabase.from('procedure_sections').delete().eq('id', sectionId)
  if (error) throw error
}
