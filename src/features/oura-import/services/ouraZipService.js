import JSZip from 'jszip'
import Papa from 'papaparse'
import { buildImportTable, summarizeImport } from '../lib/ouraImportTransforms'

function detectDelimiterFromHeader(csvText) {
  const [headerLine = ''] = csvText.split(/\r?\n/, 1)
  const candidates = [',', ';', '\t', '|']

  const scores = candidates.map((delimiter) => ({
    delimiter,
    count: headerLine.split(delimiter).length - 1,
  }))

  const bestMatch = scores.sort((left, right) => right.count - left.count)[0]
  return bestMatch?.count > 0 ? bestMatch.delimiter : ','
}

function parseCsv(csvText, sourcePath) {
  const delimiter = detectDelimiterFromHeader(csvText)
  const parsed = Papa.parse(csvText, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  const hardErrors = parsed.errors.filter((error) => error.code !== 'UndetectableDelimiter')
  if (hardErrors.length > 0) {
    throw new Error(`${sourcePath}: ${hardErrors[0].message}`)
  }

  const columns = parsed.meta.fields ?? Object.keys(parsed.data[0] ?? {})
  return {
    rows: parsed.data,
    columns,
  }
}

export async function parseOuraZip(file, onProgress) {
  onProgress?.({
    percent: 4,
    stage: 'Opening zip archive',
    currentFileName: file.name,
  })

  const zip = await JSZip.loadAsync(file)
  const csvEntries = Object.values(zip.files)
    .filter((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.csv'))
    .sort((left, right) => left.name.localeCompare(right.name))

  if (csvEntries.length === 0) {
    throw new Error('The selected zip file does not contain any CSV exports.')
  }

  const tables = []

  for (const [index, entry] of csvEntries.entries()) {
    onProgress?.({
      percent: Math.max(6, Math.round((index / csvEntries.length) * 100)),
      stage: 'Converting CSV files to preview tables',
      currentFileName: entry.name,
      processedTables: index,
      totalTables: csvEntries.length,
    })

    const csvText = await entry.async('string')
    const { rows, columns } = parseCsv(csvText, entry.name)

    tables.push(
      buildImportTable({
        path: entry.name,
        csvText,
        rows,
        columns,
        index,
      }),
    )

    onProgress?.({
      percent: Math.round(((index + 1) / csvEntries.length) * 100),
      stage: 'Converting CSV files to preview tables',
      currentFileName: entry.name,
      processedTables: index + 1,
      totalTables: csvEntries.length,
    })
  }

  const summary = summarizeImport(tables)

  return {
    fileName: file.name,
    tableCount: summary.tableCount,
    rowCount: summary.rowCount,
    derivedMetricCount: summary.derivedMetricCount,
    derivedTagCount: summary.derivedTagCount,
    tables,
  }
}
