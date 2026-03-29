import { CheckCircle, AlertCircle, Download, TrendingUp, Package, Hash } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
  total_rows: number
  valid_rows: number
  unique_codes: number
  duplicate_codes: number
  total_quantity: number
}

interface ResultsTableProps {
  stats: Stats | null
  error: string | null
  filename: string | null
}

export function ResultsTable({ stats, error, filename }: ResultsTableProps) {
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-400"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-red-300">Processing Error</h4>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </motion.div>
    )
  }

  if (!stats) return null

  const statItems = [
    { 
      label: "Total Rows", 
      value: stats.total_rows, 
      icon: Hash,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    { 
      label: "Valid Rows", 
      value: stats.valid_rows, 
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    { 
      label: "Unique Codes", 
      value: stats.unique_codes, 
      icon: Package,
      color: "text-violet-400",
      bg: "bg-violet-400/10"
    },
    { 
      label: "Total Quantity", 
      value: stats.total_quantity.toLocaleString(), 
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    }
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h4 className="font-semibold text-emerald-300">Processing Complete!</h4>
          <p className="text-sm text-emerald-400/80">{filename} downloaded</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {stats.duplicate_codes > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Found <span className="font-bold">{stats.duplicate_codes}</span> duplicate codes - 
            check "Duplicates" sheet in downloaded file
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}