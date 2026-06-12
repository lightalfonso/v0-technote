import { pgTable, text, timestamp, boolean, serial, integer, date } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  jobDate: date('job_date').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  workNotes: text('work_notes'),
  problemsFound: text('problems_found'),
  problemsSolved: text('problems_solved'),
  recommendations: text('recommendations'),
  warrantyDuration: text('warranty_duration'),
  warrantyExpiry: date('warranty_expiry'),
  pricePaid: integer('price_paid'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const jobEquipment = pgTable('job_equipment', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }).notNull(),
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  categoryId: integer('category_id'),
  priority: text('priority').notNull().default('normal'),
  tags: text('tags'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const agendaEvents = pgTable('agenda_events', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  eventDate: timestamp('event_date').notNull(),
  endDate: timestamp('end_date'),
  categoryId: integer('category_id'),
  location: text('location'),
  isCompleted: boolean('is_completed').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const softwareLicenses = pgTable('software_licenses', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  softwareName: text('software_name').notNull(),
  version: text('version'),
  serialKey: text('serial_key'),
  licenseType: text('license_type').notNull().default('perpetual'),
  purchaseDate: date('purchase_date'),
  expiryDate: date('expiry_date'),
  maxInstalls: integer('max_installs'),
  currentInstalls: integer('current_installs').notNull().default(0),
  downloadUrl: text('download_url'),
  notes: text('notes'),
  categoryId: integer('category_id'),
  purchasePlace: text('purchase_place'),
  purchaseUrl: text('purchase_url'),
  purchaseUser: text('purchase_user'),
  purchasePassword: text('purchase_password'),
  clientName: text('client_name'),
  clientPhone: text('client_phone'),
  pricePaid: integer('price_paid'),
  installationNotes: text('installation_notes'),
  warrantyDuration: text('warranty_duration'),
  warrantyCoverage: text('warranty_coverage'),
  activationType: text('activation_type'),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),
  jobId: integer('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  categoryId: integer('category_id'),
  ownerName: text('owner_name'),
  ownerType: text('owner_type').notNull().default('client'),
  purchaseDate: date('purchase_date'),
  warrantyExpiry: date('warranty_expiry'),
  capacity: text('capacity'),
  specs: text('specs'),
  notes: text('notes'),
  status: text('status').notNull().default('active'),
  lastMaintenance: date('last_maintenance'),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'set null' }),
  pricePaid: integer('price_paid'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Types
export type Client = typeof clients.$inferSelect
export type Category = typeof categories.$inferSelect
export type Note = typeof notes.$inferSelect
export type AgendaEvent = typeof agendaEvents.$inferSelect
export type SoftwareLicense = typeof softwareLicenses.$inferSelect
export type Equipment = typeof equipment.$inferSelect
export type Job = typeof jobs.$inferSelect
export type JobEquipment = typeof jobEquipment.$inferSelect
