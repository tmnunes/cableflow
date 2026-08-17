export interface Supplier {
  id: string
  name: string
  taxNumber?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  notes?: string
  active: boolean
  createdAt: string
  updatedAt: string
}
