import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
  Settings,
  FileCheck
} from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

interface ProcessingResult {
  success: boolean
  message: string
  validationErrors?: string[]
}

interface Stats {
  total_rows: number
  valid_rows: number
  unique_codes: number
  duplicate_codes: number
  total_quantity: number
  validation_warnings: number
}

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [columnConfig, setColumnConfig] = useState({
    quantity: 'Quantity',
    type: 'Type',
    size: 'Size',
    code: 'Code'
  })

  const [options, setOptions] = useState({
    skipDuplicateHeaders: true,
    validateCodePattern: true,
    autoCleanTypes: true
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile?.name.match(/\.(xlsx|xls)$/)) {
      setFile(uploadedFile)
      setError(null)
      setResult(null)
      setStats(null)
    } else {
      setError('Please upload a valid Excel file (.xlsx or .xls)')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  const processFile = async () => {
    if (!file) return
    
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('quantity_col', columnConfig.quantity)
    formData.append('type_col', columnConfig.type)
    formData.append('size_col', columnConfig.size)
    formData.append('code_col', columnConfig.code)
    formData.append('options', JSON.stringify(options))

    try {
      const response = await axios.post('/api/process', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Parse stats from header if present
      const statsHeader = response.headers['x-processing-stats']
      if (statsHeader) {
        setStats(JSON.parse(statsHeader))
      }

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name.replace(/\.(xlsx|xls)$/, '_Processed.xlsx'))
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setResult({
        success: true,
        message: 'File processed successfully! Download started.'
      })
    } catch (err: any) {
      if (err.response?.data) {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string)
            setError(errorData.detail || 'Processing failed')
          } catch {
            setError('Processing failed')
          }
        }
        reader.readAsText(err.response.data)
      } else {
        setError(err.message || 'Network error')
      }
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Zap,
      title: "Smart Cleaning",
      desc: "Auto-detects quantity formats, trims whitespace, validates Type-Size-Code patterns",
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    {
      icon: BarChart3,
      title: "Prawn Code Validation",
      desc: "Ensures codes match {Type}-{Size} pattern (e.g., TS-32, CS-24)",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10"
    },
    {
      icon: Shield,
      title: "Duplicate Detection",
      desc: "Identifies duplicate headers and repeated entries",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    }
  ]

  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden">
      <div className="animated-bg" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-400">Prawn Container Inventory System</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Clean Inventory.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Validated Codes.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Process prawn container inventories with Type-Size-Code validation. 
            Handles TS, CS codes and preserves data for re-import.
          </motion.p>
        </div>

        {/* Main Interface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="grid lg:grid-cols-3 gap-8 mb-16"
        >
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-indigo-400" />
                </div>
                Column Mapping
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Quantity Column
                  </label>
                  <input
                    type="text"
                    value={columnConfig.quantity}
                    onChange={(e) => setColumnConfig(prev => ({ ...prev, quantity: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Type Column
                    </label>
                    <input
                      type="text"
                      value={columnConfig.type}
                      onChange={(e) => setColumnConfig(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Size Column
                    </label>
                    <input
                      type="text"
                      value={columnConfig.size}
                      onChange={(e) => setColumnConfig(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Code Column
                  </label>
                  <input
                    type="text"
                    value={columnConfig.code}
                    onChange={(e) => setColumnConfig(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-white"
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-4"
                >
                  Advanced Options
                  <ArrowRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={options.skipDuplicateHeaders}
                          onChange={(e) => setOptions(prev => ({ ...prev, skipDuplicateHeaders: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-400 group-hover:text-slate-300">Skip duplicate header rows</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={options.validateCodePattern}
                          onChange={(e) => setOptions(prev => ({ ...prev, validateCodePattern: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-400 group-hover:text-slate-300">Validate Type-Size-Code pattern</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={options.autoCleanTypes}
                          onChange={(e) => setOptions(prev => ({ ...prev, autoCleanTypes: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-400 group-hover:text-slate-300">Auto-clean Type values (uppercase)</span>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="glass-panel p-4 flex items-start gap-4 group hover:bg-white/10 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">{feature.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Panel - Upload */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-8 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-violet-400" />
                </div>
                Upload & Process
              </h3>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center ${
                  isDragActive 
                    ? 'border-indigo-500 bg-indigo-500/10 dropzone-active' 
                    : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'
                }`}
              >
                <input {...getInputProps()} />
                
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-6 transition-transform ${isDragActive ? 'scale-110' : ''}`}>
                  <Upload className={`w-10 h-10 ${isDragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                
                {isDragActive ? (
                  <p className="text-xl font-semibold text-indigo-400">Drop your file here</p>
                ) : (
                  <div>
                    <p className="text-xl font-semibold text-slate-300 mb-2">
                      Drag & drop your Excel file
                    </p>
                    <p className="text-slate-500 mb-6">
                      or click to browse (.xlsx, .xls)
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-800">Preserves 4 columns</span>
                      <span className="px-2 py-1 rounded bg-slate-800">Validates codes</span>
                    </div>
                  </div>
                )}
              </div>

              {/* File Preview */}
              <AnimatePresence>
                {file && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 p-5 bg-slate-900/50 rounded-xl border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">{file.name}</p>
                        <p className="text-sm text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB • Ready to process
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Process Button */}
              <AnimatePresence>
                {file && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={processFile}
                    disabled={loading}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg text-white glow-button flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing inventory...</span>
                      </>
                    ) : (
                      <>
                        <span>Process & Download</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Stats Display */}
              <AnimatePresence>
                {stats && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-2xl font-bold text-indigo-400">{stats.total_rows}</p>
                      <p className="text-xs text-slate-500 uppercase">Total Rows</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-2xl font-bold text-emerald-400">{stats.unique_codes}</p>
                      <p className="text-xs text-slate-500 uppercase">Unique Codes</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-2xl font-bold text-amber-400">{stats.total_quantity}</p>
                      <p className="text-xs text-slate-500 uppercase">Total Quantity</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error/Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
                
                {result?.success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{result.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-600 text-sm"
        >
          <p>Optimized for prawn container codes • TS/CS Type validation • Re-import compatible</p>
        </motion.div>
      </div>
    </div>
  )
}

export default App