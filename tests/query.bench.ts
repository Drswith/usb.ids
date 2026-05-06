import { bench, describe } from 'vitest'
import { filterVendors, searchInData } from '../src/pure/query'
import { mockUsbData } from './setup'

describe('query bench', () => {
  bench('filterVendors exact id', () => {
    filterVendors(mockUsbData, '05ac')
  })

  bench('searchInData small dataset', () => {
    searchInData(mockUsbData, 'Apple')
  })
})
